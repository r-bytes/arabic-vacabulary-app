"use client"

import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import { useState } from "react"

interface ExampleSentenceProps {
  sentence: string
  lang?: "ar" | "nl" | "en"
  translation?: { nl?: string; en?: string }
  className?: string
}

export function ExampleSentence({ sentence, lang = "ar", translation, className = "" }: ExampleSentenceProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = async () => {
    if (isPlaying) return

    setIsPlaying(true)
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sentence,
          lang: lang === "ar" ? "ar" : lang === "nl" ? "nl" : "en",
        }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        audio.onended = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
        
        await audio.play()
      } else {
        // Fallback to browser TTS
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(sentence)
          utterance.lang = lang === "ar" ? "ar-SA" : lang === "nl" ? "nl-NL" : "en-US"
          utterance.rate = 0.75
          utterance.onend = () => setIsPlaying(false)
          utterance.onerror = () => setIsPlaying(false)
          window.speechSynthesis.speak(utterance)
        } else {
          setIsPlaying(false)
        }
      }
    } catch (error) {
      console.error("Audio playback failed:", error)
      setIsPlaying(false)
    }
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handlePlay}
          disabled={isPlaying}
          className="h-8 w-8 p-0 flex-shrink-0 mt-0.5"
        >
          <Volume2 className={`h-4 w-4 ${isPlaying ? "animate-pulse" : ""}`} />
        </Button>
        <div className="flex-1 min-w-0">
          <p
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="text-sm text-foreground font-medium"
          >
            {sentence}
          </p>
          {translation && (translation.nl || translation.en) && (
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {translation.nl && (
                <div className="text-foreground/80">NL: {translation.nl}</div>
              )}
              {translation.en && (
                <div className="text-foreground/80">EN: {translation.en}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

