"use client"

import type React from "react"

import { useState } from "react"
import { FolderOpen } from "lucide-react"
import { useVocabStore } from "@/lib/store"

interface FolderDropZoneProps {
  folderId: string
  folderName: string
}

export function FolderDropZone({ folderId, folderName }: FolderDropZoneProps) {
  const { moveCard } = useVocabStore()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const cardId = e.dataTransfer.getData("text/plain")
    if (cardId) {
      moveCard(cardId, folderId)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex items-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors ${
        isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25"
      }`}
    >
      <FolderOpen className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{folderName}</span>
    </div>
  )
}
