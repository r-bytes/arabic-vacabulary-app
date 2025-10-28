"use client"

import { Flashcard } from "@/components/flashcard"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { review } from "@/lib/srs"
import { useVocabStore } from "@/lib/store"
import type { Card } from "@/lib/types"
import { ChevronLeft, ChevronRight, RotateCcw, Volume2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface FlashcardSessionProps {
  cards: Card[]
  onExit: () => void
}

export function FlashcardSession({ cards, onExit }: FlashcardSessionProps) {
  const { direction, updateCard } = useVocabStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionCards, setSessionCards] = useState<Card[]>(cards)
  const isApple = typeof navigator !== "undefined" && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent)
  const [autoPlayAudio, setAutoPlayAudio] = useState(!isApple)
  const [hasInteracted, setHasInteracted] = useState(false)
  const pointerStartXRef = useRef<number | null>(null)
  const pointerDeltaXRef = useRef<number>(0)
  const pointerActiveRef = useRef<boolean>(false)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const swipeAreaRef = useRef<HTMLDivElement>(null)

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
    setSessionCards((prev) => shuffle(prev))
    setCurrentIndex(0)
  }

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
      audio.play().catch((err) => console.error("[v0] Audio playback failed:", err))
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
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">Sessie voltooid!</h2>
          <div className="flex items-center justify-center gap-3">
            <Button variant="default" onClick={handleRestart}>
              <RotateCcw className="mr-2 h-4 w-4" /> Opnieuw (shuffle)
            </Button>
            <Button onClick={onExit}>Terug naar overzicht</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Kaart {currentIndex + 1} van {sessionCards.length}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleRestart} title="Opnieuw (shuffle)">
              <RotateCcw className="mr-2 h-4 w-4" /> Opnieuw
            </Button>
            <div className="flex items-center gap-2">
              <Switch id="auto-audio" checked={autoPlayAudio} onCheckedChange={setAutoPlayAudio} />
              <Label htmlFor="auto-audio" className="text-sm cursor-pointer">
                Auto-play audio
              </Label>
            </div>
            <Button variant="ghost" size="icon" onClick={onExit}>
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
    </div>
  )
}
