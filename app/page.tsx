"use client"

import { CardEditorModal } from "@/components/card-editor-modal"
import { CardsGrid } from "@/components/cards-grid"
import { FolderDropZone } from "@/components/folder-drop-zone"
import { FolderSidebar } from "@/components/folder-sidebar"
import { ImportExportDialog } from "@/components/import-export-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useVocabStore } from "@/lib/store"
import type { Card } from "@/lib/types"
import { BookOpen, Download, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

export default function DashboardPage() {
  const { folders, cards } = useVocabStore()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined)
  const [importExportOpen, setImportExportOpen] = useState(false)

  const selectedFolder = folders.find((f) => f.id === selectedFolderId)

  const filteredCards = useMemo(() => {
    let result = selectedFolderId ? cards.filter((c) => c.folderId === selectedFolderId) : cards

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (card) =>
          card.ar.toLowerCase().includes(query) ||
          card.translit?.toLowerCase().includes(query) ||
          card.gloss.nl?.toLowerCase().includes(query) ||
          card.gloss.en?.toLowerCase().includes(query) ||
          card.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    return result
  }, [cards, selectedFolderId, searchQuery])

  const handleAddCard = () => {
    setEditingCard(undefined)
    setEditorOpen(true)
  }

  const handleEditCard = (card: Card) => {
    setEditingCard(card)
    setEditorOpen(true)
  }

  const otherFolders = folders.filter((f) => f.id !== selectedFolderId)

  return (
    <div className="flex h-screen">
      <FolderSidebar selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} />

      <div className="flex flex-1 flex-col">
        <header className="border-b bg-card">
          <div className="flex items-center justify-between p-4 md:pl-4 pl-16">
            <div>
              <h1 className="text-2xl font-bold">{selectedFolder ? selectedFolder.name : "Alle kaarten"}</h1>
              <p className="text-sm text-muted-foreground">
                {filteredCards.length} {filteredCards.length === 1 ? "kaart" : "kaarten"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => setImportExportOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Import/Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/study">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Studeren
                </Link>
              </Button>
              <Button onClick={handleAddCard} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe kaart
              </Button>
            </div>
          </div>

          <div className="border-t px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek kaarten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {folders.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                {selectedFolderId ? "Sleep kaarten naar een andere map:" : "Sleep kaarten naar een map:"}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {folders.map((folder) => (
                  <FolderDropZone key={folder.id} folderId={folder.id} folderName={folder.name} />
                ))}
              </div>
            </div>
          )}

          <CardsGrid cards={filteredCards} onEditCard={handleEditCard} />
        </main>
      </div>

      <CardEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        card={editingCard}
        defaultFolderId={selectedFolderId || undefined}
      />

      <ImportExportDialog open={importExportOpen} onOpenChange={setImportExportOpen} />
    </div>
  )
}
