"use client"

import type React from "react"

import { useState } from "react"
import { dataAdapter } from "@/lib/data-adapter"
import { useVocabStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileJson, FileSpreadsheet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { loadData } = useVocabStore()
  const [importErrors, setImportErrors] = useState<Array<{ row: number; error: string }>>([])
  const [importSuccess, setImportSuccess] = useState<number | null>(null)

  const handleExportJSON = () => {
    const data = dataAdapter.exportJSON()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `arabic-vocab-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const csv = dataAdapter.exportCSV()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `arabic-vocab-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.folders || !data.cards) {
        throw new Error("Ongeldig JSON formaat. Verwacht 'folders' en 'cards' velden.")
      }

      dataAdapter.importJSON(data)
      loadData()
      setImportSuccess(data.cards.length)
      setImportErrors([])
      e.target.value = ""
    } catch (error) {
      setImportErrors([{ row: 0, error: error instanceof Error ? error.message : "Onbekende fout" }])
      setImportSuccess(null)
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("CSV bestand moet minimaal een header en één rij bevatten.")
      }

      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.replace(/"/g, "").trim())
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })
        return row
      })

      const result = dataAdapter.importCSV(rows)
      loadData()
      setImportSuccess(result.success)
      setImportErrors(result.errors)
      e.target.value = ""
    } catch (error) {
      setImportErrors([{ row: 0, error: error instanceof Error ? error.message : "Onbekende fout" }])
      setImportSuccess(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importeren & Exporteren</DialogTitle>
          <DialogDescription>Beheer je woordenschat data met JSON of CSV bestanden</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exporteren</TabsTrigger>
            <TabsTrigger value="import">Importeren</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="mb-2 font-medium">JSON Export</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Exporteer alle mappen en kaarten als JSON bestand. Ideaal voor backups en het delen van complete
                  datasets.
                </p>
                <Button onClick={handleExportJSON} variant="outline" className="w-full bg-transparent">
                  <FileJson className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </div>

              <div>
                <h3 className="mb-2 font-medium">CSV Export</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Exporteer kaarten als CSV bestand. Handig voor gebruik in spreadsheets of andere applicaties.
                </p>
                <Button onClick={handleExportCSV} variant="outline" className="w-full bg-transparent">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            {importSuccess !== null && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Succesvol {importSuccess} kaarten geïmporteerd!
                </AlertDescription>
              </Alert>
            )}

            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="mb-2 font-medium">Fouten bij importeren:</div>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {importErrors.slice(0, 5).map((error, index) => (
                      <li key={index}>
                        {error.row > 0 ? `Rij ${error.row}: ` : ""}
                        {error.error}
                      </li>
                    ))}
                    {importErrors.length > 5 && <li>... en {importErrors.length - 5} meer fouten</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div>
                <h3 className="mb-2 font-medium">JSON Import</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Importeer een eerder geëxporteerd JSON bestand. Dit overschrijft alle huidige data.
                </p>
                <div>
                  <Input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportJSON}
                    className="hidden"
                    id="json-import"
                  />
                  <Label htmlFor="json-import" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-4 transition-colors hover:bg-accent">
                      <Upload className="h-5 w-5" />
                      <span>Klik om JSON bestand te selecteren</span>
                    </div>
                  </Label>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">CSV Import</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Importeer kaarten uit een CSV bestand. Verwachte kolommen: folder, ar, translit, nl, en, tags
                </p>
                <div>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportCSV}
                    className="hidden"
                    id="csv-import"
                  />
                  <Label htmlFor="csv-import" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-4 transition-colors hover:bg-accent">
                      <Upload className="h-5 w-5" />
                      <span>Klik om CSV bestand te selecteren</span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Let op:</strong> Importeren overschrijft je huidige data. Maak eerst een backup via Export.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
