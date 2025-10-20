"use client"

import { useEffect } from "react"
import { dataAdapter } from "./data-adapter"
import { useVocabStore } from "./store"
import seedData from "../seed/seed.json"

export function SeedInitializer() {
  const loadData = useVocabStore((state) => state.loadData)

  useEffect(() => {
    dataAdapter.initializeSeed(seedData)
    loadData()
  }, [loadData])

  return null
}
