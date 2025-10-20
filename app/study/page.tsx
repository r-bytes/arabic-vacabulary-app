"use client"

import { FlashcardSession } from "@/components/flashcard-session"
import { MemoryGame } from "@/components/memory-game"
import { QuizSession } from "@/components/quiz-session"
import { StudyControls } from "@/components/study-controls"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isDue } from "@/lib/srs"
import { useVocabStore } from "@/lib/store"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export default function StudyPage() {
  const router = useRouter()
  const { cards, selectedFolderIds, dueOnly, direction } = useVocabStore()
  const [activeMode, setActiveMode] = useState<"flashcards" | "quiz" | "memory">("flashcards")
  const [sessionActive, setSessionActive] = useState(false)

  const sessionCards = useMemo(() => {
    let filtered = cards.filter((c) => selectedFolderIds.includes(c.folderId))
    if (dueOnly) {
      filtered = filtered.filter((c) => isDue(c.srs))
    }
    // Shuffle cards
    return filtered.sort(() => Math.random() - 0.5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, selectedFolderIds, dueOnly, sessionActive])

  const memoryCards = useMemo(() => {
    return sessionCards.slice(0, 12)
  }, [sessionCards])

  const handleStartSession = () => {
    setSessionActive(true)
  }

  const handleExitSession = () => {
    setSessionActive(false)
  }

  if (sessionActive && activeMode === "flashcards") {
    return (
      <div className="h-screen">
        <FlashcardSession cards={sessionCards} onExit={handleExitSession} />
      </div>
    )
  }

  if (sessionActive && activeMode === "quiz") {
    return <QuizSession cards={sessionCards} onExit={handleExitSession} />
  }

  if (sessionActive && activeMode === "memory") {
    return <MemoryGame cards={memoryCards} direction={direction} onExit={handleExitSession} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold md:text-2xl">Studeren</h1>
            <p className="text-sm text-muted-foreground">Kies je mappen en studeer modus</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          <aside className="order-2 lg:order-1">
            <StudyControls onStartSession={handleStartSession} />
          </aside>

          <div className="order-1 lg:order-2">
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as typeof activeMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="flashcards" className="text-xs md:text-sm">Flashcards</TabsTrigger>
                <TabsTrigger value="quiz" className="text-xs md:text-sm">Quiz</TabsTrigger>
                <TabsTrigger value="memory" className="text-xs md:text-sm">Memory</TabsTrigger>
              </TabsList>

              <TabsContent value="flashcards" className="mt-6">
                <div className="rounded-lg border bg-card p-4 md:p-8 text-center">
                  <h2 className="mb-2 text-lg md:text-xl font-semibold">Flashcards</h2>
                  <p className="mb-6 text-sm md:text-base text-muted-foreground">
                    Leer woordenschat met flashcards. Draai de kaart om het antwoord te zien en beoordeel hoe goed je
                    het wist.
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-4 text-left sm:grid-cols-2">
                      <div className="rounded-lg border p-3 md:p-4">
                        <div className="mb-2 text-sm md:text-base font-medium">Toetsenbord sneltoetsen</div>
                        <ul className="space-y-1 text-xs md:text-sm text-muted-foreground">
                          <li>
                            <kbd className="rounded bg-muted px-1 md:px-2 py-1 text-xs">Spatie</kbd> - Draai kaart
                          </li>
                          <li>
                            <kbd className="rounded bg-muted px-1 md:px-2 py-1 text-xs">←</kbd> /{" "}
                            <kbd className="rounded bg-muted px-1 md:px-2 py-1 text-xs">→</kbd> - Vorige/Volgende
                          </li>
                          <li>
                            <kbd className="rounded bg-muted px-1 md:px-2 py-1 text-xs">1-5</kbd> - Beoordeel kaart
                          </li>
                          <li>
                            <kbd className="rounded bg-muted px-1 md:px-2 py-1 text-xs">Esc</kbd> - Sluit sessie
                          </li>
                        </ul>
                      </div>
                      <div className="rounded-lg border p-3 md:p-4">
                        <div className="mb-2 text-sm md:text-base font-medium">Spaced Repetition</div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Kaarten die je moeilijk vindt komen vaker terug. Beoordeel eerlijk voor het beste resultaat!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quiz" className="mt-6">
                <div className="rounded-lg border bg-card p-4 md:p-8 text-center">
                  <h2 className="mb-2 text-lg md:text-xl font-semibold">Quiz</h2>
                  <p className="mb-6 text-sm md:text-base text-muted-foreground">
                    Test je kennis met meerkeuze vragen of typ de antwoorden zelf.
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-4 text-left sm:grid-cols-2">
                      <div className="rounded-lg border p-3 md:p-4">
                        <div className="mb-2 text-sm md:text-base font-medium">Meerkeuze</div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Kies het juiste antwoord uit 4 opties. Krijg direct feedback na elk antwoord.
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 md:p-4">
                        <div className="mb-2 text-sm md:text-base font-medium">Typen</div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Typ het antwoord zelf. Diacrieten worden genegeerd voor Arabisch.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="memory" className="mt-6">
                <div className="rounded-lg border bg-card p-4 md:p-8 text-center">
                  <h2 className="mb-2 text-lg md:text-xl font-semibold">Memory</h2>
                  <p className="mb-6 text-sm md:text-base text-muted-foreground">
                    Vind alle paren van Arabische woorden en hun vertalingen. Train je geheugen en woordenschat
                    tegelijk!
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-4 text-left sm:grid-cols-2">
                      <div className="rounded-lg border p-3 md:p-4">
                        <div className="mb-2 text-sm md:text-base font-medium">Hoe te spelen</div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Klik op twee tegels om ze om te draaien. Vind het Arabische woord en de bijbehorende
                          vertaling.
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 md:p-4">
                        <div className="mb-2 text-sm md:text-base font-medium">Uitdaging</div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Probeer alle paren te vinden in zo min mogelijk pogingen en tijd!
                        </p>
                      </div>
                    </div>
                    {sessionCards.length > 12 && (
                      <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 p-3 text-xs md:text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                        Let op: Memory spel gebruikt maximaal 12 kaarten (24 tegels) per sessie.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
