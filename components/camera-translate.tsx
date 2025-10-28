"use client"

import { Button } from "@/components/ui/button"
import { Camera, Copy, Languages, Loader2, Play, Square, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

interface CameraTranslateProps {
  onResult?: (detectedText: string, translatedText: string) => void
  targetLanguage?: string
}

export function CameraTranslate({ onResult, targetLanguage = 'nl' }: CameraTranslateProps) {
  const [isOpen, setIsOpen] = useState(true) // Auto-open when used in modal
  const [isLoading, setIsLoading] = useState(false)
  const [translatedText, setTranslatedText] = useState<string>("")
  const [detectedText, setDetectedText] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)
  const [frozenImage, setFrozenImage] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isOpenRef = useRef(isOpen)
  const lastProcessedText = useRef<string>("")
  const translationCache = useRef<Map<string, string>>(new Map())

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    // Reset processing state
    processingRef.current = false
    setIsProcessing(false)
    // Clear cache when camera stops
    translationCache.current.clear()
    lastProcessedText.current = ""
  }, [])

  const startCamera = useCallback(async (onReady: () => void) => {
    try {
      setError("")
      setIsLoading(true)
      
      // Stop any existing camera first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
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
      // Reset and start processing
      processingRef.current = true
      onReady()
    } catch {
      setError("Kan camera niet openen. Controleer de permissies.")
      setIsLoading(false)
    }
  }, [])

  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !processingRef.current) {
      return
    }

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

      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!ocrRes.ok) {
        throw new Error("OCR failed")
      }

      const ocrData = await ocrRes.json()
      
      let text = ocrData.text?.trim()

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

      if (text && text.length > 2) { // Minimum 3 characters for Arabic
        // Only process if text is different from last processed
        if (text !== lastProcessedText.current) {
          lastProcessedText.current = text
          setDetectedText(text)

          // Check cache first
          const cachedTranslation = translationCache.current.get(text)
          if (cachedTranslation) {
            setTranslatedText(cachedTranslation)
          } else {
            try {
              // Translate with timeout
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for faster response
              
              const translateRes = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text,
                  source: "ar",
                  target: "nl",
                }),
                signal: controller.signal,
              })
              
              clearTimeout(timeoutId)

              if (translateRes.ok) {
                const translateData = await translateRes.json()
                const translation = translateData.translatedText || ""
                setTranslatedText(translation)
                // Cache the translation
                translationCache.current.set(text, translation)
              } else {
                setTranslatedText("Vertaling mislukt")
              }
            } catch (translateErr) {
              if ((translateErr as Error).name === 'AbortError') {
                setTranslatedText("Vertaling timeout")
              } else {
                setTranslatedText("Vertaling mislukt")
              }
            }
          }
        } else {
        }
      } else {
        // Clear processing state when no text is detected
        setIsProcessing(false)
        // Clear last processed text so it can be processed again if detected
        lastProcessedText.current = ""
        // Don't clear existing text immediately, give user time to see it
      }
    } catch (err) {
      console.error("Error with Camera Translate:", err)
      setError("Verwerking mislukt. Probeer opnieuw. Error: " + err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const processFrame = useCallback(() => {
    if (!isOpenRef.current || !processingRef.current) return

    const doProcess = async () => {
      await captureAndProcess()
      
      // Schedule next process only if still open and processing
      if (isOpenRef.current && processingRef.current) {
        timeoutRef.current = setTimeout(() => {
          processFrame()
        }, 1000) // Every 1 second for faster response
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

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error("Error with Copy:", err)
    }
  }

  const handleStartStop = () => {
    if (processingRef.current) {
      // Stop processing
      processingRef.current = false
      setIsProcessing(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    } else {
      // Start processing
      processingRef.current = true
      setIsProcessing(true)
      processFrame()
    }
  }

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    
    if (!ctx) return

    // Capture current frame
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    
    // Convert to data URL for display
    const imageData = canvas.toDataURL("image/jpeg", 0.9)
    setFrozenImage(imageData)
    setIsFrozen(true)
    processingRef.current = false
    setIsProcessing(false)
  }

  const handleUnfreeze = () => {
    setIsFrozen(false)
    setFrozenImage(null)
    processingRef.current = true
    setIsProcessing(true)
    processFrame()
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
          {/* Video or Frozen Image */}
          {isFrozen && frozenImage ? (
            <Image
              src={frozenImage}
              alt="Frozen frame"
              className="w-full h-full object-cover"
              width={1920}
              height={1080}
              priority
              unoptimized
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Languages className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {isFrozen ? "Foto - Vertaling bevroren" : "Camera Vertaling"}
                </span>
                {isProcessing && !isFrozen && (
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
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-600 text-xs font-medium">Gedetecteerd</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(detectedText)}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        title="Kopieer gedetecteerde tekst"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-gray-900 text-2xl font-arabic leading-relaxed" dir="rtl">
                      {detectedText}
                    </p>
                  </div>
                )}
                {translatedText && (
                  <div className="bg-primary rounded-2xl p-4 shadow-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-primary-foreground/90 text-xs font-medium">Vertaling</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(translatedText)}
                        className="h-6 w-6 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                        title="Kopieer vertaling"
                      >
                        {copySuccess ? (
                          <div className="h-3 w-3 rounded-full bg-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-primary-foreground text-2xl font-semibold leading-relaxed">
                      {translatedText}
                    </p>
                  </div>
                )}
                {(detectedText || translatedText) && onResult && (
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <Button
                      onClick={() => {
                        onResult(detectedText, translatedText)
                        setIsOpen(false)
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      Gebruik deze tekst
                    </Button>
                  </div>
                )}
                {isProcessing && !isFrozen && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <p className="text-gray-700 text-sm">Verwerken...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4">
              {!isFrozen ? (
                <>
                  {/* Photo Button */}
                  <Button
                    onClick={handleCapture}
                    size="lg"
                    className="rounded-full h-16 w-16 bg-white hover:bg-gray-100 shadow-2xl"
                  >
                    <div className="h-12 w-12 rounded-full border-4 border-gray-800" />
                  </Button>
                  
                  {/* Stop Button */}
                  <Button
                    onClick={handleStartStop}
                    variant="outline"
                    size="lg"
                    className="rounded-full h-12 w-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {isProcessing ? (
                      <Square className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleUnfreeze}
                  size="lg"
                  variant="default"
                  className="rounded-full px-6"
                >
                  Hervat Live Vertaling
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          {!translatedText && !detectedText && !isLoading && !error && (
            <div className="absolute bottom-20 left-0 right-0 p-6">
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

