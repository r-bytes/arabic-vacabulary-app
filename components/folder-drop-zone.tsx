"use client"

import type React from "react"

import { useVocabStore } from "@/lib/store"
import { FolderOpen } from "lucide-react"
import { useState } from "react"

interface FolderDropZoneProps {
  folderId: string
  folderName: string
  onSelectFolder?: (folderId: string) => void
}

export function FolderDropZone({ folderId, folderName, onSelectFolder }: FolderDropZoneProps) {
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

  const handleClick = () => {
    if (onSelectFolder) {
      onSelectFolder(folderId)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`flex items-center gap-2 rounded-lg border-2 border-dashed p-2 md:p-3 transition-colors cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
        isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25"
      }`}
      title={onSelectFolder ? `Klik om naar "${folderName}" te gaan` : `Sleep kaarten naar "${folderName}"`}
    >
      <FolderOpen className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-xs md:text-sm font-medium truncate">{folderName}</span>
    </div>
  )
}
