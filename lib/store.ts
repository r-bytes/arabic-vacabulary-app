"use client"

import { create } from "zustand"
import { dataAdapter } from "./data-adapter"
import type { Card, Direction, Folder } from "./types"

interface VocabStore {
  folders: Folder[]
  cards: Card[]
  selectedFolderIds: string[]
  direction: Direction
  dueOnly: boolean

  // Actions
  loadData: () => void
  setFolders: (folders: Folder[]) => void
  setCards: (cards: Card[]) => void
  addFolder: (name: string) => Folder
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string, strategy: "delete-cards" | "move-cards", targetFolderId?: string) => void
  addCard: (card: Omit<Card, "id">) => Card
  updateCard: (id: string, updates: Partial<Card>) => void
  deleteCard: (id: string) => void
  moveCard: (cardId: string, targetFolderId: string) => void
  setSelectedFolderIds: (ids: string[]) => void
  setDirection: (direction: Direction) => void
  setDueOnly: (dueOnly: boolean) => void
}

export const useVocabStore = create<VocabStore>((set, get) => ({
  folders: [],
  cards: [],
  selectedFolderIds: [],
  direction: "ar-nl",
  dueOnly: false,

  loadData: async () => {
    try {
      const [foldersRes, cardsRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/cards"),
      ])
      if (foldersRes.ok && cardsRes.ok) {
        const [folders, cards] = await Promise.all([foldersRes.json(), cardsRes.json()])
        set({ folders, cards })
        return
      }
    } catch {}
    // Fallback to local adapter if API not available
    const folders = dataAdapter.listFolders()
    const cards = dataAdapter.listCards()
    set({ folders, cards })
  },

  setFolders: (folders) => set({ folders }),
  setCards: (cards) => set({ cards }),

  addFolder: (name) => {
    const temp = dataAdapter.createFolder(name)
    set({ folders: [...get().folders, temp] })
    fetch("/api/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
      .then((r) => r.ok ? r.json() : null)
      .then((created) => {
        if (created?.id) {
          set({ folders: get().folders.map((f) => (f.id === temp.id ? created : f)) })
        }
      })
      .catch(() => {})
    return temp
  },

  renameFolder: (id, name) => {
    dataAdapter.renameFolder(id, name)
    fetch("/api/folders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name }) }).catch(() => {})
    set({
      folders: get().folders.map((f) => (f.id === id ? { ...f, name } : f)),
    })
  },

  deleteFolder: (id, strategy, targetFolderId) => {
    dataAdapter.deleteFolder(id, strategy, targetFolderId)
    fetch("/api/folders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {})
    const folders = get().folders.filter((f) => f.id !== id)
    let cards = get().cards

    if (strategy === "delete-cards") {
      cards = cards.filter((c) => c.folderId !== id)
    } else if (strategy === "move-cards" && targetFolderId) {
      cards = cards.map((c) => (c.folderId === id ? { ...c, folderId: targetFolderId } : c))
    }

    set({ folders, cards })
  },

  addCard: (cardInput) => {
    const card = dataAdapter.createCard(cardInput)
    set({ cards: [...get().cards, card] })
    fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((created) => {
        if (created?.id) {
          set({
            cards: get().cards.map((c) => (c.id === card.id ? { ...created } : c)),
          })
        }
      })
      .catch(() => {})
    return card
  },

  updateCard: (id, updates) => {
    dataAdapter.updateCard(id, updates)
    fetch("/api/cards", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) }).catch(() => {})
    set({
      cards: get().cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })
  },

  deleteCard: (id) => {
    dataAdapter.deleteCard(id)
    fetch("/api/cards", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {})
    set({ cards: get().cards.filter((c) => c.id !== id) })
  },

  moveCard: (cardId, targetFolderId) => {
    dataAdapter.moveCard(cardId, targetFolderId)
    fetch("/api/cards", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cardId, folderId: targetFolderId }) }).catch(() => {})
    set({
      cards: get().cards.map((c) => (c.id === cardId ? { ...c, folderId: targetFolderId } : c)),
    })
  },

  setSelectedFolderIds: (ids) => set({ selectedFolderIds: ids }),
  setDirection: (direction) => set({ direction }),
  setDueOnly: (dueOnly) => set({ dueOnly }),
}))
