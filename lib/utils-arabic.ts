export function normalizeArabic(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670]/g, "") // Remove diacritics
    .replace(/[^\w\s\u0600-\u06FF]/g, "") // Keep only Arabic letters and alphanumeric
    .toLowerCase()
    .trim()
}

export function compareArabic(a: string, b: string): boolean {
  return normalizeArabic(a) === normalizeArabic(b)
}
