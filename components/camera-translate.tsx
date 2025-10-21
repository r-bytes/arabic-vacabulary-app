"use client"

import { Button } from "@/components/ui/button"
import { Camera, Languages, Loader2, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

export function CameraTranslate() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [translatedText, setTranslatedText] = useState<string>("")
  const [detectedText, setDetectedText] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isOpenRef = useRef(isOpen)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const startCamera = useCallback(async (onReady: () => void) => {
    try {
      setError("")
      setIsLoading(true)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Gebruik achtercamera op mobiel
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setIsLoading(false)
      // Start processing after camera is ready
      onReady()
    } catch (err) {
      setError("Kan camera niet openen. Controleer de permissies.")
      setIsLoading(false)
    }
  }, [])

  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) {
      return
    }

    processingRef.current = true
    setIsProcessing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      
      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        processingRef.current = false
        setIsProcessing(false)
        return
      }

      // Capture frame
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error("Failed to capture"))
        }, "image/jpeg", 0.8)
      })

      // OCR
      const formData = new FormData()
      formData.append("image", blob, "frame.jpg")
      formData.append("lang", "ara") // Arabic

      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!ocrRes.ok) {
        throw new Error("OCR failed")
      }

      const ocrData = await ocrRes.json()
      const text = ocrData.text?.trim()

      if (text && text.length > 2) {
        setDetectedText(text)

        // Translate
        const translateRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            source: "ar",
            target: "nl",
          }),
        })

        if (translateRes.ok) {
          const translateData = await translateRes.json()
          setTranslatedText(translateData.translatedText || "")
        }
      }
    } catch (err) {
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const processFrame = useCallback(() => {
    if (!isOpenRef.current) return

    const doProcess = async () => {
      await captureAndProcess()
      
      // Schedule next process
      if (isOpenRef.current) {
        timeoutRef.current = setTimeout(() => {
          processFrame()
        }, 2000) // Every 2 seconds
      }
    }

    doProcess()
  }, [captureAndProcess])

  useEffect(() => {
    if (isOpen) {
      startCamera(processFrame)
    } else {
      stopCamera()
      setTranslatedText("")
      setDetectedText("")
      setError("")
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera, processFrame])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="h-9 w-9 md:hidden"
        title="Camera Vertaling"
      >
        <Camera className="h-4 w-4" />
        <span className="sr-only">Camera vertaling</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Video */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Languages className="h-5 w-5" />
                <span className="text-sm font-medium">Camera Vertaling</span>
                {isProcessing && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-white text-sm">Camera openen...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="bg-white rounded-lg p-6 mx-4 max-w-sm">
                <p className="text-red-600 text-center mb-4">{error}</p>
                <Button onClick={handleToggle} className="w-full">
                  Sluiten
                </Button>
              </div>
            </div>
          )}

          {/* Translation overlay */}
          {translatedText && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-6">
              <div className="space-y-3">
                {detectedText && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <p className="text-white/70 text-xs mb-1">Gedetecteerde tekst:</p>
                    <p className="text-white text-lg font-arabic leading-relaxed" dir="rtl">
                      {detectedText}
                    </p>
                  </div>
                )}
                <div className="bg-blue-500/90 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                  <p className="text-white/90 text-xs mb-1">Vertaling:</p>
                  <p className="text-white text-xl font-semibold">
                    {translatedText}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!translatedText && !isLoading && !error && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-white text-center text-sm">
                  Richt de camera op Arabische tekst om deze te vertalen
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

