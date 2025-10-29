"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Card, Direction } from "@/lib/types"
import { Check, Volume2, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface QuizMCQProps {
  cards: Card[]
  direction: Direction
  onComplete: (score: number) => void
}

export function QuizMCQ({ cards, direction, onComplete }: QuizMCQProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [options, setOptions] = useState<string[]>([])

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex + 1) / cards.length) * 100

  useEffect(() => {
    if (currentCard) {
      generateOptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentCard])

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

  const generateOptions = () => {
    const correctAnswer = getCorrectAnswer()
    const otherCards = cards.filter((c) => c.id !== currentCard.id)
    const shuffled = otherCards.sort(() => Math.random() - 0.5)

    const distractors = shuffled.slice(0, 3).map((card) => {
      if (direction === "ar-nl" || direction === "ar-en") {
        return direction === "ar-nl" ? card.gloss.nl : card.gloss.en
      } else {
        return card.ar
      }
    })

    const allOptions = [correctAnswer, ...distractors].filter(Boolean) as string[]
    setOptions(allOptions.sort(() => Math.random() - 0.5))
  }

  const handleAnswer = (index: number) => {
    if (showFeedback) return

    setSelectedAnswer(index)
    setShowFeedback(true)

    const correctAnswer = getCorrectAnswer()
    const isCorrect = options[index] === correctAnswer

    if (isCorrect) {
      setScore(score + 1)
      toast.success("Correct! ✓", {
        duration: 1500,
      })
      // Auto-advance after 1.5 seconds
      setTimeout(() => {
        handleNext()
      }, 1500)
    } else {
      toast.error("Helaas, niet juist", {
        description: `Correct antwoord: ${correctAnswer}`,
        duration: 3000,
      })
    }
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      onComplete(score + (selectedAnswer !== null && options[selectedAnswer] === getCorrectAnswer() ? 1 : 0))
    }
  }

  const handleAudio = () => {
    const textToSpeak = direction.startsWith("ar-") ? currentCard.ar : currentCard.gloss.nl || currentCard.gloss.en

    if (currentCard.audioUrl) {
      const audio = new Audio(currentCard.audioUrl)
      audio.play().catch((err) => console.error("Audio playback failed:", err))
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
    }
  }

  const question = getQuestion()
  const correctAnswer = getCorrectAnswer()
  const isCorrect = selectedAnswer !== null && options[selectedAnswer] === correctAnswer

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
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex-1"></div>
            <div dir={question.dir} className="text-4xl font-bold flex-shrink-0">
              {question.text}
            </div>
            <div className="flex-1 flex justify-end">
              <Button variant="default" size="lg" onClick={handleAudio} className="h-12 w-12 rounded-full">
                <Volume2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {question.subtext && <div className="text-lg text-muted-foreground">{question.subtext}</div>}
        </div>
      <div className="mb-6 space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrectOption = option === correctAnswer
          const showCorrect = showFeedback && isCorrectOption
          const showIncorrect = showFeedback && isSelected && !isCorrectOption

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showFeedback}
              className={`w-full rounded-xl border-2 p-4 text-left text-lg transition-all ${
                showCorrect
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : showIncorrect
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent"
              } ${showFeedback ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <span dir={direction.endsWith("-ar") ? "rtl" : "ltr"} className="flex-1">
                  {option}
                </span>
                {showCorrect && <Check className="h-5 w-5 text-green-600" />}
                {showIncorrect && <XIcon className="h-5 w-5 text-red-600" />}
              </div>
            </button>
          )
        })}
      </div>


      {showFeedback && (
        <Button onClick={handleNext} className="w-full" size="lg">
          {currentIndex < cards.length - 1 ? "Volgende vraag" : "Bekijk resultaat"}
        </Button>
      )}
    </div>
  )
}
