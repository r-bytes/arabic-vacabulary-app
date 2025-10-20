"use client"

import { useState } from "react"
import type { Card } from "@/lib/types"
import { useVocabStore } from "@/lib/store"
import { QuizMCQ } from "@/components/quiz-mcq"
import { QuizTyping } from "@/components/quiz-typing"
import { QuizResults } from "@/components/quiz-results"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"

interface QuizSessionProps {
  cards: Card[]
  onExit: () => void
}

export function QuizSession({ cards, onExit }: QuizSessionProps) {
  const { direction } = useVocabStore()
  const [quizType, setQuizType] = useState<"mcq" | "typing">("mcq")
  const [sessionCards] = useState(cards)
  const [showResults, setShowResults] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const handleComplete = (score: number) => {
    setFinalScore(score)
    setShowResults(true)
  }

  const handleRestart = () => {
    setShowResults(false)
    setFinalScore(0)
  }

  if (showResults) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <QuizResults score={finalScore} total={sessionCards.length} onRestart={handleRestart} onExit={onExit} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">Quiz</h1>
            <p className="text-sm text-muted-foreground">{sessionCards.length} vragen</p>
          </div>
          <div className="flex items-center gap-4">
            <Tabs value={quizType} onValueChange={(value) => setQuizType(value as typeof quizType)}>
              <TabsList>
                <TabsTrigger value="mcq">Meerkeuze</TabsTrigger>
                <TabsTrigger value="typing">Typen</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon" onClick={onExit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        {quizType === "mcq" ? (
          <QuizMCQ cards={sessionCards} direction={direction} onComplete={handleComplete} />
        ) : (
          <QuizTyping cards={sessionCards} direction={direction} onComplete={handleComplete} />
        )}
      </main>
    </div>
  )
}
