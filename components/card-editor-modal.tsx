"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Card } from "@/lib/types"
import { useVocabStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AudioRecorder } from "@/components/audio-recorder"

interface CardEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: Card
  defaultFolderId?: string
}

export function CardEditorModal({ open, onOpenChange, card, defaultFolderId }: CardEditorModalProps) {
  const { folders, addCard, updateCard } = useVocabStore()
  const [formData, setFormData] = useState({
    ar: "",
    translit: "",
    nl: "",
    en: "",
    tags: "",
    folderId: defaultFolderId || "",
    audioUrl: "",
    ttsHint: "ar-SA",
  })

  useEffect(() => {
    if (card) {
      setFormData({
        ar: card.ar,
        translit: card.translit || "",
        nl: card.gloss.nl || "",
        en: card.gloss.en || "",
        tags: card.tags?.join(", ") || "",
        folderId: card.folderId,
        audioUrl: card.audioUrl || "",
        ttsHint: card.ttsHint || "ar-SA",
      })
    } else {
      setFormData({
        ar: "",
        translit: "",
        nl: "",
        en: "",
        tags: "",
        folderId: defaultFolderId || folders[0]?.id || "",
        audioUrl: "",
        ttsHint: "ar-SA",
      })
    }
  }, [card, defaultFolderId, folders, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cardData = {
      ar: formData.ar,
      translit: formData.translit || undefined,
      gloss: {
        nl: formData.nl || undefined,
        en: formData.en || undefined,
      },
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      folderId: formData.folderId,
      audioUrl: formData.audioUrl || undefined,
      ttsHint: formData.ttsHint || undefined,
    }

    if (card) {
      updateCard(card.id, cardData)
    } else {
      addCard(cardData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{card ? "Kaart bewerken" : "Nieuwe kaart"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ar">Arabisch *</Label>
              <Textarea
                id="ar"
                dir="rtl"
                value={formData.ar}
                onChange={(e) => setFormData({ ...formData, ar: e.target.value })}
                placeholder="كِتاب"
                required
                className="min-h-[80px] text-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translit">Transliteratie</Label>
              <Input
                id="translit"
                value={formData.translit}
                onChange={(e) => setFormData({ ...formData, translit: e.target.value })}
                placeholder="kitāb"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nl">Nederlands</Label>
              <Input
                id="nl"
                value={formData.nl}
                onChange={(e) => setFormData({ ...formData, nl: e.target.value })}
                placeholder="boek"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="en">Engels</Label>
              <Input
                id="en"
                value={formData.en}
                onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                placeholder="book"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="folder">Map *</Label>
              <Select
                value={formData.folderId}
                onValueChange={(value) => setFormData({ ...formData, folderId: value })}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Selecteer map..." />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (komma gescheiden)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="noun, place"
              />
            </div>
          </div>

          <AudioRecorder
            audioUrl={formData.audioUrl}
            onAudioChange={(url) => setFormData({ ...formData, audioUrl: url || "" })}
          />

          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-3 text-sm font-medium">Preview</h3>
            <div className="space-y-2">
              <div className="rounded-lg bg-card p-4 text-center">
                <div dir="rtl" className="text-3xl font-semibold">
                  {formData.ar || "..."}
                </div>
                {formData.translit && <div className="mt-2 text-sm text-muted-foreground">{formData.translit}</div>}
              </div>
              <div className="flex gap-2 text-sm">
                {formData.nl && (
                  <div className="flex-1 rounded-lg bg-card p-3">
                    <span className="font-medium">NL:</span> {formData.nl}
                  </div>
                )}
                {formData.en && (
                  <div className="flex-1 rounded-lg bg-card p-3">
                    <span className="font-medium">EN:</span> {formData.en}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!formData.ar || !formData.folderId}>
              {card ? "Opslaan" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
