"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, Square, Trash2, Upload } from "lucide-react"
import { useRef, useState } from "react"

interface AudioRecorderProps {
  audioUrl?: string
  onAudioChange: (url: string | undefined) => void
}

export function AudioRecorder({ audioUrl, onAudioChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Choose a supported mimeType at runtime for broader browser support (Safari often lacks webm)
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/mpeg",
      ]
      const supportedType = preferredTypes.find((t) =>
        (window as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder?.isTypeSupported?.(t)
      ) || ""
      const mediaRecorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const finalType = mediaRecorderRef.current?.mimeType || supportedType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: finalType })
        const url = URL.createObjectURL(blob)
        onAudioChange(url)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      alert("Kon geen toegang krijgen tot de microfoon. Controleer je browser instellingen.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onAudioChange(url)
    }
  }

  const handleDelete = () => {
    onAudioChange(undefined)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-3">
      <Label>Audio (optioneel)</Label>

      {audioUrl ? (
        <div className="space-y-2">
          <audio src={audioUrl} controls className="w-full" />
          <Button variant="outline" size="sm" onClick={handleDelete} className="w-full bg-transparent">
            <Trash2 className="mr-2 h-4 w-4" />
            Verwijder audio
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {isRecording ? (
            <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950">
              <div className="mb-2 flex items-center justify-center gap-2 text-red-600">
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
                <span className="font-mono font-medium">{formatTime(recordingTime)}</span>
              </div>
              <Button onClick={stopRecording} variant="destructive" size="sm" className="w-full">
                <Square className="mr-2 h-4 w-4" />
                Stop opname
              </Button>
            </div>
          ) : (
            <>
              <Button onClick={startRecording} variant="outline" size="sm" className="w-full bg-transparent">
                <Mic className="mr-2 h-4 w-4" />
                Neem audio op
              </Button>
              <div className="relative">
                <Input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="audio-upload" />
                <Label htmlFor="audio-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm transition-colors hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    <span>Of upload een audio bestand</span>
                  </div>
                </Label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
