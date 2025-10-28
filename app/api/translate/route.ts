import { NextResponse } from "next/server"

// Multiple free translation services as fallbacks

const SERVICES = [
  { url: "https://libretranslate.de/translate", name: "LibreTranslate.de" },
  { url: "https://translate.argosopentech.com/translate", name: "Argos" },
  { url: "https://api.mymemory.translated.net/get", name: "MyMemory" },
]

async function tryTranslate(text: string, source: string, target: string, apiKey?: string): Promise<string> {
  // Try LibreTranslate first
  for (const service of SERVICES.slice(0, 2)) {
    try {
      const res = await fetch(service.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: source || "auto", target, format: "text", api_key: apiKey }),
        signal: AbortSignal.timeout(8000),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.translatedText && typeof data.translatedText === "string") {
          return data.translatedText
        }
      }
    } catch (e) {
      console.error(`Error with ${service.name}:`, e)
    }
  }

  // Fallback to MyMemory (different API format)
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}%7C${target}`)
    if (res.ok) {
      const data = await res.json()
      if (data.responseData?.translatedText) {
        return data.responseData.translatedText
      }
    }
  } catch (e) {
    console.error("Error with MyMemory:", e)
  }

  throw new Error("All translation services failed")
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { text, source, target } = await req.json()
    if (!text || !target) return NextResponse.json({ error: "Missing text/target" }, { status: 400 })


    const translatedText = await tryTranslate(text, source || "auto", target, process.env.TRANSLATE_API_KEY)
    
    return NextResponse.json({ translatedText })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


