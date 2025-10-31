"use client"

import { CardEditorModal } from "@/components/card-editor-modal"
import { Flashcard } from "@/components/flashcard"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { review } from "@/lib/srs"
import { useVocabStore } from "@/lib/store"
import type { Card } from "@/lib/types"
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Edit, RotateCcw, Shuffle, Volume2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface FlashcardSessionProps {
  cards: Card[]
  onExit: () => void
}

export function FlashcardSession({ cards, onExit }: FlashcardSessionProps) {
  const { direction, updateCard, cards: storeCards } = useVocabStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionCards, setSessionCards] = useState<Card[]>(cards)
  const originalCardsRef = useRef<Card[]>(cards)
  
  // Sync sessionCards with store when cards are updated
  useEffect(() => {
    if (storeCards.length > 0) {
      const updateCards = (cardList: Card[]) => {
        return cardList.map(card => {
          const updatedCard = storeCards.find(c => c.id === card.id)
          return updatedCard || card
        })
      }
      
      setSessionCards(prev => updateCards(prev))
      originalCardsRef.current = updateCards(originalCardsRef.current)
    }
  }, [storeCards])
  const isApple = typeof navigator !== "undefined" && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent)
  const [autoPlayAudio, setAutoPlayAudio] = useState(!isApple)
  const [hasInteracted, setHasInteracted] = useState(false)
  const pointerStartXRef = useRef<number | null>(null)
  const pointerDeltaXRef = useRef<number>(0)
  const pointerActiveRef = useRef<boolean>(false)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const swipeAreaRef = useRef<HTMLDivElement>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [reviewCards, setReviewCards] = useState<Set<string>>(new Set())
  const [showReview, setShowReview] = useState(false)
  const originalIndexRef = useRef<number>(0) // Remember position when entering review

  const currentCard = sessionCards[currentIndex]
  const progress = ((currentIndex + 1) / sessionCards.length) * 100

  useEffect(() => {
    if (autoPlayAudio && hasInteracted && currentCard) {
      setTimeout(() => handleAudio(), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, autoPlayAudio, hasInteracted])

  useEffect(() => {
    const markInteraction = () => setHasInteracted(true)
    window.addEventListener("pointerdown", markInteraction, { once: true })
    window.addEventListener("keydown", markInteraction, { once: true })
    return () => {
      window.removeEventListener("pointerdown", markInteraction)
      window.removeEventListener("keydown", markInteraction)
    }
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
      } else if (e.key === "ArrowRight") {
        handleNext()
      } else if (e.key === "ArrowLeft") {
        handlePrevious()
      } else if (e.key === "Escape") {
        onExit()
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        handleGrade(Number.parseInt(e.key))
      } else if (e.key === "a" || e.key === "A") {
        handleAudio()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, sessionCards.length])

  const handleNext = () => {
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const shuffle = (list: Card[]): Card[] => {
    const arr = [...list]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }

  const handleRestart = () => {
    // Continue from start without shuffle
    setCurrentIndex(0)
    setReviewCards(new Set())
    setShowReview(false)
  }

  const handleShuffle = () => {
    // Explicit shuffle - only when clicked
    if (showReview) {
      // Shuffle review cards
      const reviewCardsList = sessionCards.filter(card => reviewCards.has(card.id))
      setSessionCards(shuffle(reviewCardsList))
    } else {
      // Shuffle all cards
      setSessionCards((prev) => shuffle(prev))
    }
    setCurrentIndex(0)
  }

  const toggleReview = (cardId: string) => {
    setReviewCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const startReview = () => {
    const reviewCardsList = sessionCards.filter(card => reviewCards.has(card.id))
    if (reviewCardsList.length > 0) {
      // Remember current position before entering review
      originalIndexRef.current = currentIndex
      setSessionCards(reviewCardsList)
      setCurrentIndex(0)
      setShowReview(true)
    }
  }

  const exitReview = () => {
    // Return to original cards and position when exiting review
    setSessionCards(originalCardsRef.current)
    setCurrentIndex(originalIndexRef.current)
    setShowReview(false)
  }
  
  const handleExit = () => {
    // If in review mode, exit review first instead of closing session
    if (showReview) {
      exitReview()
    } else {
      onExit()
    }
  }

  const isMarkedForReview = reviewCards.has(currentCard?.id || "")

  const handleGrade = (grade: number) => {
    const newSrs = review(currentCard.srs, grade)
    updateCard(currentCard.id, { srs: newSrs })

    if (currentIndex < sessionCards.length - 1) {
      handleNext()
    }
  }

  const handleAudio = () => {
    const textToSpeak = direction.startsWith("ar-") ? currentCard.ar : currentCard.gloss.nl || currentCard.gloss.en

    if (currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl)
      audio.play().catch((err) => console.error("Audio playback failed:", err))
    } else if (textToSpeak) {
      // Try cloud TTS first, then fall back to browser TTS
      const lang = direction.startsWith("ar-") || direction.endsWith("-ar") ? "ar" : direction.includes("nl") ? "nl" : "en"
      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, lang, ttsHint: currentCard.ttsHint }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`TTS HTTP ${res.status}`)
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          return audio.play()
        })
        .catch(() => {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel()

            const utterance = new SpeechSynthesisUtterance(textToSpeak)
            if (direction.startsWith("ar-") || direction.endsWith("-ar")) {
              utterance.lang = currentCard.ttsHint || "ar-SA"
            } else if (direction.includes("nl")) {
              utterance.lang = "nl-NL"
            } else {
              utterance.lang = "en-US"
            }
            utterance.rate = 0.75
            utterance.pitch = 1.0
            utterance.volume = 1.0
            window.speechSynthesis.speak(utterance)
          }
        })
    } else if (textToSpeak && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(textToSpeak)

      // Set language based on direction
      if (direction.startsWith("ar-") || direction.endsWith("-ar")) {
        utterance.lang = currentCard.ttsHint || "ar-SA"
      } else if (direction.includes("nl")) {
        utterance.lang = "nl-NL"
      } else {
        utterance.lang = "en-US"
      }

      utterance.rate = 0.75
      utterance.pitch = 1.0
      utterance.volume = 1.0

      window.speechSynthesis.speak(utterance)
    }
  }

  if (!currentCard) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="mb-4 text-2xl font-bold">
            {showReview ? "Review voltooid! 🎉" : "Sessie voltooid! 🎉"}
          </h2>
          
          {reviewCards.size > 0 && !showReview && (
            <div className="mb-6 rounded-lg bg-primary/10 p-4">
              <p className="mb-2 text-lg font-semibold text-primary">
                {reviewCards.size} woorden gemarkeerd voor review
              </p>
              <p className="text-sm text-muted-foreground">
                Oefen deze woorden extra voor betere beheersing
              </p>
            </div>
          )}
          
          <div className="flex flex-col items-center justify-center gap-3">
            {!showReview ? (
              <>
                {reviewCards.size > 0 && (
                  <Button 
                    variant="default" 
                    size="lg" 
                    onClick={startReview}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <BookmarkCheck className="mr-2 h-5 w-5" />
                    Start Review ({reviewCards.size} kaarten)
                  </Button>
                )}
                <div className="flex w-full gap-3">
                  <Button variant="outline" size="lg" onClick={handleRestart} className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" /> Opnieuw
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleShuffle} className="flex-1">
                    <Shuffle className="mr-2 h-4 w-4" /> Shuffle
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="default" size="lg" onClick={exitReview} className="w-full bg-primary hover:bg-primary/90">
                  <ChevronRight className="mr-2 h-5 w-5" /> Doorgaan vanaf waar je was
                </Button>
                <div className="flex w-full gap-3">
                  <Button variant="outline" size="lg" onClick={handleRestart} className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" /> Opnieuw vanaf begin
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleShuffle} className="flex-1">
                    <Shuffle className="mr-2 h-4 w-4" /> Shuffle
                  </Button>
                </div>
              </>
            )}
            <Button variant="ghost" onClick={handleExit} className="w-full">
              {showReview ? "Terug naar overzicht" : "Terug naar overzicht"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card p-4">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {showReview ? "Review: " : ""}Kaart {currentIndex + 1} van {sessionCards.length}
            {reviewCards.size > 0 && !showReview && (
              <span className="ml-2 text-primary hidden sm:inline">({reviewCards.size} gemarkeerd)</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!showReview ? (
              <>
                <Button variant="outline" size="sm" onClick={handleRestart} title="Opnieuw vanaf begin" className="text-xs">
                  <RotateCcw className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Opnieuw</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleShuffle} title="Shuffle kaarten" className="text-xs">
                  <Shuffle className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Shuffle</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={exitReview} title="Terug naar volledige set" className="text-xs">
                <X className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Uit Review</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} title="Bewerk kaart" className="text-xs">
              <Edit className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Bewerk</span>
            </Button>
            <Button 
              variant={isMarkedForReview ? "default" : "outline"} 
              size="sm" 
              onClick={() => toggleReview(currentCard.id)}
              title={isMarkedForReview ? "Verwijder uit review" : "Markeer voor review"}
              className="text-xs"
            >
              {isMarkedForReview ? (
                <BookmarkCheck className="h-4 w-4 sm:mr-2" />
              ) : (
                <Bookmark className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Review</span>
            </Button>
            {reviewCards.size > 0 && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={startReview} 
                title={`Start review met ${reviewCards.size} kaarten`} 
                className="text-xs bg-primary hover:bg-primary/90"
              >
                <BookmarkCheck className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Review ({reviewCards.size})</span>
                <span className="sm:hidden">{reviewCards.size}</span>
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Switch id="auto-audio" checked={autoPlayAudio} onCheckedChange={setAutoPlayAudio} />
              <Label htmlFor="auto-audio" className="text-xs sm:text-sm cursor-pointer hidden sm:inline">
                Auto-play audio
              </Label>
            </div>
            <Button variant="ghost" size="icon" onClick={handleExit} className="h-8 w-8" title={showReview ? "Uit review mode" : "Sluit sessie"}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div
        ref={swipeAreaRef}
        className="flex flex-1 items-center justify-center p-8"
        onPointerDown={(e) => {
          // Left click or touch only
          if (e.pointerType === "mouse" && e.button !== 0) return
          e.preventDefault()
          pointerActiveRef.current = true
          pointerStartXRef.current = e.clientX
          pointerDeltaXRef.current = 0
          setIsDragging(true)
          setDragX(0)
        }}
        onPointerMove={(e) => {
          if (!pointerActiveRef.current || pointerStartXRef.current == null) return
          e.preventDefault()
          pointerDeltaXRef.current = e.clientX - pointerStartXRef.current
          setDragX(pointerDeltaXRef.current)
        }}
        onPointerUp={(e) => {
          if (!pointerActiveRef.current) return
          e.preventDefault()
          const threshold = 50
          const dx = pointerDeltaXRef.current
          pointerActiveRef.current = false
          pointerStartXRef.current = null
          pointerDeltaXRef.current = 0
          if (Math.abs(dx) < threshold) {
            // Snap back
            setIsDragging(false)
            setDragX(0)
            return
          }
          // Animate off-screen then change card
          const direction = dx < 0 ? -1 : 1
          setIsDragging(false)
          const areaWidth = swipeAreaRef.current?.clientWidth || window.innerWidth || 600
          setDragX(direction * Math.ceil(areaWidth * 1.2))
          setTimeout(() => {
            setDragX(0)
            if (direction < 0) {
              handleNext()
            } else {
              handlePrevious()
            }
          }, 150)
        }}
        onPointerLeave={() => {
          // Cancel when leaving area with pointer down
          pointerActiveRef.current = false
          pointerStartXRef.current = null
          pointerDeltaXRef.current = 0
          setIsDragging(false)
          setDragX(0)
        }}
        // Prevent the browser from hijacking horizontal swipe (especially on iOS)
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="will-change-transform"
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 40}deg)`,
            opacity: Math.max(0.2, 1 - Math.min(1, Math.abs(dragX) / ((swipeAreaRef.current?.clientWidth || 300) * 0.8))),
            transition: isDragging ? "none" : "transform 150ms ease-out, opacity 150ms ease-out",
          }}
        >
          <Flashcard card={currentCard} direction={direction} onAudio={handleAudio} />
        </div>
      </div>

      <div className="border-t bg-card p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Vorige
            </Button>
            <Button variant="outline" onClick={handleAudio}>
              <Volume2 className="mr-2 h-4 w-4" />
              Speel audio (A)
            </Button>
            <Button variant="outline" onClick={handleNext} disabled={currentIndex === sessionCards.length - 1}>
              Volgende
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardEditorModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        card={currentCard}
      />
    </div>
  )
}
