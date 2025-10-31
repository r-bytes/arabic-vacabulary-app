"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import type { Card, Direction } from "@/lib/types"
import { RotateCcw, Volume2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface FlashcardProps {
  card: Card
  direction: Direction
  onAudio?: () => void
}

export function Flashcard({ card, direction, onAudio }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingRef = useRef(false)
  
  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false)
  }, [card.id, direction])

  const getFront = () => {
    if (direction === "ar-nl" || direction === "ar-en") {
      return {
        text: card.ar,
        subtext: card.translit,
        dir: "rtl" as const,
      }
    } else {
      const text = direction === "nl-ar" ? card.gloss.nl : card.gloss.en
      return {
        text: text || "—",
        subtext: undefined,
        dir: "ltr" as const,
      }
    }
  }

  const getBack = () => {
    if (direction === "ar-nl" || direction === "ar-en") {
      const text = direction === "ar-nl" ? card.gloss.nl : card.gloss.en
      return {
        text: text || "—",
        subtext: undefined,
        dir: "ltr" as const,
      }
    } else {
      return {
        text: card.ar,
        subtext: card.translit,
        dir: "rtl" as const,
      }
    }
  }

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Prevent double-click/rapid clicks
    if (isPlayingRef.current) return
    
    isPlayingRef.current = true
    setIsPlayingAudio(true)
    onAudio?.()
    
    // Clear any existing timeout
    if (audioTimeoutRef.current) {
      clearTimeout(audioTimeoutRef.current)
    }
    
    // Reset after 2 seconds
    audioTimeoutRef.current = setTimeout(() => {
      setIsPlayingAudio(false)
      isPlayingRef.current = false
    }, 2000)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (audioTimeoutRef.current) {
        clearTimeout(audioTimeoutRef.current)
      }
    }
  }, [])

  const front = getFront()
  const back = getBack()
  
  // Calculate text size based on length
  const getTextSize = (text: string) => {
    const length = text.length
    if (length > 30) return "text-2xl sm:text-3xl"
    if (length > 20) return "text-3xl sm:text-4xl"
    if (length > 10) return "text-4xl sm:text-5xl"
    return "text-5xl sm:text-6xl"
  }
  
  const frontTextSize = getTextSize(front.text)
  const backTextSize = getTextSize(back.text)

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flip-card h-96 w-full max-w-2xl cursor-pointer ${isFlipped ? "flipped" : ""}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 bg-card p-8 shadow-lg">
              <div className="text-center w-full px-4">
                <div dir={front.dir} className={`${frontTextSize} font-bold leading-tight break-words`}>
                  {front.text}
                </div>
                {front.subtext && <div className="mt-4 text-sm sm:text-lg text-muted-foreground break-words">{front.subtext}</div>}
              </div>
              {onAudio && (
                <Button
                  variant="default"
                  size="lg"
                  className={`absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all ${
                    isPlayingAudio ? "scale-110 bg-primary" : ""
                  }`}
                  onClick={handleAudioClick}
                >
                  <Volume2 className={`h-6 w-6 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 bg-primary p-8 text-primary-foreground shadow-lg">
              <div className="text-center w-full px-4">
                <div dir={back.dir} className={`${backTextSize} font-bold leading-tight break-words`}>
                  {back.text}
                </div>
                {back.subtext && <div className="mt-4 text-sm sm:text-lg opacity-90 break-words">{back.subtext}</div>}
              </div>
              {card.tags && card.tags.length > 0 && (
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          <span>Klik of druk op spatie om te draaien</span>
        </div>
        {onAudio && (
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span>Klik op de knop om audio af te spelen</span>
          </div>
        )}
      </div>
    </div>
  )
}
