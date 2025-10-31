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
  
  // Calculate text size based on length - responsive for all screen sizes
  const getTextSize = (text: string) => {
    const length = text.length
    if (length > 30) return "text-xl sm:text-2xl md:text-3xl"
    if (length > 20) return "text-2xl sm:text-3xl md:text-4xl"
    if (length > 10) return "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
    return "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
  }
  
  const frontTextSize = getTextSize(front.text)
  const backTextSize = getTextSize(back.text)

  return (
    <div className="flex flex-col items-center gap-4 w-full px-4 sm:px-6 md:px-8">
      <div
        className={`flip-card aspect-square w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] lg:max-w-[450px] cursor-pointer ${isFlipped ? "flipped" : ""}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="flip-card-inner">
          {/* Front */}
          <div className="flip-card-front">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-4 sm:p-6 md:p-8 shadow-xl relative">
              <div className="text-center w-full px-2 sm:px-4 flex-1 flex flex-col justify-center">
                <div dir={front.dir} className={`${frontTextSize} font-bold leading-tight break-words text-foreground`}>
                  {front.text}
                </div>
                {front.subtext && (
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground break-words">
                    {front.subtext}
                  </div>
                )}
              </div>
              {onAudio && (
                <Button
                  variant="default"
                  size="lg"
                  className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full shadow-lg transition-all z-10 ${
                    isPlayingAudio ? "scale-110 bg-primary" : ""
                  }`}
                  onClick={handleAudioClick}
                >
                  <Volume2 className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-primary bg-primary p-4 sm:p-6 md:p-8 text-primary-foreground shadow-xl relative">
              <div className="text-center w-full px-2 sm:px-4 flex-1 flex flex-col justify-center">
                <div dir={back.dir} className={`${backTextSize} font-bold leading-tight break-words`}>
                  {back.text}
                </div>
                {back.subtext && (
                  <div className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base lg:text-lg opacity-90 break-words">
                    {back.subtext}
                  </div>
                )}
              </div>
              {card.tags && card.tags.length > 0 && (
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex flex-wrap gap-1 sm:gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary-foreground/20 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground px-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-center">Klik of druk op spatie om te draaien</span>
        </div>
        {onAudio && (
          <div className="flex items-center gap-2">
            <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-center">Klik op de knop om audio af te spelen</span>
          </div>
        )}
      </div>
    </div>
  )
}
