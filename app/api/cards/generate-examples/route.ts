import { query } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { generateSimpleExampleSentence } from "@/lib/example-sentence-generator"
import { translateExampleSentence } from "@/lib/translate-example-sentence"

async function generateExamplesForUser(userId: string) {
  // Get all cards without example sentences, including their translations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cards]: any = await query(
    `SELECT id, ar, nl, en FROM cards WHERE user_id = ? AND (example_sentence IS NULL OR example_sentence = '')`,
    [userId]
  )

  let updated = 0
  for (const card of cards) {
    if (card.ar) {
      const exampleSentence = generateSimpleExampleSentence(card.ar)
      
      // Determine which languages to translate to
      const targetLanguages: ("nl" | "en")[] = []
      if (card.nl) targetLanguages.push("nl")
      if (card.en) targetLanguages.push("en")
      
      let nlTranslation: string | null = null
      let enTranslation: string | null = null
      
      if (targetLanguages.length > 0) {
        const translations = await translateExampleSentence(exampleSentence, targetLanguages, process.env.NEXTAUTH_URL || "http://localhost:3000")
        nlTranslation = translations.nl || null
        enTranslation = translations.en || null
      }
      
      await query(
        `UPDATE cards SET example_sentence = ?, example_sentence_nl = ?, example_sentence_en = ? WHERE id = ? AND user_id = ?`,
        [exampleSentence, nlTranslation, enTranslation, card.id, userId]
      )
      updated++
    }
  }

  return { updated, total: cards.length }
}

// Generate example sentences for all cards that don't have one
export async function POST(): Promise<Response> {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user

  try {
    const result = await generateExamplesForUser(user.id)
    return NextResponse.json({ 
      success: true, 
      ...result
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Also support GET for easy testing
export async function GET(): Promise<Response> {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user

  try {
    const result = await generateExamplesForUser(user.id)
    return NextResponse.json({ 
      success: true, 
      ...result,
      message: `Generated ${result.updated} example sentences for ${result.total} cards`
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

