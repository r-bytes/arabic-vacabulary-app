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
import { useVocabStore } from "@/lib/store"
import type { Card } from "@/lib/types"
import { GripVertical, Pencil, Trash2, Volume2 } from "lucide-react"
import { useState } from "react"

interface CardsGridProps {
  cards: Card[]
  onEditCard: (card: Card) => void
}

export function CardsGrid({ cards, onEditCard }: CardsGridProps) {
  const { deleteCard } = useVocabStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<string | null>(null)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)


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

  if (cards.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Geen kaarten gevonden. Voeg een nieuwe kaart toe om te beginnen.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragEnd={handleDragEnd}
            className={`group relative rounded-xl border bg-card p-3 md:p-4 shadow-sm transition-all hover:shadow-md ${
              draggedCard === card.id ? "opacity-50" : ""
            }`}
          >
            <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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

            <div className="mb-3 pr-20 md:pr-24">
              <div dir="rtl" className="text-xl md:text-2xl font-semibold leading-tight text-foreground">
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
