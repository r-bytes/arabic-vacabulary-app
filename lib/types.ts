export interface Card {
  id: string
  ar: string
  translit?: string
  gloss: {
    nl?: string
    en?: string
  }
  tags?: string[]
  folderId: string
  audioUrl?: string
  ttsHint?: string
  exampleSentence?: string
  exampleSentenceTranslation?: {
    nl?: string
    en?: string
  }
  srs?: {
    interval: number
    ease: number
    due: string
  }
}

export interface Folder {
  id: string
  name: string
  createdAt: string
  isFavorite?: boolean
}

export type Direction = "ar-nl" | "nl-ar" | "ar-en" | "en-ar"

export interface StudySession {
  folderIds: string[]
  direction: Direction
  dueOnly: boolean
}
