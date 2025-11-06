"use client"

import type React from "react"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ExampleSentence } from "@/components/example-sentence"
import { useVocabStore } from "@/lib/store"
import type { Card } from "@/lib/types"
import { CheckSquare, Filter, FolderInput, GripVertical, Pencil, Trash2, Volume2, X } from "lucide-react"
import { useState } from "react"

interface CardsGridProps {
  cards: Card[]
  onEditCard: (card: Card) => void
  selectedFolderId?: string | null
  onFolderFilter?: (folderId: string | null) => void
}

// Generate consistent color for folder based on name
const getFolderColor = (folderName: string): string => {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  ]
  const hash = folderName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

export function CardsGrid({ cards, onEditCard, selectedFolderId, onFolderFilter }: CardsGridProps) {
  const { deleteCard, moveCard, folders } = useVocabStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<string | null>(null)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [groupByFolder, setGroupByFolder] = useState(false)


  const playAudio = async (card: Card) => {
    if (playingAudio === card.id) return

    setPlayingAudio(card.id)
    
    try {
      if (card.audioUrl) {
        // Play recorded audio
        const audio = new Audio(card.audioUrl)
        await audio.play()
        audio.onended = () => setPlayingAudio(null)
        audio.onerror = () => setPlayingAudio(null)
      } else {
        // Use TTS as fallback
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: card.ar, 
            lang: 'ar',
            ttsHint: card.ttsHint || 'ar-SA'
          })
        })
        
        if (response.ok) {
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          await audio.play()
          audio.onended = () => {
            setPlayingAudio(null)
            URL.revokeObjectURL(audioUrl)
          }
          audio.onerror = () => {
            setPlayingAudio(null)
            URL.revokeObjectURL(audioUrl)
          }
        } else {
          setPlayingAudio(null)
        }
      }
    } catch (error) {
      console.error('Audio playback failed:', error)
      setPlayingAudio(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setCardToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (cardToDelete) {
      deleteCard(cardToDelete)
      setDeleteDialogOpen(false)
      setCardToDelete(null)
    }
  }

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    // Don't start drag if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      e.preventDefault()
      return
    }
    
    setDraggedCard(cardId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", cardId)
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedCard(null)
    
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
  }

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      setShowBulkActions(newSet.size > 0)
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedCards(new Set(cards.map((c) => c.id)))
    setShowBulkActions(true)
  }

  const deselectAll = () => {
    setSelectedCards(new Set())
    setShowBulkActions(false)
  }

  const bulkMoveToFolder = (folderId: string) => {
    selectedCards.forEach((cardId) => {
      moveCard(cardId, folderId)
    })
    deselectAll()
  }

  const bulkDelete = () => {
    selectedCards.forEach((cardId) => {
      deleteCard(cardId)
    })
    deselectAll()
  }

  // Group cards by folder
  const groupedCards = groupByFolder
    ? cards.reduce((acc, card) => {
        const folder = folders.find((f) => f.id === card.folderId)
        const folderName = folder?.name || "Onbekende map"
        if (!acc[folderName]) {
          acc[folderName] = []
        }
        acc[folderName].push(card)
        return acc
      }, {} as Record<string, Card[]>)
    : { "Alle kaarten": cards }

  if (cards.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Geen kaarten gevonden. Voeg een nieuwe kaart toe om te beginnen.</p>
      </div>
    )
  }

  return (
    <>
      {/* View Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Weergave:</span>
          <Button
            variant={groupByFolder ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupByFolder(!groupByFolder)}
            className="h-8"
          >
            <FolderInput className="mr-2 h-4 w-4" />
            Groepeer per map
          </Button>
        </div>
        
        {/* Folder Filter */}
        {onFolderFilter && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="h-8 rounded-md border bg-background px-3 text-sm"
              value={selectedFolderId || ""}
              onChange={(e) => onFolderFilter(e.target.value || null)}
            >
              <option value="">Alle mappen</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {showBulkActions && (
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAll}
              className="h-8"
            >
              <X className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Deselecteer</span> ({selectedCards.size})
            </Button>
            {selectedCards.size < cards.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="h-8"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Selecteer alles</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              className="h-8 flex-1 sm:flex-none rounded-md border bg-background px-3 text-sm"
              onChange={(e) => {
                if (e.target.value) {
                  bulkMoveToFolder(e.target.value)
                  e.target.value = ""
                }
              }}
              value=""
            >
              <option value="">Verplaats naar...</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <Button
              variant="destructive"
              size="sm"
              onClick={bulkDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Verwijder</span>
            </Button>
          </div>
        </div>
      )}

      {/* Grouped Cards */}
      <div className="space-y-6">
        {Object.entries(groupedCards).map(([folderName, folderCards]) => {
          const folder = folders.find((f) => f.name === folderName)
          const folderColor = folder ? getFolderColor(folder.name) : ""

          return (
            <div key={folderName}>
              {groupByFolder && (
                <div className="mb-3 flex items-center gap-3">
                  <div className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${folderColor}`}>
                    {folderName}
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm text-muted-foreground">
                    {folderCards.length} {folderCards.length === 1 ? "kaart" : "kaarten"}
                  </span>
                </div>
              )}
              
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {folderCards.map((card) => {
                  const cardFolder = folders.find((f) => f.id === card.folderId)
                  const cardFolderColor = cardFolder ? getFolderColor(cardFolder.name) : ""

                  return (
                    <div
                      key={card.id}
                      draggable={!selectedCards.has(card.id)}
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative rounded-xl border bg-card p-3 md:p-4 shadow-sm transition-all hover:shadow-md ${
                        draggedCard === card.id ? "opacity-50" : ""
                      } ${
                        selectedCards.has(card.id) ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute left-2 top-2 z-10">
                        <Checkbox
                          checked={selectedCards.has(card.id)}
                          onCheckedChange={() => toggleCardSelection(card.id)}
                          className="h-5 w-5"
                        />
                      </div>

                      {/* Folder Badge */}
                      {!groupByFolder && cardFolder && (
                        <div className="absolute right-4 bottom-4 z-10">
                          <div className={`rounded px-2 py-0.5 text-xs font-medium ${cardFolderColor}`}>
                            {cardFolder.name}
                          </div>
                        </div>
                      )}

                      <div className="absolute right-2 top-2 flex gap-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => {
                            e.stopPropagation()
                            playAudio(card)
                          }}
                          disabled={playingAudio === card.id}
                      >
                        <Volume2 className={`h-3 w-3 ${playingAudio === card.id ? 'animate-pulse' : ''}`} />
                      </Button>
                        <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditCard(card)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(card.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                        <div 
                        className="flex h-6 w-6 cursor-grab items-center justify-center rounded-md hover:bg-accent active:cursor-grabbing"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                      </div>
                      </div>

                      <div className="mb-3 pl-8 pr-24 sm:pr-20 md:pr-24">
                        <div dir="rtl" className="text-left text-xl md:text-2xl font-semibold leading-tight text-foreground">
                          {card.ar || "Geen Arabische tekst"}
                        </div>
                        {card.translit && <div className="mt-1 text-xs text-muted-foreground">{card.translit}</div>}
                      </div>

                      <div className="space-y-1 text-xs md:text-sm">
                        {card.gloss?.nl && (
                          <div className="text-foreground">
                            <span className="font-medium text-muted-foreground">NL:</span> {card.gloss.nl}
                          </div>
                        )}
                        {card.gloss?.en && (
                          <div className="text-foreground">
                            <span className="font-medium text-muted-foreground">EN:</span> {card.gloss.en}
                          </div>
                        )}
                        {!card.gloss?.nl && !card.gloss?.en && (
                          <div className="text-muted-foreground text-xs">Geen vertalingen</div>
                        )}
                      </div>

                      {card.tags && card.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {card.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {card.exampleSentence && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <ExampleSentence 
                            sentence={card.exampleSentence} 
                            lang="ar"
                            translation={card.exampleSentenceTranslation}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaart verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan worden gemaakt. De kaart wordt permanent verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
