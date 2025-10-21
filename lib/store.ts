"use client"

import { toast } from "sonner"
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
        // Sync database data to localStorage as backup
        dataAdapter.setStore({ folders, cards })
        return
      } else {
      }
    } catch {
    }
    // Fallback to local adapter if API not available
    const folders = dataAdapter.listFolders()
    const cards = dataAdapter.listCards()
    set({ folders, cards })
  },

  setFolders: (folders) => set({ folders }),
  setCards: (cards) => set({ cards }),

  addFolder: (name) => {
    // Create temporary folder for immediate UI update
    const tempFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    }
    set({ folders: [...get().folders, tempFolder] })
    
    // Save to database
    const promise = fetch("/api/folders", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ name }) 
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((created) => {
        if (created?.id) {
          // Update with server ID
          const updatedFolder = { ...tempFolder, id: created.id }
          set({ folders: get().folders.map((f) => (f.id === tempFolder.id ? updatedFolder : f)) })
          // Sync to localStorage as backup - update the existing store
          const store = dataAdapter.getStore()
          const folderIndex = store.folders.findIndex(f => f.id === tempFolder.id)
          if (folderIndex >= 0) {
            store.folders[folderIndex] = updatedFolder
          } else {
            store.folders.push(updatedFolder)
          }
          dataAdapter.setStore(store)
        }
      })
      .catch(() => {
        // Fallback to localStorage only
        const store = dataAdapter.getStore()
        if (!store.folders.find(f => f.id === tempFolder.id)) {
          store.folders.push(tempFolder)
          dataAdapter.setStore(store)
        }
        throw new Error("Database niet beschikbaar")
      })

    toast.promise(promise, {
      loading: "Map aanmaken...",
      success: `Map "${name}" aangemaakt!`,
      error: "Map opgeslagen lokaal (database niet beschikbaar)",
    })

    return tempFolder
  },

  renameFolder: (id, name) => {
    // Immediate UI update
    set({
      folders: get().folders.map((f) => (f.id === id ? { ...f, name } : f)),
    })
    
    // Save to database
    const promise = fetch("/api/folders", { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id, name }) 
    })
      .then((r) => {
        if (r.ok) {
          // Sync to localStorage as backup
          dataAdapter.renameFolder(id, name)
        } else {
          return Promise.reject()
        }
      })
      .catch(() => {
        // Fallback to localStorage only
        dataAdapter.renameFolder(id, name)
        throw new Error("Database niet beschikbaar")
      })

    toast.promise(promise, {
      loading: "Map hernoemen...",
      success: `Map hernoemd naar "${name}"!`,
      error: "Map hernoemd lokaal (database niet beschikbaar)",
    })
  },

  deleteFolder: (id, strategy, targetFolderId) => {
    const folderName = get().folders.find((f) => f.id === id)?.name || "Map"
    
    // Immediate UI update
    const folders = get().folders.filter((f) => f.id !== id)
    let cards = get().cards

    if (strategy === "delete-cards") {
      cards = cards.filter((c) => c.folderId !== id)
    } else if (strategy === "move-cards" && targetFolderId) {
      cards = cards.map((c) => (c.folderId === id ? { ...c, folderId: targetFolderId } : c))
    }

    set({ folders, cards })
    
    // Save to database
    const promise = fetch("/api/folders", { 
      method: "DELETE", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id }) 
    })
      .then((r) => {
        if (r.ok) {
          // Sync to localStorage as backup
          dataAdapter.deleteFolder(id, strategy, targetFolderId)
        } else {
          return Promise.reject()
        }
      })
      .catch(() => {
        // Fallback to localStorage only
        dataAdapter.deleteFolder(id, strategy, targetFolderId)
        throw new Error("Database niet beschikbaar")
      })

    toast.promise(promise, {
      loading: "Map verwijderen...",
      success: `"${folderName}" verwijderd!`,
      error: "Map verwijderd lokaal (database niet beschikbaar)",
    })
  },

  addCard: (cardInput) => {
    // Create temporary card for immediate UI update
    const tempCard: Card = {
      id: crypto.randomUUID(),
      ...cardInput,
    }
    set({ cards: [...get().cards, tempCard] })
    
    // Save to database
    const promise = fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tempCard),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((created) => {
        if (created?.id) {
          // Update with server ID
          const updatedCard = { ...tempCard, id: created.id }
          set({
            cards: get().cards.map((c) => (c.id === tempCard.id ? updatedCard : c)),
          })
          // Sync to localStorage as backup - update the existing store
          const store = dataAdapter.getStore()
          const cardIndex = store.cards.findIndex(c => c.id === tempCard.id)
          if (cardIndex >= 0) {
            store.cards[cardIndex] = updatedCard
          } else {
            store.cards.push(updatedCard)
          }
          dataAdapter.setStore(store)
        }
      })
      .catch(() => {
        // Fallback to localStorage only
        const store = dataAdapter.getStore()
        if (!store.cards.find(c => c.id === tempCard.id)) {
          store.cards.push(tempCard)
          dataAdapter.setStore(store)
        }
        throw new Error("Database niet beschikbaar")
      })

    toast.promise(promise, {
      loading: "Kaart opslaan...",
      success: "Kaart toegevoegd!",
      error: "Kaart opgeslagen lokaal (database niet beschikbaar)",
    })

    return tempCard
  },

  updateCard: (id, updates) => {
    // Immediate UI update
    set({
      cards: get().cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })
    
    // Save to database
    const promise = fetch("/api/cards", { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id, ...updates }) 
    })
      .then((r) => {
        if (r.ok) {
          // Sync to localStorage as backup
          dataAdapter.updateCard(id, updates)
        } else {
          return Promise.reject()
        }
      })
      .catch(() => {
        // Fallback to localStorage only
        dataAdapter.updateCard(id, updates)
        throw new Error("Database niet beschikbaar")
      })

    toast.promise(promise, {
      loading: "Kaart bijwerken...",
      success: "Kaart bijgewerkt!",
      error: "Kaart opgeslagen lokaal (database niet beschikbaar)",
    })
  },

  deleteCard: (id) => {
    // Immediate UI update
    set({ cards: get().cards.filter((c) => c.id !== id) })
    
    // Delete from database
    const promise = fetch("/api/cards", { 
      method: "DELETE", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id }) 
    })
      .then((r) => {
        if (r.ok) {
          // Sync to localStorage as backup
          dataAdapter.deleteCard(id)
        } else {
          return Promise.reject()
        }
      })
      .catch(() => {
        // Fallback to localStorage only
        dataAdapter.deleteCard(id)
        throw new Error("Database niet beschikbaar")
      })

    toast.promise(promise, {
      loading: "Kaart verwijderen...",
      success: "Kaart verwijderd!",
      error: "Kaart verwijderd lokaal (database niet beschikbaar)",
    })
  },

  moveCard: (cardId, targetFolderId) => {
    const targetFolder = get().folders.find((f) => f.id === targetFolderId)?.name || "map"
    
    // Immediate UI update
    set({
      cards: get().cards.map((c) => (c.id === cardId ? { ...c, folderId: targetFolderId } : c)),
    })
    
    // Save to database (silent update, no toast needed for drag-drop)
    fetch("/api/cards", { 
      method: "PUT", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ id: cardId, folderId: targetFolderId }) 
    })
      .then((r) => {
        if (r.ok) {
          // Sync to localStorage as backup
          dataAdapter.moveCard(cardId, targetFolderId)
          toast.success(`Kaart verplaatst naar "${targetFolder}"`)
        } else {
          toast.error("Kaart opgeslagen lokaal (database niet beschikbaar)")
        }
      })
      .catch(() => {
        // Fallback to localStorage only
        dataAdapter.moveCard(cardId, targetFolderId)
        toast.error("Kaart opgeslagen lokaal (database niet beschikbaar)")
      })
  },

  setSelectedFolderIds: (ids) => set({ selectedFolderIds: ids }),
  setDirection: (direction) => set({ direction }),
  setDueOnly: (dueOnly) => set({ dueOnly }),
}))
