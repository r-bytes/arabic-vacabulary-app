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
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"

function StudyPageInner() {
  const router = useRouter()
  const { cards, selectedFolderIds, dueOnly, direction } = useVocabStore()
  const [activeMode, setActiveMode] = useState<"flashcards" | "quiz" | "memory">("flashcards")
  const [sessionActive, setSessionActive] = useState(false)
  const searchParams = useSearchParams()

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

  // Auto-start session when coming from dashboard with a preselected folder
  useEffect(() => {
    const auto = searchParams.get("auto")
    if (!sessionActive && auto === "1" && selectedFolderIds.length > 0) {
      setSessionActive(true)
    }
  }, [sessionActive, selectedFolderIds.length, searchParams])

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
      <header className="border-b-2 border-border bg-card shadow-sm">
        <div className="container mx-auto flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl text-foreground">Studeren</h1>
            <p className="text-sm font-medium text-muted-foreground">Kies je mappen en studeer modus</p>
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
              <TabsList className="grid w-full grid-cols-3 border-2 border-border bg-card shadow-md">
                <TabsTrigger value="flashcards" className="text-sm md:text-base font-semibold data-[state=active]:font-bold">Flashcards</TabsTrigger>
                <TabsTrigger value="quiz" className="text-sm md:text-base font-semibold data-[state=active]:font-bold">Quiz</TabsTrigger>
                <TabsTrigger value="memory" className="text-sm md:text-base font-semibold data-[state=active]:font-bold">Memory</TabsTrigger>
              </TabsList>

              <TabsContent value="flashcards" className="mt-6">
                <div className="rounded-lg border-2 border-border bg-card p-6 md:p-8 text-center shadow-lg">
                  <h2 className="mb-3 text-xl md:text-2xl font-bold text-foreground">Flashcards</h2>
                  <p className="mb-6 text-base md:text-lg font-medium text-foreground">
                    Leer woordenschat met flashcards. Draai de kaart om het antwoord te zien, swipe of gebruik de knoppen om door de kaarten te navigeren.
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-4 text-left sm:grid-cols-2">
                      <div className="rounded-lg border-2 border-border bg-background p-4 md:p-6 shadow-md">
                        <div className="mb-3 text-base md:text-lg font-bold text-foreground">Toetsenbord & Swipe</div>
                        <ul className="space-y-2 text-sm md:text-base">
                          <li className="text-foreground">
                            <kbd className="rounded bg-muted border-2 border-border px-2 md:px-3 py-1 text-xs font-bold">←</kbd> /{" "}
                            <kbd className="rounded bg-muted border-2 border-border px-2 md:px-3 py-1 text-xs font-bold">→</kbd> - Vorige/Volgende
                          </li>
                          <li className="text-foreground">
                            <kbd className="rounded bg-muted border-2 border-border px-2 md:px-3 py-1 text-xs font-bold">A</kbd> - Speel audio
                          </li>
                          <li className="text-foreground font-medium">
                            Swipe links/rechts - Navigeer door kaarten
                          </li>
                          <li className="text-foreground">
                            <kbd className="rounded bg-muted border-2 border-border px-2 md:px-3 py-1 text-xs font-bold">Esc</kbd> - Sluit sessie
                          </li>
                        </ul>
                      </div>
                      <div className="rounded-lg border-2 border-border bg-background p-4 md:p-6 shadow-md">
                        <div className="mb-3 text-base md:text-lg font-bold text-foreground">Review Mode</div>
                        <p className="text-sm md:text-base text-foreground leading-relaxed">
                          Markeer moeilijke woorden tijdens het studeren. Start een review sessie om alleen deze woorden extra te oefenen. Je kunt altijd doorgaan vanaf waar je was!
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 md:p-6 text-left shadow-md">
                      <div className="mb-3 text-base md:text-lg font-bold text-foreground">Functies</div>
                      <ul className="space-y-2 text-sm md:text-base">
                        <li className="text-foreground">• <strong className="font-bold">Review knop:</strong> Markeer moeilijke woorden voor extra oefening</li>
                        <li className="text-foreground">• <strong className="font-bold">Shuffle:</strong> Mix de volgorde van kaarten (alleen bij expliciete actie)</li>
                        <li className="text-foreground">• <strong className="font-bold">Opnieuw:</strong> Start opnieuw zonder shuffle, behoudt volgorde</li>
                        <li className="text-foreground">• <strong className="font-bold">Bewerk:</strong> Pas kaarten direct aan tijdens het studeren</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quiz" className="mt-6">
                <div className="rounded-lg border-2 border-border bg-card p-6 md:p-8 text-center shadow-lg">
                  <h2 className="mb-3 text-xl md:text-2xl font-bold text-foreground">Quiz</h2>
                  <p className="mb-6 text-base md:text-lg font-medium text-foreground">
                    Test je kennis met meerkeuze vragen of typ de antwoorden zelf. Krijg direct feedback en ga automatisch door bij goede antwoorden.
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-4 text-left sm:grid-cols-2">
                      <div className="rounded-lg border-2 border-border bg-background p-4 md:p-6 shadow-md">
                        <div className="mb-3 text-base md:text-lg font-bold text-foreground">Meerkeuze</div>
                        <p className="text-sm md:text-base text-foreground leading-relaxed">
                          Kies het juiste antwoord uit 4 opties. Krijg direct feedback via toast notificaties en ga automatisch door bij een goed antwoord.
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-border bg-background p-4 md:p-6 shadow-md">
                        <div className="mb-3 text-base md:text-lg font-bold text-foreground">Typen</div>
                        <p className="text-sm md:text-base text-foreground leading-relaxed">
                          Typ het antwoord zelf. Diacrieten worden genegeerd voor Arabisch. Bij correct antwoord ga je automatisch door na 1.5 seconde.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 md:p-6 text-left shadow-md">
                      <div className="mb-3 text-base md:text-lg font-bold text-foreground">Feedback</div>
                      <ul className="space-y-2 text-sm md:text-base">
                        <li className="text-foreground">• <strong className="font-bold">Correct:</strong> Groene toast, automatisch doorgaan na 1.5s</li>
                        <li className="text-foreground">• <strong className="font-bold">Fout:</strong> Rode toast met correct antwoord, handmatig doorgaan</li>
                        <li className="text-foreground">• <strong className="font-bold">Audio:</strong> Klik op het volume icoon rechts naast het woord</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="memory" className="mt-6">
                <div className="rounded-lg border-2 border-border bg-card p-6 md:p-8 text-center shadow-lg">
                  <h2 className="mb-3 text-xl md:text-2xl font-bold text-foreground">Memory</h2>
                  <p className="mb-6 text-base md:text-lg font-medium text-foreground">
                    Vind alle paren van Arabische woorden en hun vertalingen. Train je geheugen en woordenschat
                    tegelijk!
                  </p>
                  <div className="space-y-4">
                    <div className="grid gap-4 text-left sm:grid-cols-2">
                      <div className="rounded-lg border-2 border-border bg-background p-4 md:p-6 shadow-md">
                        <div className="mb-3 text-base md:text-lg font-bold text-foreground">Hoe te spelen</div>
                        <p className="text-sm md:text-base text-foreground leading-relaxed">
                          Klik op twee tegels om ze om te draaien. Vind het Arabische woord en de bijbehorende
                          vertaling.
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-border bg-background p-4 md:p-6 shadow-md">
                        <div className="mb-3 text-base md:text-lg font-bold text-foreground">Uitdaging</div>
                        <p className="text-sm md:text-base text-foreground leading-relaxed">
                          Probeer alle paren te vinden in zo min mogelijk pogingen en tijd!
                        </p>
                      </div>
                    </div>
                    {sessionCards.length > 12 && (
                      <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 text-sm md:text-base font-semibold text-yellow-900 shadow-md dark:bg-yellow-950 dark:text-yellow-100">
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

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Laden...</div>}>
      <StudyPageInner />
    </Suspense>
  )
}
