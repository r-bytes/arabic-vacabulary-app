import { requireAuth } from "@/lib/auth-helpers"
import { query } from "@/lib/db"
import { translateExampleSentence } from "@/lib/translate-example-sentence"
import { NextResponse } from "next/server"

async function generateTranslationsForUser(userId: string) {
  // Get all cards that have example sentences but no translations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cards]: any = await query(
    `SELECT id, example_sentence, nl, en, example_sentence_nl, example_sentence_en 
     FROM cards 
     WHERE user_id = ? 
       AND example_sentence IS NOT NULL 
       AND example_sentence != ''
       AND (example_sentence_nl IS NULL OR example_sentence_nl = '' OR example_sentence_en IS NULL OR example_sentence_en = '')`,
    [userId]
  )

  let updated = 0
  for (const card of cards) {
    if (card.example_sentence) {
      // Determine which languages to translate to
      const targetLanguages: ("nl" | "en")[] = []
      if (card.nl && (!card.example_sentence_nl || card.example_sentence_nl === '')) {
        targetLanguages.push("nl")
      }
      if (card.en && (!card.example_sentence_en || card.example_sentence_en === '')) {
        targetLanguages.push("en")
      }
      
      if (targetLanguages.length > 0) {
        try {
          const translations = await translateExampleSentence(
            card.example_sentence, 
            targetLanguages, 
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          )
          
          // Update only the missing translations (only if we got a translation)
          const updates: string[] = []
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const values: any[] = []
          let hasUpdate = false
          
          if (targetLanguages.includes("nl")) {
            if (translations.nl) {
              updates.push("example_sentence_nl = ?")
              values.push(translations.nl)
              hasUpdate = true
            } else if (card.example_sentence_nl && card.example_sentence_nl !== '') {
              // Keep existing translation
              updates.push("example_sentence_nl = ?")
              values.push(card.example_sentence_nl)
            }
          }
          
          if (targetLanguages.includes("en")) {
            if (translations.en) {
              updates.push("example_sentence_en = ?")
              values.push(translations.en)
              hasUpdate = true
            } else if (card.example_sentence_en && card.example_sentence_en !== '') {
              // Keep existing translation
              updates.push("example_sentence_en = ?")
              values.push(card.example_sentence_en)
            }
          }
          
          // Only update if we got at least one new translation
          if (hasUpdate && updates.length > 0) {
            values.push(card.id, userId)
            await query(
              `UPDATE cards SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
              values
            )
            updated++
          }
        } catch (error) {
          // Log error but continue with next card
          console.error(`Failed to translate example sentence for card ${card.id}:`, error instanceof Error ? error.message : error)
          // Don't throw - continue processing other cards
        }
      }
    }
  }

  return { updated, total: cards.length }
}

// Generate translations for example sentences that don't have them
export async function POST(): Promise<Response> {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user

  try {
    const result = await generateTranslationsForUser(user.id)
    return NextResponse.json({ 
      success: true, 
      ...result,
      message: `Generated translations for ${result.updated} example sentences out of ${result.total} cards`
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
    const result = await generateTranslationsForUser(user.id)
    return NextResponse.json({ 
      success: true, 
      ...result,
      message: `Generated translations for ${result.updated} example sentences out of ${result.total} cards`
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

