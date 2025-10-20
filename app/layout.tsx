import { SeedInitializer } from "@/lib/seed-initializer"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import type React from "react"
import "./globals.css"

// const _geist = Geist({ subsets: ["latin"] })
// const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Arabic Vocabulary App",
  description: "Learn Arabic vocabulary with flashcards, quizzes, and games",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <SeedInitializer />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
