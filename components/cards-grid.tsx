"use client"

import type React from "react"

import { useState } from "react"
import { Pencil, Trash2, GripVertical } from "lucide-react"
import type { Card } from "@/lib/types"
import { useVocabStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface CardsGridProps {
  cards: Card[]
  onEditCard: (card: Card) => void
}

export function CardsGrid({ cards, onEditCard }: CardsGridProps) {
  const { deleteCard } = useVocabStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<string | null>(null)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)

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
    setDraggedCard(cardId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", cardId)
  }

  const handleDragEnd = () => {
    setDraggedCard(null)
  }

  if (cards.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Geen kaarten gevonden. Voeg een nieuwe kaart toe om te beginnen.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragEnd={handleDragEnd}
            className={`group relative rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md ${
              draggedCard === card.id ? "opacity-50" : ""
            }`}
          >
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEditCard(card)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => handleDeleteClick(card.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <div className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md hover:bg-accent active:cursor-grabbing">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            <div className="mb-3 pr-20">
              <div dir="rtl" className="text-2xl font-semibold leading-tight">
                {card.ar}
              </div>
              {card.translit && <div className="mt-1 text-xs text-muted-foreground">{card.translit}</div>}
            </div>

            <div className="space-y-1 text-sm">
              {card.gloss.nl && (
                <div>
                  <span className="font-medium text-muted-foreground">NL:</span> {card.gloss.nl}
                </div>
              )}
              {card.gloss.en && (
                <div>
                  <span className="font-medium text-muted-foreground">EN:</span> {card.gloss.en}
                </div>
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
          </div>
        ))}
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
