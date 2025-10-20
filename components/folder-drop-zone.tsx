"use client"

import type React from "react"

import { useVocabStore } from "@/lib/store"
import { FolderOpen } from "lucide-react"
import { useState } from "react"

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
    console.log("Drop event:", { cardId, folderId, folderName })
    
    if (cardId) {
      console.log("Moving card", cardId, "to folder", folderId)
      moveCard(cardId, folderId)
    } else {
      console.log("No cardId found in drop data")
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
