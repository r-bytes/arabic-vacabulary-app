"use client"

import type React from "react"

import { AudioRecorder } from "@/components/audio-recorder"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { recognizeTextFromFile } from "@/lib/ocr"
import { useVocabStore } from "@/lib/store"
import type { Card } from "@/lib/types"
import { Camera, RotateCcw } from "lucide-react"
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
  })
  const [ocrLang, setOcrLang] = useState<"auto" | "ara" | "nld" | "eng">("auto")
  const [ocrBusy, setOcrBusy] = useState(false)
  const [lastOcrFile, setLastOcrFile] = useState<File | null>(null)
  const [useCloudOCR, setUseCloudOCR] = useState(true)
  const [autoTranslate, setAutoTranslate] = useState(true)

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
      })
    }
  }, [card, defaultFolderId, folders, open])

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
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0 w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle>{card ? "Kaart bewerken" : "Nieuwe kaart"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Content Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Inhoud</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ar" className="font-semibold text-foreground">Arabisch *</Label>
                <Textarea
                  id="ar"
                  dir="rtl"
                  value={formData.ar}
                  onChange={(e) => setFormData({ ...formData, ar: e.target.value })}
                  placeholder="كِتاب"
                  required
                  className="min-h-[80px] text-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="translit" className="font-semibold text-foreground">Transliteratie</Label>
                <Input
                  id="translit"
                  value={formData.translit}
                  readOnly
                  placeholder="kitāb"
                  className="bg-muted/50 border-muted-foreground/20"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nl" className="font-semibold text-foreground">Nederlands</Label>
                <Input
                  id="nl"
                  value={formData.nl}
                  onChange={(e) => setFormData({ ...formData, nl: e.target.value })}
                  placeholder="boek"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="en" className="font-semibold text-foreground">Engels</Label>
                <Input
                  id="en"
                  value={formData.en}
                  onChange={(e) => setFormData({ ...formData, en: e.target.value })}
                  placeholder="book"
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
                tags: formData.tags
              }}
              onResult={(partial) => setFormData((prev) => ({ ...prev, ...partial }))}
            />
          )}

          {/* Metadata Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Metadata</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="folder" className="font-semibold text-foreground">Map *</Label>
                <Select
                  value={formData.folderId}
                  onValueChange={(value) => setFormData({ ...formData, folderId: value })}
                >
                  <SelectTrigger id="folder">
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
                <Label htmlFor="tags" className="font-semibold text-foreground">Tags (komma gescheiden)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  readOnly
                  placeholder="noun, place"
                  className="bg-muted/50 border-muted-foreground/20"
                />
              </div>
            </div>
          </div>

          <AudioRecorder
            audioUrl={formData.audioUrl}
            onAudioChange={(url) => setFormData({ ...formData, audioUrl: url || "" })}
          />

          {/* OCR Section */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Tekst uit foto (OCR)</h3>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setLastOcrFile(file)
                  setOcrBusy(true)
                  try {
                    if (useCloudOCR) {
                      const form = new FormData()
                      form.append("file", file)
                      form.append("lang", ocrLang === "auto" ? "auto" : ocrLang)
                      const res = await fetch("/api/ocr", { method: "POST", body: form })
                      const data = await res.json()
                      const text = (data?.text || "").trim()
                      const looksArabic = /[\u0600-\u06FF]/.test(text)
                      if (looksArabic) setFormData((p) => ({ ...p, ar: text }))
                      else if (ocrLang === "nld") setFormData((p) => ({ ...p, nl: text }))
                      else if (ocrLang === "eng") setFormData((p) => ({ ...p, en: text }))
                      else setFormData((p) => ({ ...p, nl: text }))
                    } else if (ocrLang === "auto") {
                      const ara = await recognizeTextFromFile(file, "ara").catch(() => ({ text: "", confidence: 0 }))
                      const nld = await recognizeTextFromFile(file, "nld").catch(() => ({ text: "", confidence: 0 }))
                      const eng = await recognizeTextFromFile(file, "eng").catch(() => ({ text: "", confidence: 0 }))
                      const candidates = [ara, nld, eng].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                      const best = candidates[0]
                      const text = (best?.text || "").trim()
                      const looksArabic = /[\u0600-\u06FF]/.test(text)
                      if (looksArabic) {
                        setFormData((prev) => ({ ...prev, ar: text }))
                      } else if (best === nld) {
                        setFormData((prev) => ({ ...prev, nl: text }))
                      } else if (best === eng) {
                        setFormData((prev) => ({ ...prev, en: text }))
                      } else {
                        if (text.length <= 32) {
                          setFormData((prev) => ({ ...prev, nl: text }))
                        } else {
                          setFormData((prev) => ({ ...prev, en: text }))
                        }
                      }
                    } else {
                      const res = await recognizeTextFromFile(file, ocrLang).catch(() => ({ text: "", confidence: 0 }))
                      const text = (res.text || "").trim()
                      if (ocrLang === "ara") {
                        setFormData((prev) => ({ ...prev, ar: text }))
                      } else if (ocrLang === "nld") {
                        setFormData((prev) => ({ ...prev, nl: text }))
                      } else {
                        setFormData((prev) => ({ ...prev, en: text }))
                      }
                    }
                  } finally {
                    setOcrBusy(false)
                  }
                }}
              />
              <Button type="button" variant="outline" className="justify-center" disabled={ocrBusy} onClick={async () => {
                if (!lastOcrFile) return
                const file = lastOcrFile
                const looksArabic = (t: string) => /[\u0600-\u06FF]/.test(t)
                setOcrBusy(true)
                try {
                  if (useCloudOCR) {
                    const form = new FormData()
                    form.append("file", file)
                    form.append("lang", ocrLang === "auto" ? "auto" : ocrLang)
                    const res = await fetch("/api/ocr", { method: "POST", body: form })
                    const data = await res.json()
                    const text = (data?.text || "").trim()
                    if (looksArabic(text)) setFormData((p) => ({ ...p, ar: text }))
                    else if (ocrLang === "nld") setFormData((p) => ({ ...p, nl: text }))
                    else if (ocrLang === "eng") setFormData((p) => ({ ...p, en: text }))
                    else setFormData((p) => ({ ...p, nl: text }))
                  } else if (ocrLang === "auto") {
                    const ara = await recognizeTextFromFile(file, "ara").catch(() => ({ text: "", confidence: 0 }))
                    const nld = await recognizeTextFromFile(file, "nld").catch(() => ({ text: "", confidence: 0 }))
                    const eng = await recognizeTextFromFile(file, "eng").catch(() => ({ text: "", confidence: 0 }))
                    const candidates = [ara, nld, eng].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                    const best = candidates[0]
                    const text = (best?.text || "").trim()
                    if (looksArabic(text)) setFormData((p) => ({ ...p, ar: text }))
                    else if (best === nld) setFormData((p) => ({ ...p, nl: text }))
                    else if (best === eng) setFormData((p) => ({ ...p, en: text }))
                    else setFormData((p) => ({ ...p, nl: text }))
                  } else {
                    const res = await recognizeTextFromFile(file, ocrLang).catch(() => ({ text: "", confidence: 0 }))
                    const text = (res.text || "").trim()
                    if (ocrLang === "ara") setFormData((p) => ({ ...p, ar: text }))
                    else if (ocrLang === "nld") setFormData((p) => ({ ...p, nl: text }))
                    else setFormData((p) => ({ ...p, en: text }))
                  }
                } finally {
                  setOcrBusy(false)
                }
              }}>
                <Camera className="mr-2 h-4 w-4" />
                {ocrBusy ? "Bezig..." : "Opnieuw scannen"}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground">Taal</Label>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Select value={ocrLang} onValueChange={(v) => setOcrLang(v as any)}>
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (ara/nld/eng)</SelectItem>
                    <SelectItem value="ara">Arabisch (ara)</SelectItem>
                    <SelectItem value="nld">Nederlands (nld)</SelectItem>
                    <SelectItem value="eng">Engels (eng)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground" htmlFor="cloud-ocr">Cloud OCR</Label>
                <input id="cloud-ocr" type="checkbox" className="h-4 w-4" checked={useCloudOCR} onChange={(e) => setUseCloudOCR(e.target.checked)} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-foreground" htmlFor="auto-tr">Auto vertalen</Label>
                <input id="auto-tr" type="checkbox" className="h-4 w-4" checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">Tip: goede belichting, hoge scherpte en vlakke tekst verbeteren herkenning.</p>
          </div>

          {/* Preview Section */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Preview</h3>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-4 text-center shadow-sm">
                <div dir="rtl" className="text-3xl font-semibold text-foreground">
                  {formData.ar || "..."}
                </div>
                {formData.translit && <div className="mt-2 text-sm font-medium text-muted-foreground">{formData.translit}</div>}
              </div>
              <div className="flex gap-2 text-sm">
                {formData.nl && (
                  <div className="flex-1 rounded-lg border border-border bg-background p-3 shadow-sm">
                    <span className="font-semibold text-foreground">NL:</span> <span className="text-foreground">{formData.nl}</span>
                  </div>
                )}
                {formData.en && (
                  <div className="flex-1 rounded-lg border border-border bg-background p-3 shadow-sm">
                    <span className="font-semibold text-foreground">EN:</span> <span className="text-foreground">{formData.en}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex justify-center sm:justify-start">
              <Button type="button" variant="destructive" onClick={clearAllFields} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-4 w-4" />
                Wissen
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                Annuleren
              </Button>
              <Button type="submit" disabled={!formData.ar || !formData.folderId} className="flex-1 sm:flex-none">
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
  value: { ar: string; nl: string; en: string; translit: string; tags: string }
  onResult: (partial: Partial<{ ar: string; nl: string; en: string; translit: string; tags: string }>) => void
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
        
      } catch (e) {
        console.error("Auto-translate error:", e)
      } finally {
        setBusy(false)
      }
    }
    run()
  }, [value.ar, value.nl, value.en, value.translit, value.tags, busy, lastProcessed, onResult], 800)

  return busy ? <div className="text-xs text-muted-foreground">Vertalen...</div> : null
}
