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
  const lastProcessedText = useRef<string>("")

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
        }, "image/jpeg", 0.9) // Higher quality
      })

      // OCR
      const formData = new FormData()
      formData.append("file", blob, "frame.jpg")
      formData.append("lang", "ara") // Arabic

      console.log("🔍 Sending OCR request...")
      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!ocrRes.ok) {
        console.error("❌ OCR failed:", ocrRes.status, ocrRes.statusText)
        throw new Error("OCR failed")
      }

      const ocrData = await ocrRes.json()
      console.log("📝 OCR result:", ocrData)
      
      let text = ocrData.text?.trim()
      console.log("📄 Raw detected text:", text)

      // Clean up the text - remove common OCR errors
      if (text) {
        // Remove common OCR artifacts
        text = text
          .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]/g, '') // Keep only Arabic characters and spaces
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim()
        
        // Remove single characters that are likely OCR errors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const words = text.split(' ').filter((word: any) => word.length > 1)
        text = words.join(' ')
      }
      
      console.log("📄 Cleaned text:", text)

      if (text && text.length > 2) { // Minimum 3 characters for Arabic
        // Only process if text is different from last processed
        if (text !== lastProcessedText.current) {
          lastProcessedText.current = text
          setDetectedText(text)

          // Translate
          console.log("🌐 Translating text...")
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
            console.log("✅ Translation result:", translateData)
            setTranslatedText(translateData.translatedText || "")
          } else {
            console.error("❌ Translation failed:", translateRes.status)
            setTranslatedText("Vertaling mislukt")
          }
        } else {
          console.log("🔄 Same text detected, skipping translation")
        }
      } else {
        console.log("⚠️ No text detected or text too short")
        // Don't clear existing text immediately, give user time to see it
      }
    } catch (err) {
      console.error("❌ Processing error:", err)
      setError("Verwerking mislukt. Probeer opnieuw.")
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
        }, 3000) // Every 3 seconds to avoid too frequent processing
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
          {(translatedText || detectedText) && (
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="max-w-md mx-auto space-y-4">
                {detectedText && (
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/20">
                    <p className="text-gray-600 text-xs mb-2 font-medium">Gedetecteerd</p>
                    <p className="text-gray-900 text-2xl font-arabic leading-relaxed" dir="rtl">
                      {detectedText}
                    </p>
                  </div>
                )}
                {translatedText && (
                  <div className="bg-blue-600 rounded-2xl p-4 shadow-2xl">
                    <p className="text-blue-100 text-xs mb-2 font-medium">Vertaling</p>
                    <p className="text-white text-2xl font-semibold leading-relaxed">
                      {translatedText}
                    </p>
                  </div>
                )}
                {isProcessing && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <p className="text-gray-700 text-sm">Verwerken...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!translatedText && !detectedText && !isLoading && !error && (
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl max-w-sm mx-auto">
                <div className="text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-gray-800 text-sm font-medium mb-1">
                    Richt camera op Arabische tekst
                  </p>
                  <p className="text-gray-600 text-xs">
                    Goede verlichting • Camera stil houden
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-16 left-4 bg-black/80 text-white p-2 rounded text-xs">
              <div>Processing: {isProcessing ? 'Yes' : 'No'}</div>
              <div>Detected: {detectedText ? 'Yes' : 'No'}</div>
              <div>Translated: {translatedText ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

