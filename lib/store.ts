"use client"

import { create } from "zustand"
import type { Card, Folder, Direction } from "./types"
import { dataAdapter } from "./data-adapter"

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

  loadData: () => {
    const folders = dataAdapter.listFolders()
    const cards = dataAdapter.listCards()
    set({ folders, cards })
  },

  setFolders: (folders) => set({ folders }),
  setCards: (cards) => set({ cards }),

  addFolder: (name) => {
    const folder = dataAdapter.createFolder(name)
    set({ folders: [...get().folders, folder] })
    return folder
  },

  renameFolder: (id, name) => {
    dataAdapter.renameFolder(id, name)
    set({
      folders: get().folders.map((f) => (f.id === id ? { ...f, name } : f)),
    })
  },

  deleteFolder: (id, strategy, targetFolderId) => {
    dataAdapter.deleteFolder(id, strategy, targetFolderId)
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
    return card
  },

  updateCard: (id, updates) => {
    dataAdapter.updateCard(id, updates)
    set({
      cards: get().cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })
  },

  deleteCard: (id) => {
    dataAdapter.deleteCard(id)
    set({ cards: get().cards.filter((c) => c.id !== id) })
  },

  moveCard: (cardId, targetFolderId) => {
    dataAdapter.moveCard(cardId, targetFolderId)
    set({
      cards: get().cards.map((c) => (c.id === cardId ? { ...c, folderId: targetFolderId } : c)),
    })
  },

  setSelectedFolderIds: (ids) => set({ selectedFolderIds: ids }),
  setDirection: (direction) => set({ direction }),
  setDueOnly: (dueOnly) => set({ dueOnly }),
}))
