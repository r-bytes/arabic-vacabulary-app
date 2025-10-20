import type { Card, Folder } from "./types"

export interface DataStore {
  folders: Folder[]
  cards: Card[]
}

class DataAdapter {
  private storageKey = "arabic-vocab-data"

  private getStore(): DataStore {
    if (typeof window === "undefined") {
      return { folders: [], cards: [] }
    }
    const stored = localStorage.getItem(this.storageKey)
    if (!stored) {
      return { folders: [], cards: [] }
    }
    return JSON.parse(stored)
  }

  private setStore(store: DataStore): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(store))
  }

  // Folders
  listFolders(): Folder[] {
    return this.getStore().folders
  }

  createFolder(name: string): Folder {
    const store = this.getStore()
    const folder: Folder = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    }
    store.folders.push(folder)
    this.setStore(store)
    return folder
  }

  renameFolder(id: string, name: string): void {
    const store = this.getStore()
    const folder = store.folders.find((f) => f.id === id)
    if (folder) {
      folder.name = name
      this.setStore(store)
    }
  }

  deleteFolder(id: string, strategy: "delete-cards" | "move-cards", targetFolderId?: string): void {
    const store = this.getStore()
    store.folders = store.folders.filter((f) => f.id !== id)

    if (strategy === "delete-cards") {
      store.cards = store.cards.filter((c) => c.folderId !== id)
    } else if (strategy === "move-cards" && targetFolderId) {
      store.cards.forEach((c) => {
        if (c.folderId === id) {
          c.folderId = targetFolderId
        }
      })
    }

    this.setStore(store)
  }

  // Cards
  listCards(folderId?: string): Card[] {
    const cards = this.getStore().cards
    return folderId ? cards.filter((c) => c.folderId === folderId) : cards
  }

  createCard(input: Omit<Card, "id">): Card {
    const store = this.getStore()
    const card: Card = {
      id: crypto.randomUUID(),
      ...input,
    }
    store.cards.push(card)
    this.setStore(store)
    return card
  }

  updateCard(id: string, input: Partial<Card>): void {
    const store = this.getStore()
    const card = store.cards.find((c) => c.id === id)
    if (card) {
      Object.assign(card, input)
      this.setStore(store)
    }
  }

  deleteCard(id: string): void {
    const store = this.getStore()
    store.cards = store.cards.filter((c) => c.id !== id)
    this.setStore(store)
  }

  moveCard(cardId: string, targetFolderId: string): void {
    const store = this.getStore()
    const card = store.cards.find((c) => c.id === cardId)
    if (card) {
      card.folderId = targetFolderId
      this.setStore(store)
    }
  }

  // Import/Export
  importJSON(data: DataStore): void {
    this.setStore(data)
  }

  exportJSON(): DataStore {
    return this.getStore()
  }

  importCSV(rows: Array<Record<string, string>>): { success: number; errors: Array<{ row: number; error: string }> } {
    const store = this.getStore()
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

    this.setStore(store)
    return { success, errors }
  }

  exportCSV(): string {
    const store = this.getStore()
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
  initializeSeed(seedData: DataStore): void {
    const store = this.getStore()
    if (store.folders.length === 0 && store.cards.length === 0) {
      this.setStore(seedData)
    }
  }
}

export const dataAdapter = new DataAdapter()
