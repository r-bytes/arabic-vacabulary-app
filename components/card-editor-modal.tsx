"use client"

import type React from "react"

import { AudioRecorder } from "@/components/audio-recorder"
import { ExampleSentence } from "@/components/example-sentence"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useVocabStore } from "@/lib/store"
import type { Card } from "@/lib/types"
import { generateSimpleExampleSentence } from "@/lib/example-sentence-generator"
import { translateExampleSentence } from "@/lib/translate-example-sentence"
import { Clipboard, RotateCcw, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

// Enhanced Arabic to Latin transliteration with diacritics
function transliterateArabic(arabic: string): string {
  const transliterationMap: Record<string, string> = {
    'ا': 'ā', 'أ': 'a', 'إ': 'i', 'آ': 'ā',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
    'ح': 'ḥ', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
    'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ', 'ظ': 'ẓ',
    'ع': 'ʿ', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'ā',
    'ة': 'a', 'ء': 'ʾ', 'ؤ': 'w', 'ئ': 'y',
    'لا': 'lā', 'ال': 'al-'
  }
  
  let result = arabic
  
  // Process diacritics first
  result = result.replace(/َ/g, 'a').replace(/ُ/g, 'u').replace(/ِ/g, 'i')
  result = result.replace(/ً/g, 'an').replace(/ٌ/g, 'un').replace(/ٍ/g, 'in')
  result = result.replace(/ّ/g, '') // shadda (gemination)
  result = result.replace(/ْ/g, '') // sukun (no vowel)
  
  // Then transliterate letters
  for (const [arabicChar, latinChar] of Object.entries(transliterationMap)) {
    result = result.replace(new RegExp(arabicChar, 'g'), latinChar)
  }
  
  return result.trim()
}

// Add diacritics to Arabic text (simplified version)
function addDiacriticsToArabic(arabic: string): string {
  // This is a simplified version - in a real app you'd use a proper Arabic diacritics library
  const diacriticsMap: Record<string, string> = {
    'كتاب': 'كِتَاب',
    'ماء': 'مَاء',
    'بيت': 'بَيْت',
    'شمس': 'شَمْس',
    'قمر': 'قَمَر',
    'نجم': 'نَجْم',
    'بحر': 'بَحْر',
    'جبل': 'جَبَل',
    'شجر': 'شَجَر',
    'ورد': 'وَرْد',
    'عسل': 'عَسَل',
    'حليب': 'حَلِيب',
    'خبز': 'خُبْز',
    'لحم': 'لَحْم',
    'سمك': 'سَمَك',
    'دجاج': 'دَجَاج',
    'بيض': 'بَيْض',
    'جبن': 'جُبْن',
    'زبدة': 'زُبْدَة',
    'سكر': 'سُكَّر',
    'ملح': 'مِلْح',
    'فلفل': 'فِلْفِل',
    'بصل': 'بَصَل',
    'ثوم': 'ثَوْم',
    'طماطم': 'طَمَاطِم',
    'خيار': 'خِيَار',
    'جزر': 'جَزَر',
    'بطاطس': 'بَطَاطِس',
    'أرز': 'أَرُز',
    'معكرونة': 'مَعْكَرُونَة',
    'ذهب': 'ذَهَب',
    'فضة': 'فِضَّة',
    'نحاس': 'نُحَاس',
    'حديد': 'حَدِيد',
    'خشب': 'خَشَب',
    'حجر': 'حَجَر',
    'رمل': 'رَمْل',
    'تراب': 'تُرَاب',
    'نار': 'نَار',
    'هواء': 'هَوَاء',
    'أرض': 'أَرْض',
    'سماء': 'سَمَاء',
    'سحاب': 'سَحَاب',
    'مطر': 'مَطَر',
    'ثلج': 'ثَلْج',
    'ريح': 'رِيح',
    'برد': 'بَرْد',
    'حر': 'حَر',
    'صيف': 'صَيْف',
    'شتاء': 'شِتَاء',
    'ربيع': 'رَبِيع',
    'خريف': 'خَرِيف'
  }
  
  // Check if the word exists in our map
  if (diacriticsMap[arabic]) {
    return diacriticsMap[arabic]
  }
  
  // If not found, return original
  return arabic
}

// Simple word type detection for tags
function detectWordType(arabic: string, dutch: string, english: string): string[] {
  const tags: string[] = []
  
  // Check for common patterns
  const text = `${arabic} ${dutch} ${english}`.toLowerCase()
  
  if (text.includes('boek') || text.includes('book') || text.includes('كتاب')) {
    tags.push('noun')
  }
  if (text.includes('gaan') || text.includes('go') || text.includes('ذهب')) {
    tags.push('verb')
  }
  if (text.includes('groot') || text.includes('big') || text.includes('كبير')) {
    tags.push('adjective')
  }
  if (text.includes('hier') || text.includes('here') || text.includes('هنا')) {
    tags.push('adverb')
  }
  if (text.includes('in') || text.includes('في')) {
    tags.push('preposition')
  }
  
  // Default to noun if no specific type detected
  if (tags.length === 0) {
    tags.push('noun')
  }
  
  return tags
}

interface CardEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: Card
  defaultFolderId?: string
}

