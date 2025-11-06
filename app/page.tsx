"use client"

import { AuthButton } from "@/components/auth-button"
import { CameraTranslate } from "@/components/camera-translate"
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
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useSession } from "next-auth/react"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { folders, cards, setSelectedFolderIds } = useVocabStore()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined)
  const [importExportOpen, setImportExportOpen] = useState(false)

  // All hooks must be called before any early returns
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

  const selectedFolder = folders.find((f) => f.id === selectedFolderId)

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Laden...</div>
      </div>
    )
  }

  const handleAddCard = () => {
    setEditingCard(undefined)
    setEditorOpen(true)
  }

  const handleEditCard = (card: Card) => {
    setEditingCard(card)
    setEditorOpen(true)
  }

  return (
    <div className="flex h-screen">
      <FolderSidebar selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} />

      <div className="flex flex-1 flex-col">
        <header className="border-b bg-card">
          <div className="flex items-center justify-between p-4 md:pl-4 pl-16">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold truncate">{selectedFolder ? selectedFolder.name : "Alle kaarten"}</h1>
              <p className="text-sm text-muted-foreground">
                {filteredCards.length} {filteredCards.length === 1 ? "kaart" : "kaarten"}
              </p>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <CameraTranslate />
              <ThemeToggle />
              <AuthButton />
              <Button variant="outline" size="sm" onClick={() => setImportExportOpen(true)} className="flex">
                <Download className="md:mr-2 h-4 w-4" />
                <span className="hidden md:inline">Import/Export</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex"
                onClick={() => {
                  // If a folder is selected, use it for the study session
                  if (selectedFolderId) {
                    setSelectedFolderIds([selectedFolderId])
                    router.push("/study?auto=1")
                  } else {
                    // No folder selected → go to study page without auto-start
                    router.push("/study")
                  }
                }}
              >
                <BookOpen className="md:mr-2 h-4 w-4" />
                <span className="hidden md:inline">Studeren</span>
              </Button>
              <Button onClick={handleAddCard} size="sm">
                <Plus className="sm:mr-2 h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Nieuwe kaart</span>
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
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {folders.length > 0 && (
            <div className="mb-4 md:mb-6">
              <h3 className="mb-3 text-xs md:text-sm font-medium text-muted-foreground">
                {selectedFolderId ? "Sleep kaarten naar een andere map:" : "Sleep kaarten naar een map:"}
              </h3>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {folders.map((folder) => (
                  <FolderDropZone 
                    key={folder.id} 
                    folderId={folder.id} 
                    folderName={folder.name}
                    onSelectFolder={setSelectedFolderId}
                  />
                ))}
              </div>
            </div>
          )}

          <CardsGrid 
            cards={filteredCards} 
            onEditCard={handleEditCard}
            selectedFolderId={selectedFolderId}
            onFolderFilter={setSelectedFolderId}
          />
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
