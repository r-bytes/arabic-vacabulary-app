"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useVocabStore } from "@/lib/store"
import { AlertCircle, CheckCircle2, Download, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface DataStats {
  totalFolders: number
  totalCards: number
  emptyArabic: number
  emptyTranslations: number
  orphanedCards: number
  emptyArabicIds: string[]
  emptyTranslationIds: string[]
  orphanedCardIds: string[]
}

export default function DebugPage() {
  const { folders, cards, loadData } = useVocabStore()
  const [stats, setStats] = useState<DataStats | null>(null)
  const [localStorageData, setLocalStorageData] = useState<string>("")
  const [apiData, setApiData] = useState<string>("")

  useEffect(() => {
    analyzeData()
    loadLocalStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folders, cards])

  const analyzeData = () => {
    const emptyArabic = cards.filter((c) => !c.ar || c.ar.trim() === "")
    const emptyTranslations = cards.filter((c) => !c.gloss || (!c.gloss.nl && !c.gloss.en))
    const orphanedCards = cards.filter((c) => !folders.find((f) => f.id === c.folderId))

    setStats({
      totalFolders: folders.length,
      totalCards: cards.length,
      emptyArabic: emptyArabic.length,
      emptyTranslations: emptyTranslations.length,
      orphanedCards: orphanedCards.length,
      emptyArabicIds: emptyArabic.map((c) => c.id),
      emptyTranslationIds: emptyTranslations.map((c) => c.id),
      orphanedCardIds: orphanedCards.map((c) => c.id),
    })
  }

  const loadLocalStorage = () => {
    if (typeof window === "undefined") return
    const data = localStorage.getItem("arabic-vocab-data")
    setLocalStorageData(data ? JSON.stringify(JSON.parse(data), null, 2) : "Geen data")
  }

  const loadAPIData = async () => {
    try {
      const [foldersRes, cardsRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/cards"),
      ])
      if (!foldersRes.ok || !cardsRes.ok) {
        setApiData(`API Error: ${foldersRes.status}, ${cardsRes.status}`)
        return
      }
      const [folders, cards] = await Promise.all([foldersRes.json(), cardsRes.json()])
      setApiData(JSON.stringify({ folders, cards }, null, 2))
      toast.success("API data geladen")
    } catch (e) {
      setApiData(`Error: ${e}`)
      toast.error("API niet beschikbaar")
    }
  }

  const exportData = () => {
    if (typeof window === "undefined") return
    const data = localStorage.getItem("arabic-vocab-data")
    if (!data) {
      toast.error("Geen data om te exporteren")
      return
    }
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `arabic-vocab-backup-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Data geëxporteerd!")
  }

  const restoreFromSeed = async () => {
    try {
      const res = await fetch("/seed/seed.json")
      if (!res.ok) throw new Error("seed.json niet gevonden")
      const data = await res.json()
      localStorage.setItem("arabic-vocab-data", JSON.stringify(data))
      await loadData()
      toast.success("Data hersteld van seed.json!")
      loadLocalStorage()
      analyzeData()
    } catch (e) {
      toast.error(`Error: ${e}`)
    }
  }

  const syncAPItoLocal = async () => {
    try {
      const [foldersRes, cardsRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/cards"),
      ])
      if (!foldersRes.ok || !cardsRes.ok) throw new Error("API niet beschikbaar")
      const [folders, cards] = await Promise.all([foldersRes.json(), cardsRes.json()])
      localStorage.setItem("arabic-vocab-data", JSON.stringify({ folders, cards }))
      await loadData()
      toast.success(`Gesynchroniseerd! ${folders.length} folders, ${cards.length} kaarten`)
      loadLocalStorage()
      analyzeData()
    } catch (e) {
      toast.error(`Error: ${e}`)
    }
  }

  const clearLocalStorage = () => {
    if (!confirm("WAARSCHUWING: Dit wist alle lokale data!\n\nExporteer eerst als backup.\n\nDoorgaan?")) {
      return
    }
    localStorage.removeItem("arabic-vocab-data")
    loadLocalStorage()
    toast.success("LocalStorage gewist!")
  }

  const hasProblems = stats && (stats.emptyArabic > 0 || stats.emptyTranslations > 0 || stats.orphanedCards > 0)

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 Data Diagnose</h1>
          <p className="text-muted-foreground">Analyseer en herstel je vocabulaire data</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Terug naar App
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Statistieken</CardTitle>
          <CardDescription>Huidige status van je data</CardDescription>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Totaal Folders</div>
                  <div className="text-2xl font-bold">{stats.totalFolders}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Totaal Kaarten</div>
                  <div className="text-2xl font-bold">{stats.totalCards}</div>
                </div>
              </div>

              {hasProblems ? (
                <div className="mt-4 space-y-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertCircle className="h-5 w-5" />
                    Problemen gevonden!
                  </div>
                  {stats.emptyArabic > 0 && (
                    <div className="text-sm">
                      ⚠️ {stats.emptyArabic} kaarten zonder Arabische tekst
                    </div>
                  )}
                  {stats.emptyTranslations > 0 && (
                    <div className="text-sm">
                      ⚠️ {stats.emptyTranslations} kaarten zonder vertalingen
                    </div>
                  )}
                  {stats.orphanedCards > 0 && (
                    <div className="text-sm">
                      ⚠️ {stats.orphanedCards} kaarten met ongeldige folder ID
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Geen problemen gevonden!</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Herstel Opties</CardTitle>
          <CardDescription>Verschillende manieren om je data te herstellen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exporteer Backup
            </Button>
            <Button onClick={restoreFromSeed} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Herstel van seed.json
            </Button>
            <Button onClick={syncAPItoLocal} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync API → LocalStorage
            </Button>
            <Button onClick={clearLocalStorage} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Wis LocalStorage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LocalStorage Data */}
      <Card>
        <CardHeader>
          <CardTitle>💾 LocalStorage Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
            {localStorageData}
          </pre>
        </CardContent>
      </Card>

      {/* API Data */}
      <Card>
        <CardHeader>
          <CardTitle>🌐 Database API Data</CardTitle>
          <CardDescription>
            <Button onClick={loadAPIData} variant="outline" size="sm">
              Laad API Data
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
            {apiData || "Klik op 'Laad API Data' om de data te bekijken..."}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

