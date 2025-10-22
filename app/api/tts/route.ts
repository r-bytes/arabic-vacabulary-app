import { NextResponse } from "next/server"


function pickLang(lang?: string): string {
  if (!lang) return "en"
  const l = lang.toLowerCase()
  if (l.includes("ar")) return "ar"
  if (l.includes("nl")) return "nl"
  if (l.includes("en")) return "en"
  return "en"
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { text, lang } = await req.json()
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 })
    }

    console.log(`🔊 TTS Request: "${text}" in ${lang}`)

    const language = pickLang(lang)
    console.log(`🌍 Selected language: ${language}`)

    try {
      // Try Google TTS with direct URL
      console.log("🔊 Trying Google TTS...")
      
      // Create Google TTS URL manually
      const encodedText = encodeURIComponent(text)
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${language}&client=tw-ob&q=${encodedText}`
      
      console.log(`🔗 TTS URL: ${url}`)

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (!res.ok) {
        throw new Error(`Google TTS failed: ${res.status} ${res.statusText}`)
      }
      
      const arrayBuffer = await res.arrayBuffer()
      console.log(`✅ Google TTS success: ${arrayBuffer.byteLength} bytes`)

      return new NextResponse(Buffer.from(arrayBuffer), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      })
    } catch (googleError) {
      console.error("❌ Google TTS failed:", googleError)
      
      // Return a simple error for now
      return NextResponse.json({ 
        error: "TTS service temporarily unavailable", 
        details: googleError instanceof Error ? googleError.message : 'Unknown error'
      }, { status: 503 })
    }
  } catch (err) {
    console.error("❌ TTS API Error:", err)
    return NextResponse.json({ 
      error: "TTS failed", 
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 })
  }
}


