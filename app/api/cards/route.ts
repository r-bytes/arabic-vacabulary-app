import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(): Promise<Response> {
  const [rows] = await query(
    `SELECT id, ar, translit, nl, en, tags, folder_id as folderId, audio_url as audioUrl, tts_hint as ttsHint,
            srs_interval as srsInterval, srs_ease as srsEase, srs_due as srsDue
       FROM cards`
  )
  const cards = rows.map((r) => ({
    id: String(r.id),
    ar: r.ar,
    translit: r.translit || undefined,
    gloss: { nl: r.nl || undefined, en: r.en || undefined },
    tags: r.tags ? String(r.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
    folderId: String(r.folderId),
    audioUrl: r.audioUrl || undefined,
    ttsHint: r.ttsHint || undefined,
    srs: r.srsInterval != null ? { interval: r.srsInterval, ease: r.srsEase, due: r.srsDue } : undefined,
  }))
  return NextResponse.json(cards)
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json()
  if (!body?.ar || !body?.folderId) {
    return NextResponse.json({ error: "Missing ar/folderId" }, { status: 400 })
  }
  const tags = body.tags ? body.tags.join(",") : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result]: any = await query(
    `INSERT INTO cards (ar, translit, nl, en, tags, folder_id, audio_url, tts_hint)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [body.ar, body.translit || null, body.gloss?.nl || null, body.gloss?.en || null, tags, body.folderId, body.audioUrl || null, body.ttsHint || null]
  )
  const id = String(result.insertId)
  return NextResponse.json({ id, ...body })
}

export async function PUT(req: Request): Promise<Response> {
  const body = await req.json()
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const tags = body.tags ? body.tags.join(",") : null
  await query(
    `UPDATE cards SET ar=?, translit=?, nl=?, en=?, tags=?, folder_id=?, audio_url=?, tts_hint=?, srs_interval=?, srs_ease=?, srs_due=? WHERE id=?`,
    [body.ar, body.translit || null, body.gloss?.nl || null, body.gloss?.en || null, tags, body.folderId, body.audioUrl || null, body.ttsHint || null, body.srs?.interval || null, body.srs?.ease || null, body.srs?.due || null, body.id]
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request): Promise<Response> {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await query("DELETE FROM cards WHERE id=?", [id])
  return NextResponse.json({ ok: true })
}


