"use client"

import { useState, useEffect } from "react"
import type { Card, Direction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw, X, Clock } from "lucide-react"

interface MemoryTile {
  id: string
  cardId: string
  content: string
  type: "arabic" | "translation"
  dir: "rtl" | "ltr"
  isFlipped: boolean
  isMatched: boolean
}

interface MemoryGameProps {
  cards: Card[]
  direction: Direction
  onExit: () => void
}

export function MemoryGame({ cards, direction, onExit }: MemoryGameProps) {
  const [tiles, setTiles] = useState<MemoryTile[]>([])
  const [flippedTiles, setFlippedTiles] = useState<string[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)

  useEffect(() => {
    initializeGame()
  }, [cards, direction])

  useEffect(() => {
    if (!gameComplete) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [startTime, gameComplete])

  useEffect(() => {
    if (flippedTiles.length === 2) {
      const [first, second] = flippedTiles
      const firstTile = tiles.find((t) => t.id === first)
      const secondTile = tiles.find((t) => t.id === second)

      if (firstTile && secondTile && firstTile.cardId === secondTile.cardId && firstTile.type !== secondTile.type) {
        // Match found
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((tile) => (tile.id === first || tile.id === second ? { ...tile, isMatched: true } : tile)),
          )
          setMatchedPairs((prev) => prev + 1)
          setFlippedTiles([])
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          setTiles((prev) =>
            prev.map((tile) => (tile.id === first || tile.id === second ? { ...tile, isFlipped: false } : tile)),
          )
          setFlippedTiles([])
        }, 1000)
      }
      setAttempts((prev) => prev + 1)
    }
  }, [flippedTiles, tiles])

  useEffect(() => {
    if (matchedPairs > 0 && matchedPairs === cards.length) {
      setGameComplete(true)
    }
  }, [matchedPairs, cards.length])

  const initializeGame = () => {
    const gameTiles: MemoryTile[] = []

    cards.forEach((card) => {
      // Arabic tile
      gameTiles.push({
        id: `${card.id}-ar`,
        cardId: card.id,
        content: card.ar,
        type: "arabic",
        dir: "rtl",
        isFlipped: false,
        isMatched: false,
      })

      // Translation tile
      const translation = direction === "ar-nl" || direction === "nl-ar" ? card.gloss.nl || "" : card.gloss.en || ""

      gameTiles.push({
        id: `${card.id}-trans`,
        cardId: card.id,
        content: translation,
        type: "translation",
        dir: "ltr",
        isFlipped: false,
        isMatched: false,
      })
    })

    // Shuffle tiles
    const shuffled = gameTiles.sort(() => Math.random() - 0.5)
    setTiles(shuffled)
    setFlippedTiles([])
    setMatchedPairs(0)
    setAttempts(0)
    setStartTime(Date.now())
    setElapsedTime(0)
    setGameComplete(false)
  }

  const handleTileClick = (tileId: string) => {
    if (flippedTiles.length >= 2) return

    const tile = tiles.find((t) => t.id === tileId)
    if (!tile || tile.isFlipped || tile.isMatched) return

    setTiles((prev) => prev.map((t) => (t.id === tileId ? { ...t, isFlipped: true } : t)))
    setFlippedTiles((prev) => [...prev, tileId])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const gridCols = cards.length <= 6 ? "grid-cols-4" : cards.length <= 10 ? "grid-cols-5" : "grid-cols-6"

  if (gameComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Trophy className="h-16 w-16 text-primary" />
            </div>
          </div>

          <h2 className="mb-4 text-3xl font-bold">Gefeliciteerd!</h2>
          <p className="mb-8 text-lg text-muted-foreground">Je hebt alle paren gevonden!</p>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-2 bg-card p-6 shadow-lg">
              <div className="mb-2 text-sm text-muted-foreground">Tijd</div>
              <div className="text-4xl font-bold text-primary">{formatTime(elapsedTime)}</div>
            </div>
            <div className="rounded-2xl border-2 bg-card p-6 shadow-lg">
              <div className="mb-2 text-sm text-muted-foreground">Pogingen</div>
              <div className="text-4xl font-bold text-primary">{attempts}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={initializeGame} variant="outline" size="lg" className="flex-1 bg-transparent">
              <RotateCcw className="mr-2 h-5 w-5" />
              Opnieuw spelen
            </Button>
            <Button onClick={onExit} size="lg" className="flex-1">
              Terug naar overzicht
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">Memory Game</h1>
            <p className="text-sm text-muted-foreground">Vind alle paren</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Pogingen:</span> <span className="font-medium">{attempts}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Paren:</span>{" "}
              <span className="font-medium">
                {matchedPairs}/{cards.length}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onExit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-8">
        <div className={`grid ${gridCols} gap-4`}>
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              disabled={tile.isMatched || tile.isFlipped}
              className={`group relative aspect-square rounded-xl border-2 transition-all ${
                tile.isMatched
                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                  : tile.isFlipped
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-md"
              } ${tile.isMatched || tile.isFlipped ? "" : "cursor-pointer"}`}
            >
              <div className="flex h-full items-center justify-center p-4">
                {tile.isFlipped || tile.isMatched ? (
                  <div dir={tile.dir} className="text-center text-lg font-semibold leading-tight sm:text-xl">
                    {tile.content}
                  </div>
                ) : (
                  <div className="text-4xl text-muted-foreground/20">?</div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button onClick={initializeGame} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Opnieuw beginnen
          </Button>
        </div>
      </main>
    </div>
  )
}
