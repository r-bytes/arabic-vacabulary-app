"use client"

import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw, Home } from "lucide-react"

interface QuizResultsProps {
  score: number
  total: number
  onRestart: () => void
  onExit: () => void
}

export function QuizResults({ score, total, onRestart, onExit }: QuizResultsProps) {
  const percentage = Math.round((score / total) * 100)

  const getMessage = () => {
    if (percentage === 100) return "Perfect! Uitstekend werk!"
    if (percentage >= 80) return "Geweldig gedaan!"
    if (percentage >= 60) return "Goed bezig!"
    if (percentage >= 40) return "Niet slecht, blijf oefenen!"
    return "Blijf oefenen, je komt er wel!"
  }

  const getColor = () => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-blue-600"
    if (percentage >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-8 flex justify-center">
        <div className="rounded-full bg-primary/10 p-6">
          <Trophy className="h-16 w-16 text-primary" />
        </div>
      </div>

      <h2 className="mb-4 text-3xl font-bold">Quiz voltooid!</h2>
      <p className="mb-8 text-lg text-muted-foreground">{getMessage()}</p>

      <div className="mb-8 rounded-2xl border-2 bg-card p-8 shadow-lg">
        <div className="mb-2 text-sm text-muted-foreground">Je score</div>
        <div className={`text-6xl font-bold ${getColor()}`}>
          {score}/{total}
        </div>
        <div className="mt-2 text-2xl font-semibold">{percentage}%</div>
      </div>

      <div className="flex gap-4">
        <Button onClick={onRestart} variant="outline" size="lg" className="flex-1 bg-transparent">
          <RotateCcw className="mr-2 h-5 w-5" />
          Opnieuw proberen
        </Button>
        <Button onClick={onExit} size="lg" className="flex-1">
          <Home className="mr-2 h-5 w-5" />
          Terug naar overzicht
        </Button>
      </div>
    </div>
  )
}
