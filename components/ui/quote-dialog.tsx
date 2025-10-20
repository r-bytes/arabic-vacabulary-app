"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent, SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useState } from "react"
import { z } from "zod"

const QuoteSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  incoterm: z.enum(["FOB","CIF","EXW"]),
  currency: z.enum(["USD","EUR"])
})

type QuoteDialogProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  productId?: string
  onQuoteReady?: (summary: string) => void
}

export function QuoteDialog({ open, onOpenChange, productId, onQuoteReady }: QuoteDialogProps) {
  const [quantity, setQuantity] = useState<number>(100)
  const [incoterm, setIncoterm] = useState<"FOB"|"CIF"|"EXW">("FOB")
  const [currency, setCurrency] = useState<"USD"|"EUR">("USD")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    const parsed = QuoteSchema.safeParse({
      productId: productId ?? "",
      quantity,
      incoterm,
      currency
    })
    if (!parsed.success) {
      setError("Controleer de velden.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        body: JSON.stringify(parsed.data)
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || "Quote mislukt")

      const q = json.quote as {
        productId: string; quantity: number; incoterm: string; currency: string;
        unitPrice: number; total: number; note: string; validUntil: string
      }

      const summary =
        `Offerte (indicatief)
Product: ${q.productId}
Aantal: ${q.quantity}
Incoterm: ${q.incoterm}
Prijs p/st: ${q.unitPrice} ${q.currency}
Totaal: ${q.total} ${q.currency}
Geldig t/m: ${new Date(q.validUntil).toLocaleDateString()}
Opmerking: ${q.note}`

      onQuoteReady?.(summary)
      onOpenChange(false)
    } catch (e: unknown) {
      const error = e as Error
      setError(error.message || "Er ging iets mis")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Offerte aanvragen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Product ID</Label>
            <Input value={productId ?? ""} disabled />
          </div>

          <div>
            <Label>Aantal</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Incoterm</Label>
              <Select value={incoterm} onValueChange={(v) => setIncoterm(v as "FOB"|"CIF"|"EXW")}>
                <SelectTrigger><SelectValue placeholder="Incoterm" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB">FOB</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valuta</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "USD"|"EUR")}>
                <SelectTrigger><SelectValue placeholder="Valuta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Verzenden..." : "Offerte opvragen"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}