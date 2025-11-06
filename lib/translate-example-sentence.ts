// Helper to translate example sentences
// Works both client-side and server-side

const SERVICES = [
  { url: "https://libretranslate.de/translate", name: "LibreTranslate.de" },
  { url: "https://translate.argosopentech.com/translate", name: "Argos" },
  { url: "https://api.mymemory.translated.net/get", name: "MyMemory" },
]

async function tryTranslate(text: string, source: string, target: string, apiKey?: string): Promise<string> {
  // Try LibreTranslate services first
  for (const service of SERVICES.slice(0, 2)) {
    try {
      const res = await fetch(service.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: source || "auto", target, format: "text", api_key: apiKey }),
        signal: AbortSignal.timeout(8000),
      })
      
      if (res.ok) {
        const contentType = res.headers.get("content-type")
        // Check if response is JSON before parsing
        if (contentType && contentType.includes("application/json")) {
          try {
            const data = await res.json()
            if (data.translatedText && typeof data.translatedText === "string") {
              return data.translatedText
            }
          } catch (jsonError) {
            // Response is not valid JSON, try next service
            console.error(`Invalid JSON response from ${service.name}:`, jsonError)
            continue
          }
        } else {
          // Response is not JSON (might be HTML error page)
          console.error(`Non-JSON response from ${service.name} (content-type: ${contentType})`)
          continue
        }
      }
    } catch (e) {
      // Network error or timeout - try next service
      console.error(`Error with ${service.name}:`, e instanceof Error ? e.message : e)
    }
  }

  // Fallback to MyMemory (different API format, more reliable)
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}%7C${target}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        try {
          const data = await res.json()
          if (data.responseData?.translatedText) {
            return data.responseData.translatedText
          }
        } catch (jsonError) {
          console.error("Invalid JSON response from MyMemory:", jsonError)
        }
      }
    }
  } catch (e) {
    console.error("Error with MyMemory:", e instanceof Error ? e.message : e)
  }

  throw new Error("All translation services failed")
}

export async function translateExampleSentence(
  sentence: string,
  targetLanguages: ("nl" | "en")[],
  baseUrl?: string
): Promise<{ nl?: string; en?: string }> {
  const translations: { nl?: string; en?: string } = {}

  // If baseUrl is provided, we're on the server - use direct translation
  // Otherwise, we're on the client - use API route
  if (baseUrl) {
    // Server-side: use direct translation
    const promises = targetLanguages.map(async (lang) => {
      try {
        const translatedText = await tryTranslate(sentence, "ar", lang, process.env.TRANSLATE_API_KEY)
        translations[lang] = translatedText
      } catch (error) {
        console.error(`Translation to ${lang} failed:`, error)
      }
    })
    await Promise.all(promises)
  } else {
    // Client-side: use API route
    const promises = targetLanguages.map(async (lang) => {
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sentence,
            source: "ar",
            target: lang,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.translatedText) {
            translations[lang] = data.translatedText
          }
        }
      } catch (error) {
        console.error(`Translation to ${lang} failed:`, error)
      }
    })

    await Promise.all(promises)
  }

  return translations
}

