"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dataAdapter } from "@/lib/data-adapter"
import { useVocabStore } from "@/lib/store"
import { AlertCircle, FileJson, FileSpreadsheet, Upload } from "lucide-react"
import { useState } from "react"

interface ImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { loadData, setFolders, setCards } = useVocabStore()
  const [importErrors, setImportErrors] = useState<Array<{ row: number; error: string }>>([])
  const [importSuccess, setImportSuccess] = useState<number | null>(null)
  const [isImporting, setIsImporting] = useState(false)

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

    setIsImporting(true)
    setImportErrors([])
    setImportSuccess(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.folders || !data.cards) {
        throw new Error("Ongeldig JSON formaat. Verwacht 'folders' en 'cards' velden.")
      }

      // Update localStorage as backup
      dataAdapter.importJSON(data)
      
      // Sync to database so data persists after refresh
      // (We'll update the UI after successful database sync)
      try {
        // First, clear existing data from database
        const existingFolders = await fetch("/api/folders").then(r => r.ok ? r.json() : []).catch(() => [])
        const existingCards = await fetch("/api/cards").then(r => r.ok ? r.json() : []).catch(() => [])
        
        // Delete existing cards first (foreign key constraint)
        await Promise.allSettled(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          existingCards.map((card: any) =>
            fetch("/api/cards", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: card.id }),
            }).catch(() => {})
          )
        )
        
        // Delete existing folders
        await Promise.allSettled(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          existingFolders.map((folder: any) =>
            fetch("/api/folders", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: folder.id }),
            }).catch(() => {})
          )
        )
        
        // Create folders and proper mapping
        const folderIdMap = new Map<string, string>()
        
        for (const folder of data.folders) {
          try {
            const response = await fetch("/api/folders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: folder.name }),
            })
            if (response.ok) {
              const newFolder = await response.json()
              
              // Map each old folder ID to its new ID
              folderIdMap.set(folder.id, newFolder.id)
            } else {
              const errorBody = await response.text()
              throw new Error(`Folder create failed: ${response.status} - ${errorBody}`)
            }
          } catch (e) {
            throw e
          }
        }
        
        // Handle unmapped folder IDs (like numeric IDs 1, 2, 3...)
        const cardFolderIds = [...new Set(data.cards.map((c: { folderId: unknown }) => c.folderId))]
        const unmappedIds = cardFolderIds.filter((id: unknown) => !folderIdMap.has(String(id)))
        
        if (unmappedIds.length > 0) {
          
          // Map unmapped IDs to folders by index
          const sortedFolders = Array.from(folderIdMap.entries())
          unmappedIds.forEach((unmappedId: unknown, index: number) => {
            if (index < sortedFolders.length) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const [_, newId] = sortedFolders[index]
              folderIdMap.set(String(unmappedId), newId)
            } else {
              // If more unmapped IDs than folders, use the last folder
              const [, lastFolderId] = sortedFolders[sortedFolders.length - 1]
              folderIdMap.set(String(unmappedId), lastFolderId)
            }
          })
        }
        
        // Push new cards to database with updated folder IDs
        let successCount = 0
        for (const card of data.cards) {
          try {
            // Get the correct folder ID for this card
            const newFolderId = folderIdMap.get(card.folderId)
            
            if (!newFolderId) {
              throw new Error(`No folder mapping for ${card.folderId}`)
            }
            
            const response = await fetch("/api/cards", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...card, folderId: newFolderId }),
            })
            
            if (response.ok) {
              successCount++
            } else {
              const errorBody = await response.text()
              throw new Error(`Card import failed: ${response.status} - ${errorBody}`)
            }
          } catch (e) {
            throw e
          }
        }
        
        // Reload from database to get the correct IDs and update UI
        await loadData()
        
        // Force UI update by getting fresh data from store
        const currentStore = useVocabStore.getState()
        
        // Force re-render by updating the store explicitly
        setFolders([...currentStore.folders])
        setCards([...currentStore.cards])
        
        // Force a page refresh to ensure UI is updated
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
      } catch {
        // Fallback: update UI with localStorage data if database sync failed
        const store = dataAdapter.getStore()
        setFolders(store.folders)
        setCards(store.cards)
      }
      
      setImportSuccess(data.cards.length)
      setImportErrors([])
      e.target.value = ""
    } catch (error) {
      setImportErrors([{ row: 0, error: error instanceof Error ? error.message : "Onbekende fout" }])
      setImportSuccess(null)
    } finally {
      setIsImporting(false)
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
      
      // Reload data from localStorage to get the imported data into the store
      const store = dataAdapter.getStore()
      setFolders(store.folders)
      setCards(store.cards)
      
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
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-base font-semibold text-foreground">JSON Export</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Exporteer alle mappen en kaarten als JSON bestand. Ideaal voor backups en het delen van complete
                  datasets.
                </p>
                <Button onClick={handleExportJSON} variant="default" className="w-full">
                  <FileJson className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-base font-semibold text-foreground">CSV Export</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Exporteer kaarten als CSV bestand. Handig voor gebruik in spreadsheets of andere applicaties.
                </p>
                <Button onClick={handleExportCSV} variant="default" className="w-full">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            {isImporting && (
              <Alert className="border-primary bg-primary/10 dark:bg-primary/30 dark:border-primary/50 flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent dark:border-primary" />
                <AlertDescription className="text-sm font-medium text-primary dark:text-primary-200">
                  Bezig met importeren... Dit kan even duren.
                </AlertDescription>
              </Alert>
            )}

            {importSuccess !== null && !isImporting && (
              <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/30 dark:border-green-500/30">
                <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                <AlertDescription className="text-sm font-medium text-green-900 dark:text-green-200">
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
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-base font-semibold text-foreground">JSON Import</h3>
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
                    disabled={isImporting}
                  />
                  <Label htmlFor="json-import" className={`cursor-pointer ${isImporting ? 'cursor-not-allowed opacity-50' : ''}`}>
                    <div className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4 transition-colors ${isImporting ? 'cursor-not-allowed' : 'hover:border-primary hover:bg-primary/10'}`}>
                      {isImporting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="font-medium text-foreground">Bezig met importeren...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground">Klik om JSON bestand te selecteren</span>
                        </>
                      )}
                    </div>
                  </Label>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-base font-semibold text-foreground">CSV Import</h3>
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
                    <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4 transition-colors hover:border-primary hover:bg-primary/10">
                      <Upload className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Klik om CSV bestand te selecteren</span>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
                <strong className="font-semibold">Let op:</strong> Importeren overschrijft je huidige data. Maak eerst een backup via Export.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
