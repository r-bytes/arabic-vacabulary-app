"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImportExportDialog } from "@/components/import-export-dialog"
import { ArrowLeft, Download, Volume2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [importExportOpen, setImportExportOpen] = useState(false)
  const [ttsLang, setTtsLang] = useState("ar-SA")
  const [ttsRate, setTtsRate] = useState("0.8")

  const handleTestTTS = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance("مرحبا")
      utterance.lang = ttsLang
      utterance.rate = Number.parseFloat(ttsRate)
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Instellingen</h1>
            <p className="text-sm text-muted-foreground">Beheer je voorkeuren en data</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl p-6">
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Audio Instellingen</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tts-lang">Standaard TTS Taal</Label>
                <Select value={ttsLang} onValueChange={setTtsLang}>
                  <SelectTrigger id="tts-lang">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar-SA">Arabisch (Saudi-Arabië)</SelectItem>
                    <SelectItem value="ar-EG">Arabisch (Egypte)</SelectItem>
                    <SelectItem value="ar-AE">Arabisch (VAE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tts-rate">Spraaksnelheid</Label>
                <Select value={ttsRate} onValueChange={setTtsRate}>
                  <SelectTrigger id="tts-rate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">Langzaam (0.5x)</SelectItem>
                    <SelectItem value="0.8">Normaal (0.8x)</SelectItem>
                    <SelectItem value="1.0">Snel (1.0x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleTestTTS} variant="outline" className="w-full bg-transparent">
                <Volume2 className="mr-2 h-4 w-4" />
                Test spraak
              </Button>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Data Beheer</h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium">Backup & Herstel</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Exporteer je data voor een backup of importeer eerder opgeslagen data.
                </p>
                <Button onClick={() => setImportExportOpen(true)} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Import/Export Data
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Over</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Versie:</strong> 1.0.0
              </p>
              <p>
                <strong>Gebouwd met:</strong> Next.js, TypeScript, Tailwind CSS
              </p>
              <p className="pt-2">
                Deze app helpt je Arabisch te leren met flashcards, quizzen en memory games. Alle data wordt lokaal
                opgeslagen in je browser.
              </p>
            </div>
          </section>
        </div>
      </main>

      <ImportExportDialog open={importExportOpen} onOpenChange={setImportExportOpen} />
    </div>
  )
}
