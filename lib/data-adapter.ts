import type { Card, Folder } from "./types"

export interface DataStore {
  folders: Folder[]
  cards: Card[]
}

const STORAGE_KEY = "arabic-vocab-data"

// Core storage functions
const getStore = (): DataStore => {
  if (typeof window === "undefined") {
    return { folders: [], cards: [] }
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return { folders: [], cards: [] }
  }
  return JSON.parse(stored)
}

const setStore = (store: DataStore): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// Folder operations
export const listFolders = (): Folder[] => {
  return getStore().folders
}

export const createFolder = (name: string): Folder => {
  const store = getStore()
  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  }
  store.folders.push(folder)
  setStore(store)
  return folder
}

export const renameFolder = (id: string, name: string): void => {
  const store = getStore()
  const folder = store.folders.find((f) => f.id === id)
  if (folder) {
    folder.name = name
    setStore(store)
  }
}

export const deleteFolder = (
  id: string,
  strategy: "delete-cards" | "move-cards",
  targetFolderId?: string
): void => {
  const store = getStore()
  store.folders = store.folders.filter((f) => f.id !== id)

  if (strategy === "delete-cards") {
    store.cards = store.cards.filter((c) => c.folderId !== id)
  } else if (strategy === "move-cards" && targetFolderId) {
    store.cards = store.cards.map((c) =>
      c.folderId === id ? { ...c, folderId: targetFolderId } : c
    )
  }

  setStore(store)
}

// Card operations
export const listCards = (folderId?: string): Card[] => {
  const cards = getStore().cards
  return folderId ? cards.filter((c) => c.folderId === folderId) : cards
}

export const createCard = (input: Omit<Card, "id">): Card => {
  const store = getStore()
  const card: Card = {
    id: crypto.randomUUID(),
    ...input,
  }
  store.cards.push(card)
  setStore(store)
  return card
}

export const updateCard = (id: string, input: Partial<Card>): void => {
  const store = getStore()
  const cardIndex = store.cards.findIndex((c) => c.id === id)
  if (cardIndex !== -1) {
    store.cards[cardIndex] = { ...store.cards[cardIndex], ...input }
    setStore(store)
  }
}

export const deleteCard = (id: string): void => {
  const store = getStore()
  store.cards = store.cards.filter((c) => c.id !== id)
  setStore(store)
}

export const moveCard = (cardId: string, targetFolderId: string): void => {
  const store = getStore()
  const cardIndex = store.cards.findIndex((c) => c.id === cardId)
  if (cardIndex !== -1) {
    store.cards[cardIndex] = { ...store.cards[cardIndex], folderId: targetFolderId }
    setStore(store)
  }
}

// Import/Export
export const importJSON = (data: DataStore): void => {
  setStore(data)
}

export const exportJSON = (): DataStore => {
  return getStore()
}

export const importCSV = (
  rows: Array<Record<string, string>>
): { success: number; errors: Array<{ row: number; error: string }> } => {
  const store = getStore()
  const errors: Array<{ row: number; error: string }> = []
  let success = 0

  rows.forEach((row, index) => {
    try {
      const folderName = row.folder || "Imported"
      let folder = store.folders.find((f) => f.name === folderName)

      if (!folder) {
        folder = {
          id: crypto.randomUUID(),
          name: folderName,
          createdAt: new Date().toISOString(),
        }
        store.folders.push(folder)
      }

      const card: Card = {
        id: crypto.randomUUID(),
        ar: row.ar || row.name || "",
        translit: row.translit,
        gloss: {
          nl: row.nl,
          en: row.en,
        },
        tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : undefined,
        folderId: folder.id,
        audioUrl: row.audioUrl,
        ttsHint: row.ttsHint,
      }

      if (!card.ar) {
        throw new Error("Arabic text is required")
      }

      store.cards.push(card)
      success++
    } catch (error) {
      errors.push({
        row: index + 1,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  })

  setStore(store)
  return { success, errors }
}

export const exportCSV = (): string => {
  const store = getStore()
  const headers = ["folder", "ar", "translit", "nl", "en", "tags", "audioUrl", "ttsHint"]
  const rows = store.cards.map((card) => {
    const folder = store.folders.find((f) => f.id === card.folderId)
    return [
      folder?.name || "",
      card.ar,
      card.translit || "",
      card.gloss.nl || "",
      card.gloss.en || "",
      card.tags?.join(",") || "",
      card.audioUrl || "",
      card.ttsHint || "",
    ]
  })

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
}

// Initialize with seed data
export const initializeSeed = (seedData: DataStore): void => {
  const store = getStore()
  if (store.folders.length === 0 && store.cards.length === 0) {
    setStore(seedData)
  }
}

// Export for compatibility (backwards compatibility with store.ts)
export const dataAdapter = {
  getStore,
  setStore,
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  listCards,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  importJSON,
  exportJSON,
  importCSV,
  exportCSV,
  initializeSeed,
}
