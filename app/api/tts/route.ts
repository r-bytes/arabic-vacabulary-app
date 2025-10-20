import googleTTS from "google-tts-api"
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

    const language = pickLang(lang)
    const url = googleTTS.getAudioUrl(text, {
      lang: language,
      slow: false,
      host: "https://translate.google.com",
    })

    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream TTS failed" }, { status: 502 })
    }
    const arrayBuffer = await res.arrayBuffer()

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (err) {
    console.error("TTS error", err)
    return NextResponse.json({ error: "TTS failed" }, { status: 500 })
  }
}


