"use client"

import { useState } from "react"
import { Plus, FolderOpen, MoreVertical, Pencil, Trash2, Search } from "lucide-react"
import { useVocabStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FolderSidebar({
  selectedFolderId,
  onSelectFolder,
}: {
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
}) {
  const { folders, cards, addFolder, renameFolder, deleteFolder } = useVocabStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)
  const [deleteStrategy, setDeleteStrategy] = useState<"delete-cards" | "move-cards">("delete-cards")
  const [moveToFolderId, setMoveToFolderId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreating(false)
    }
  }

  const handleRenameFolder = (id: string) => {
    if (editName.trim()) {
      renameFolder(id, editName.trim())
      setEditingId(null)
      setEditName("")
    }
  }

  const handleDeleteClick = (id: string) => {
    setFolderToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete, deleteStrategy, moveToFolderId || undefined)
      if (selectedFolderId === folderToDelete) {
        onSelectFolder(null)
      }
      setDeleteDialogOpen(false)
      setFolderToDelete(null)
      setDeleteStrategy("delete-cards")
      setMoveToFolderId("")
    }
  }

  const filteredFolders = folders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getCardCount = (folderId: string) => {
    return cards.filter((c) => c.folderId === folderId).length
  }

  const otherFolders = folders.filter((f) => f.id !== folderToDelete)

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r bg-muted/30">
        <div className="border-b p-4">
          <h2 className="mb-3 text-lg font-semibold">Mappen</h2>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek mappen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsCreating(true)} variant="outline" size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe map
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            <button
              onClick={() => onSelectFolder(null)}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                selectedFolderId === null ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>Alle kaarten</span>
              </div>
              <span className="text-xs text-muted-foreground">{cards.length}</span>
            </button>

            {isCreating && (
              <div className="mb-2 rounded-lg border bg-card p-2">
                <Input
                  autoFocus
                  placeholder="Map naam..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder()
                    if (e.key === "Escape") {
                      setIsCreating(false)
                      setNewFolderName("")
                    }
                  }}
                  onBlur={handleCreateFolder}
                  className="h-8"
                />
              </div>
            )}

            {filteredFolders.map((folder) => (
              <div key={folder.id} className="mb-1">
                {editingId === folder.id ? (
                  <div className="rounded-lg border bg-card p-2">
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameFolder(folder.id)
                        if (e.key === "Escape") {
                          setEditingId(null)
                          setEditName("")
                        }
                      }}
                      onBlur={() => handleRenameFolder(folder.id)}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-accent ${
                      selectedFolderId === folder.id ? "bg-accent" : ""
                    }`}
                  >
                    <button
                      onClick={() => onSelectFolder(folder.id)}
                      className="flex flex-1 items-center gap-2 text-left text-sm"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground">{getCardCount(folder.id)}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingId(folder.id)
                            setEditName(folder.name)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Hernoemen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(folder.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Map verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze map bevat {folderToDelete ? getCardCount(folderToDelete) : 0} kaarten. Wat wil je doen met deze
              kaarten?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="delete-cards"
                checked={deleteStrategy === "delete-cards"}
                onChange={() => setDeleteStrategy("delete-cards")}
                className="h-4 w-4"
              />
              <label htmlFor="delete-cards" className="text-sm">
                Verwijder alle kaarten
              </label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="move-cards"
                  checked={deleteStrategy === "move-cards"}
                  onChange={() => setDeleteStrategy("move-cards")}
                  className="h-4 w-4"
                />
                <label htmlFor="move-cards" className="text-sm">
                  Verplaats kaarten naar:
                </label>
              </div>
              {deleteStrategy === "move-cards" && (
                <Select value={moveToFolderId} onValueChange={setMoveToFolderId}>
                  <SelectTrigger className="ml-6">
                    <SelectValue placeholder="Selecteer map..." />
                  </SelectTrigger>
                  <SelectContent>
                    {otherFolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteStrategy === "move-cards" && !moveToFolderId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
