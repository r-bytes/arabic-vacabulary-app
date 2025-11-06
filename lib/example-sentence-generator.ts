// Simple example sentence generator for Arabic vocabulary
// Generates basic sentences using common Arabic sentence patterns

const COMMON_PATTERNS = [
  (word: string) => `هذا ${word}`,
  (word: string) => `هذه ${word}`,
  (word: string) => `أنا أقرأ ${word}`,
  (word: string) => `أنا أريد ${word}`,
  (word: string) => `أنا أحب ${word}`,
  (word: string) => `${word} جميل`,
  (word: string) => `${word} مفيد`,
  (word: string) => `أين ${word}؟`,
  (word: string) => `ما هو ${word}؟`,
  (word: string) => `لدي ${word}`,
]

const COMMON_PATTERNS_EN = [
  (word: string) => `This is a ${word}`,
  (word: string) => `I read a ${word}`,
  (word: string) => `I want a ${word}`,
  (word: string) => `I like the ${word}`,
  (word: string) => `The ${word} is beautiful`,
  (word: string) => `The ${word} is useful`,
  (word: string) => `Where is the ${word}?`,
  (word: string) => `What is a ${word}?`,
  (word: string) => `I have a ${word}`,
]

const COMMON_PATTERNS_NL = [
  (word: string) => `Dit is een ${word}`,
  (word: string) => `Ik lees een ${word}`,
  (word: string) => `Ik wil een ${word}`,
  (word: string) => `Ik hou van de ${word}`,
  (word: string) => `De ${word} is mooi`,
  (word: string) => `De ${word} is nuttig`,
  (word: string) => `Waar is de ${word}?`,
  (word: string) => `Wat is een ${word}?`,
  (word: string) => `Ik heb een ${word}`,
]

export async function generateExampleSentence(
  arabicWord: string,
  translation?: { nl?: string; en?: string }
): Promise<string> {
  console.log("generateExampleSentence", arabicWord, JSON.stringify(translation))
  // Try to generate in Arabic first (preferred)
  const patterns = COMMON_PATTERNS
  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)]
  const arabicSentence = randomPattern(arabicWord)

  // If we have translations, we could also generate bilingual sentences
  // For now, return Arabic sentence
  return arabicSentence
}

export async function generateExampleSentenceWithTranslation(
  arabicWord: string,
  translation?: { nl?: string; en?: string }
): Promise<{ ar: string; nl?: string; en?: string }> {
  const arabicSentence = await generateExampleSentence(arabicWord, translation)
  
  // If translations are available, generate example sentences in those languages too
  let nlSentence: string | undefined
  let enSentence: string | undefined

  if (translation?.nl) {
    const nlPattern = COMMON_PATTERNS_NL[Math.floor(Math.random() * COMMON_PATTERNS_NL.length)]
    nlSentence = nlPattern(translation.nl)
  }

  if (translation?.en) {
    const enPattern = COMMON_PATTERNS_EN[Math.floor(Math.random() * COMMON_PATTERNS_EN.length)]
    enSentence = enPattern(translation.en)
  }

  return {
    ar: arabicSentence,
    nl: nlSentence,
    en: enSentence,
  }
}

// Simple function to generate just Arabic sentence (for quick generation)
export function generateSimpleExampleSentence(arabicWord: string): string {
  const patterns = COMMON_PATTERNS
  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)]
  return randomPattern(arabicWord)
}

