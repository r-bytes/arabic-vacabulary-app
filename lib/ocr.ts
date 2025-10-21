// Dynamic import for Tesseract.js to avoid build issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createWorker: any = null

type OcrResult = {
  text: string
  confidence: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const workerByLang: Record<string, any> = {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getWorker(lang: string): Promise<any> {
  if (!createWorker) {
    const tesseract = await import("tesseract.js")
    createWorker = tesseract.createWorker
  }
  
  if (!workerByLang[lang]) {
    const worker = await createWorker(lang, 1, { logger: () => {} })
    workerByLang[lang] = worker
  }
  return workerByLang[lang]!
}

function preprocessImageToBlob(imageUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("No canvas context"))
      // scale up small images to help OCR (up to 2x)
      const scale = Math.min(2, Math.max(1, 800 / Math.max(img.naturalWidth, img.naturalHeight)))
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Grayscale + stronger contrast + light denoise
      const contrast = 1.4
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        let v = 0.299 * r + 0.587 * g + 0.114 * b
        v = (v - 128) * contrast + 128
        const clamped = Math.max(0, Math.min(255, v))
        data[i] = data[i + 1] = data[i + 2] = clamped
        // light threshold to reduce noise
        if (clamped < 20) {
          data[i] = data[i + 1] = data[i + 2] = 0
        }
      }
      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Failed to export canvas"))
        resolve(blob)
      }, "image/png", 0.92)
    }
    img.onerror = reject
    img.src = imageUrl
  })
}

export async function recognizeTextFromFile(file: File, lang: string = "eng"): Promise<OcrResult> {
  const originalUrl = URL.createObjectURL(file)
  try {
    const preBlob = await preprocessImageToBlob(originalUrl).catch(() => file)
    const inputUrl = preBlob instanceof Blob ? URL.createObjectURL(preBlob) : originalUrl
    const worker = await getWorker(lang)
    const result = await worker.recognize(inputUrl)
    const text = (result.data.text || "").replace(/[\u200f\u200e]/g, "").trim()
    const confidence = result.data.confidence || 0
    return { text, confidence }
  } finally {
    URL.revokeObjectURL(originalUrl)
  }
}


