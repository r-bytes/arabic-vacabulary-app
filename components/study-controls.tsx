"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isDue } from "@/lib/srs"
import { useVocabStore } from "@/lib/store"
import type { Direction } from "@/lib/types"
import { ArrowLeftRight } from "lucide-react"

interface StudyControlsProps {
  onStartSession: () => void
}

export function StudyControls({ onStartSession }: StudyControlsProps) {
  const { folders, cards, selectedFolderIds, direction, dueOnly, setSelectedFolderIds, setDirection, setDueOnly } =
    useVocabStore()

  const handleFolderToggle = (folderId: string) => {
    if (selectedFolderIds.includes(folderId)) {
      setSelectedFolderIds(selectedFolderIds.filter((id) => id !== folderId))
    } else {
      setSelectedFolderIds([...selectedFolderIds, folderId])
    }
  }

  const handleSelectAll = () => {
    if (selectedFolderIds.length === folders.length) {
      setSelectedFolderIds([])
    } else {
      setSelectedFolderIds(folders.map((f) => f.id))
    }
  }

  const getCardCount = () => {
    let filtered = cards.filter((c) => selectedFolderIds.includes(c.folderId))
    if (dueOnly) {
      filtered = filtered.filter((c) => isDue(c.srs))
    }
    return filtered.length
  }

  const directionOptions: { value: Direction; label: string }[] = [
    { value: "ar-nl", label: "Arabisch → Nederlands" },
    { value: "nl-ar", label: "Nederlands → Arabisch" },
    { value: "ar-en", label: "Arabisch → Engels" },
    { value: "en-ar", label: "Engels → Arabisch" },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Selecteer mappen</h3>
          <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs md:text-sm">
            {selectedFolderIds.length === folders.length ? "Deselecteer alles" : "Selecteer alles"}
          </Button>
        </div>
        <div className="space-y-2 rounded-lg border p-3 md:p-4">
          {folders.map((folder) => {
            const folderCardCount = cards.filter((c) => c.folderId === folder.id).length
            return (
              <div key={folder.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`folder-${folder.id}`}
                  checked={selectedFolderIds.includes(folder.id)}
                  onCheckedChange={() => handleFolderToggle(folder.id)}
                />
                <Label
                  htmlFor={`folder-${folder.id}`}
                  className="flex flex-1 cursor-pointer items-center justify-between text-sm"
                >
                  <span className="truncate">{folder.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{folderCardCount}</span>
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="direction" className="mb-3 block text-sm font-medium">
          Richting
        </Label>
        <Select value={direction} onValueChange={(value) => setDirection(value as Direction)}>
          <SelectTrigger id="direction" className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {directionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-3 w-3" />
                  <span className="text-sm">{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="due-only" checked={dueOnly} onCheckedChange={(checked) => setDueOnly(checked as boolean)} />
        <Label htmlFor="due-only" className="cursor-pointer text-xs md:text-sm">
          Toon alleen kaarten die vandaag &apos;due&apos; zijn
        </Label>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 md:p-4">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold">{getCardCount()}</div>
          <div className="text-xs md:text-sm text-muted-foreground">kaarten geselecteerd</div>
        </div>
      </div>

      <Button onClick={onStartSession} disabled={getCardCount() === 0} className="w-full" size="lg">
        Start sessie
      </Button>
    </div>
  )
}
