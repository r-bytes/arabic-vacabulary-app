"use client"

import type React from "react"

import { useState } from "react"
import type { Card, Direction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Volume2, RotateCcw } from "lucide-react"

interface FlashcardProps {
  card: Card
  direction: Direction
  onAudio?: () => void
}

export function Flashcard({ card, direction, onAudio }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

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
    setIsPlayingAudio(true)
    onAudio?.()
    setTimeout(() => setIsPlayingAudio(false), 2000)
  }

  const front = getFront()
  const back = getBack()

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
              <div className="text-center">
                <div dir={front.dir} className="text-5xl font-bold leading-tight">
                  {front.text}
                </div>
                {front.subtext && <div className="mt-4 text-lg text-muted-foreground">{front.subtext}</div>}
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
              <div className="text-center">
                <div dir={back.dir} className="text-5xl font-bold leading-tight">
                  {back.text}
                </div>
                {back.subtext && <div className="mt-4 text-lg opacity-90">{back.subtext}</div>}
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
