"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { Card, Direction } from "@/lib/types"
import { compareArabic } from "@/lib/utils-arabic"
import { Check, Volume2, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface QuizTypingProps {
  cards: Card[]
  direction: Direction
  onComplete: (score: number) => void
}

export function QuizTyping({ cards, direction, onComplete }: QuizTypingProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100

  const isApple = typeof navigator !== "undefined" && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (!showFeedback && currentCard && hasInteracted && !isApple) {
      setTimeout(() => handleAudio(), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, showFeedback, hasInteracted, isApple])

  useEffect(() => {
    const markInteraction = () => setHasInteracted(true)
    window.addEventListener("pointerdown", markInteraction, { once: true })
    window.addEventListener("keydown", markInteraction, { once: true })
    return () => {
      window.removeEventListener("pointerdown", markInteraction)
      window.removeEventListener("keydown", markInteraction)
    }
  }, [])

  const getQuestion = () => {
    if (direction === "ar-nl" || direction === "ar-en") {
      return {
        text: currentCard.ar,
        subtext: currentCard.translit,
        dir: "rtl" as const,
      }
    } else {
      const text = direction === "nl-ar" ? currentCard.gloss.nl : currentCard.gloss.en
      return {
        text: text || "—",
        subtext: undefined,
        dir: "ltr" as const,
      }
    }
  }

  const getCorrectAnswer = () => {
    if (direction === "ar-nl" || direction === "ar-en") {
      return direction === "ar-nl" ? currentCard.gloss.nl : currentCard.gloss.en
    } else {
      return currentCard.ar
    }
  }

  const checkAnswer = () => {
    const correctAnswer = getCorrectAnswer() || ""
    let correct = false

    if (direction.endsWith("-ar")) {
      // Arabic answer - use lenient comparison
      correct = compareArabic(userAnswer, correctAnswer)
    } else {
      // Dutch/English answer - case insensitive
      correct = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
    }

    setIsCorrect(correct)
    setShowFeedback(true)
    if (correct) {
      setScore(score + 1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!showFeedback && userAnswer.trim()) {
      checkAnswer()
    }
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setUserAnswer("")
      setShowFeedback(false)
      setIsCorrect(false)
    } else {
      onComplete(score)
    }
  }

  const handleAudio = () => {
    const textToSpeak = direction.startsWith("ar-") ? currentCard.ar : currentCard.gloss.nl || currentCard.gloss.en

    if (currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl)
      audio.play().catch((err) => console.error("[v0] Audio playback failed:", err))
    } else if (textToSpeak) {
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

  const question = getQuestion()
  const correctAnswer = getCorrectAnswer()
  const inputDir = direction.endsWith("-ar") ? "rtl" : "ltr"

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Vraag {currentIndex + 1} van {cards.length}
          </span>
          <span>
            Score: {score}/{cards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mb-8 rounded-2xl border-2 bg-card p-8 text-center shadow-lg">
        <div className="mb-4 flex items-center justify-center gap-2">
          <div dir={question.dir} className="text-4xl font-bold">
            {question.text}
          </div>
          <Button variant="default" size="lg" onClick={handleAudio} className="h-12 w-12 rounded-full">
            <Volume2 className="h-5 w-5" />
          </Button>
        </div>
        {question.subtext && <div className="text-lg text-muted-foreground">{question.subtext}</div>}
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <Input
            dir={inputDir}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder={direction.endsWith("-ar") ? "اكتب الإجابة..." : "Type je antwoord..."}
            disabled={showFeedback}
            className="h-14 text-xl"
            autoFocus
          />
        </div>

        {!showFeedback && (
          <Button type="submit" className="w-full" size="lg" disabled={!userAnswer.trim()}>
            Controleer antwoord
          </Button>
        )}
      </form>

      {showFeedback && (
        <>
          <div
            className={`mb-6 rounded-lg border-2 p-6 ${
              isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"
            }`}
          >
            <div className="mb-3 flex items-center justify-center gap-2">
              {isCorrect ? (
                <>
                  <Check className="h-6 w-6 text-green-600" />
                  <span className="text-lg font-medium text-green-600">Correct!</span>
                </>
              ) : (
                <>
                  <XIcon className="h-6 w-6 text-red-600" />
                  <span className="text-lg font-medium text-red-600">Helaas, dat is niet juist.</span>
                </>
              )}
            </div>

            <div className="space-y-2 text-center">
              <div className="text-sm text-muted-foreground">Jouw antwoord:</div>
              <div dir={inputDir} className="text-lg font-medium">
                {userAnswer}
              </div>

              {!isCorrect && (
                <>
                  <div className="mt-4 text-sm text-muted-foreground">Het juiste antwoord is:</div>
                  <div dir={inputDir} className="text-lg font-medium text-green-600">
                    {correctAnswer}
                  </div>
                </>
              )}
            </div>
          </div>

          <Button onClick={handleNext} className="w-full" size="lg">
            {currentIndex < cards.length - 1 ? "Volgende vraag" : "Bekijk resultaat"}
          </Button>
        </>
      )}
    </div>
  )
}