export function CardEditorModal({ open, onOpenChange, card, defaultFolderId }: CardEditorModalProps) {
  const { folders, addCard, updateCard } = useVocabStore()
  const [formData, setFormData] = useState({
    ar: "",
    translit: "",
    nl: "",
    en: "",
    tags: "",
    folderId: defaultFolderId || folders[0]?.id || "",
    audioUrl: "",
    ttsHint: "ar-SA",
    exampleSentence: "",
    exampleSentenceNl: "",
    exampleSentenceEn: "",
  })
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [generatingExample, setGeneratingExample] = useState(false)

  // Paste functionality
  const handlePaste = async (field: 'ar' | 'nl' | 'en') => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        setFormData(prev => ({ ...prev, [field]: text.trim() }))
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }


  useEffect(() => {
    if (card) {
      setFormData({
        ar: card.ar,
        translit: card.translit || "",
        nl: card.gloss.nl || "",
        en: card.gloss.en || "",
        tags: card.tags?.join(", ") || "",
        folderId: card.folderId,
        audioUrl: card.audioUrl || "",
        ttsHint: card.ttsHint || "ar-SA",
        exampleSentence: card.exampleSentence || "",
        exampleSentenceNl: card.exampleSentenceTranslation?.nl || "",
        exampleSentenceEn: card.exampleSentenceTranslation?.en || "",
      })
    } else {
      setFormData({
        ar: "",
        translit: "",
        nl: "",
        en: "",
        tags: "",
        folderId: defaultFolderId || folders[0]?.id || "",
        audioUrl: "",
        ttsHint: "ar-SA",
        exampleSentence: "",
        exampleSentenceNl: "",
        exampleSentenceEn: "",
      })
    }
  }, [card, defaultFolderId, folders, open])

  const handleGenerateExample = async () => {
    if (!formData.ar) return
    
    setGeneratingExample(true)
    const example = generateSimpleExampleSentence(formData.ar)
    setFormData(prev => ({ ...prev, exampleSentence: example }))
    
    // Translate the example sentence
    const targetLanguages: ("nl" | "en")[] = []
    if (formData.nl) targetLanguages.push("nl")
    if (formData.en) targetLanguages.push("en")
    
    if (targetLanguages.length > 0 && example) {
      try {
        const translations = await translateExampleSentence(example, targetLanguages)
        setFormData(prev => ({
          ...prev,
          exampleSentenceNl: translations.nl || "",
          exampleSentenceEn: translations.en || "",
        }))
      } catch (error) {
        console.error("Failed to translate example sentence:", error)
      }
    }
    
    setGeneratingExample(false)
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const cardData = {
      ar: formData.ar,
      translit: formData.translit || undefined,
      gloss: {
        nl: formData.nl || undefined,
        en: formData.en || undefined,
      },
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
      folderId: formData.folderId,
      audioUrl: formData.audioUrl || undefined,
      ttsHint: formData.ttsHint || undefined,
      exampleSentence: formData.exampleSentence || undefined,
      exampleSentenceTranslation: (formData.exampleSentenceNl || formData.exampleSentenceEn) ? {
        nl: formData.exampleSentenceNl || undefined,
        en: formData.exampleSentenceEn || undefined,
      } : undefined,
    }

    if (card) {
      updateCard(card.id, cardData)
    } else {
      addCard(cardData)
    }

    onOpenChange(false)
  }

  const clearAllFields = () => {
    setFormData({
      ar: "",
      translit: "",
      nl: "",
      en: "",
      tags: "",
      folderId: defaultFolderId || folders[0]?.id || "",
      audioUrl: "",
      ttsHint: "ar-SA",
      exampleSentence: "",
      exampleSentenceNl: "",
      exampleSentenceEn: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0 w-[calc(100vw-2rem)] sm:w-auto bg-background border-2 border-border shadow-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">{card ? "Kaart bewerken" : "Nieuwe kaart"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Content Section */}
          <div className="rounded-lg border-2 border-border bg-card p-6 space-y-6 shadow-lg">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Inhoud</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ar" className="text-base font-bold text-foreground">Arabisch *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaste('ar')}
                    className="h-8 px-3 font-semibold border-2"
                  >
                    <Clipboard className="h-3 w-3 mr-1" />
                    Plak
                  </Button>
                </div>
                <Textarea
                  id="ar"
                  dir="rtl"
                  value={formData.ar}
                  onChange={(e) => setFormData({ ...formData, ar: e.target.value })}
                  placeholder="كِتاب"
                  required
                  className="min-h-[80px] text-2xl border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="translit" className="text-base font-bold text-foreground">Transliteratie</Label>
                <Input
                  id="translit"
                  value={formData.translit}
                  readOnly
                  placeholder="kitāb"
                  className="bg-muted/80 border-2 border-muted-foreground/40 text-foreground font-medium"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nl" className="text-base font-bold text-foreground">Nederlands</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaste('nl')}
                    className="h-8 px-3 font-semibold border-2"
                  >
                    <Clipboard className="h-3 w-3 mr-1" />
                    Plak
                  </Button>
                </div>
                <Input
                  id="nl"
                  value={formData.nl}
                  onChange={(e) => setFormData({ ...formData, nl: e.target.value })}
                  placeholder="boek"
                  className="border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="en" className="text-base font-bold text-foreground">Engels</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePaste('en')}
                    className="h-8 px-3 font-semibold border-2"
                  >
                    <Clipboard className="h-3 w-3 mr-1" />
                    Plak
                  </Button>
                </div>
                <Input
                  id="en"
                  value={formData.en}
                  onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                  placeholder="book"
                  className="border-2 border-border focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Auto translate logic */}
          {autoTranslate && (
            <AutoTranslateFields
              value={{
                ar: formData.ar,
                nl: formData.nl,
                en: formData.en,
                translit: formData.translit,
                tags: formData.tags,
                exampleSentence: formData.exampleSentence,
                exampleSentenceNl: formData.exampleSentenceNl,
                exampleSentenceEn: formData.exampleSentenceEn,
              }}
              onResult={(partial) => setFormData((prev) => ({ ...prev, ...partial }))}
            />
          )}

          {/* Metadata Section */}
          <div className="rounded-lg border-2 border-border bg-card p-6 space-y-6 shadow-lg">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Metadata</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="folder" className="text-base font-bold text-foreground">Map *</Label>
                <Select
                  value={formData.folderId}
                  onValueChange={(value) => setFormData({ ...formData, folderId: value })}
                >
                  <SelectTrigger id="folder" className="border-2 border-border focus:border-primary">
                    <SelectValue placeholder="Selecteer map..." />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-base font-bold text-foreground">Tags (komma gescheiden)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  readOnly
                  placeholder="noun, place"
                  className="bg-muted/80 border-2 border-muted-foreground/40 text-foreground font-medium"
                />
              </div>
            </div>
          </div>

          <AudioRecorder
            audioUrl={formData.audioUrl}
            onAudioChange={(url) => setFormData({ ...formData, audioUrl: url || "" })}
          />

          {/* Example Sentence Section */}
          <div className="rounded-lg border-2 border-border bg-card p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Voorbeeldzin</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateExample}
                disabled={!formData.ar || generatingExample}
                className="font-semibold border-2"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {generatingExample ? "Genereren..." : "Genereer"}
              </Button>
            </div>
            <div className="space-y-2">
              <Textarea
                value={formData.exampleSentence}
                onChange={(e) => setFormData({ ...formData, exampleSentence: e.target.value })}
                placeholder="هذا كتاب"
                dir="rtl"
                className="min-h-[60px] text-lg border-2 border-border focus:border-primary"
              />
              {formData.exampleSentence && (
                <ExampleSentence 
                  sentence={formData.exampleSentence} 
                  lang="ar"
                  translation={{ 
                    nl: formData.exampleSentenceNl || undefined, 
                    en: formData.exampleSentenceEn || undefined 
                  }}
                />
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="rounded-lg border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/20 p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-foreground border-b border-primary/30 pb-2">Preview</h3>
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-border bg-background p-6 text-center shadow-lg">
                <div dir="rtl" className="text-4xl font-bold text-foreground">
                  {formData.ar || "..."}
                </div>
                {formData.translit && <div className="mt-3 text-lg font-semibold text-muted-foreground">{formData.translit}</div>}
              </div>
              <div className="flex gap-3 text-base">
                {formData.nl && (
                  <div className="flex-1 rounded-lg border-2 border-border bg-background p-4 shadow-lg">
                    <span className="font-bold text-foreground">NL:</span> <span className="text-foreground font-semibold">{formData.nl}</span>
                  </div>
                )}
                {formData.en && (
                  <div className="flex-1 rounded-lg border-2 border-border bg-background p-4 shadow-lg">
                    <span className="font-bold text-foreground">EN:</span> <span className="text-foreground font-semibold">{formData.en}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between border-t border-border pt-6">
            <div className="flex justify-center sm:justify-start">
              <Button type="button" variant="destructive" onClick={clearAllFields} className="w-full sm:w-auto font-semibold border-2">
                <RotateCcw className="mr-2 h-4 w-4" />
                Wissen
              </Button>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none font-semibold border-2">
                Annuleren
              </Button>
              <Button type="submit" disabled={!formData.ar || !formData.folderId} className="flex-1 sm:flex-none font-semibold border-2">
                {card ? "Opslaan" : "Toevoegen"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay)
    return () => clearTimeout(handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])
}

function AutoTranslateFields({
  value,
  onResult,
}: {
  value: { ar: string; nl: string; en: string; translit: string; tags: string; exampleSentence: string; exampleSentenceNl: string; exampleSentenceEn: string }
  onResult: (partial: Partial<{ ar: string; nl: string; en: string; translit: string; tags: string; exampleSentence: string; exampleSentenceNl: string; exampleSentenceEn: string }>) => void
}) {
  const [busy, setBusy] = useState(false)
  const [lastProcessed, setLastProcessed] = useState("")

  useDebouncedEffect(() => {
    const run = async () => {
      if (busy) return
      
      // Find the source text (the one that was just filled)
      const sourceText = value.ar || value.nl || value.en
      if (!sourceText || sourceText === lastProcessed) return
      
      // Determine source language
      let sourceLang = "auto"
      if (value.ar && value.ar === sourceText) sourceLang = "ar"
      else if (value.nl && value.nl === sourceText) sourceLang = "nl" 
      else if (value.en && value.en === sourceText) sourceLang = "en"
      
      setLastProcessed(sourceText)
      setBusy(true)
      
      try {
        // Fill missing fields only
        const promises = []
        
        if (!value.nl && sourceLang !== "nl") {
          promises.push(
            fetch("/api/translate", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ text: sourceText, source: sourceLang, target: "nl" }) 
            })
              .then((r) => r.json())
              .then((j) => {
                if (j?.translatedText) {
                  onResult({ nl: j.translatedText })
                }
              })
              .catch((e) => console.error("NL translation failed:", e))
          )
        }
        
        if (!value.en && sourceLang !== "en") {
          promises.push(
            fetch("/api/translate", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ text: sourceText, source: sourceLang, target: "en" }) 
            })
              .then((r) => r.json())
              .then((j) => {
                if (j?.translatedText) {
                  onResult({ en: j.translatedText })
                }
              })
              .catch((e) => console.error("EN translation failed:", e))
          )
        }
        
        if (!value.ar && sourceLang !== "ar") {
          promises.push(
            fetch("/api/translate", { 
              method: "POST", 
              headers: { "Content-Type": "application/json" }, 
              body: JSON.stringify({ text: sourceText, source: sourceLang, target: "ar" }) 
            })
              .then((r) => r.json())
              .then((j) => {
                if (j?.translatedText) {
                  // Clean the translation - remove any English text that might be mixed in
                  const cleanArabic = j.translatedText.replace(/[a-zA-Z\s\/]+/g, '').trim()
                  if (cleanArabic) {
                    onResult({ ar: cleanArabic })
                  }
                }
              })
              .catch((e) => console.error("AR translation failed:", e))
          )
        }
        
        await Promise.all(promises)
        
        // Auto-fill transliteration if Arabic text is present and transliteration is empty
        if (value.ar && !value.translit && /[\u0600-\u06FF]/.test(value.ar)) {
          const transliteration = transliterateArabic(value.ar)
          if (transliteration) {
            onResult({ translit: transliteration })
          }
        }
        
        // Auto-add diacritics to Arabic text if it doesn't have them
        if (value.ar && !value.ar.match(/[\u064B-\u0652\u0670\u0640]/) && /[\u0600-\u06FF]/.test(value.ar)) {
          const arabicWithDiacritics = addDiacriticsToArabic(value.ar)
          if (arabicWithDiacritics !== value.ar) {
            onResult({ ar: arabicWithDiacritics })
          }
        }
        
        // Auto-fill tags if we have content but no tags
        if ((value.ar || value.nl || value.en) && !value.tags) {
          const detectedTags = detectWordType(value.ar, value.nl, value.en)
          if (detectedTags.length > 0) {
            onResult({ tags: detectedTags.join(', ') })
          }
        }
        
        // Auto-generate example sentence if Arabic text is present and example sentence is empty
        if (value.ar && !value.exampleSentence && /[\u0600-\u06FF]/.test(value.ar)) {
          const example = generateSimpleExampleSentence(value.ar)
          if (example) {
            onResult({ exampleSentence: example })
            
            // Also translate the example sentence if we have translations
            const targetLanguages: ("nl" | "en")[] = []
            if (value.nl) targetLanguages.push("nl")
            if (value.en) targetLanguages.push("en")
            
            if (targetLanguages.length > 0) {
              translateExampleSentence(example, targetLanguages)
                .then((translations) => {
                  onResult({
                    exampleSentenceNl: translations.nl || "",
                    exampleSentenceEn: translations.en || "",
                  })
                })
                .catch((error) => {
                  console.error("Failed to translate example sentence:", error)
                })
            }
          }
        }
        
      } catch (e) {
        console.error("Auto-translate error:", e)
      } finally {
        setBusy(false)
      }
    }
    run()
  }, [value.ar, value.nl, value.en, value.translit, value.tags, value.exampleSentence, value.exampleSentenceNl, value.exampleSentenceEn, busy, lastProcessed, onResult], 800)

  return busy ? <div className="text-xs text-muted-foreground">Vertalen...</div> : null
}
