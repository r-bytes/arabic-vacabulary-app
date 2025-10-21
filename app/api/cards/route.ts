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
  try {
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
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: Request): Promise<Response> {
  const body = await req.json()
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  
  // Only update fields that are provided (partial updates)
  const updates: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any[] = []
  
  if (body.ar !== undefined) {
    updates.push('ar=?')
    values.push(body.ar)
  }
  if (body.translit !== undefined) {
    updates.push('translit=?')
    values.push(body.translit || null)
  }
  if (body.gloss !== undefined) {
    if (body.gloss.nl !== undefined) {
      updates.push('nl=?')
      values.push(body.gloss.nl || null)
    }
    if (body.gloss.en !== undefined) {
      updates.push('en=?')
      values.push(body.gloss.en || null)
    }
  }
  if (body.tags !== undefined) {
    updates.push('tags=?')
    values.push(body.tags ? body.tags.join(",") : null)
  }
  if (body.folderId !== undefined) {
    updates.push('folder_id=?')
    values.push(body.folderId)
  }
  if (body.audioUrl !== undefined) {
    updates.push('audio_url=?')
    values.push(body.audioUrl || null)
  }
  if (body.ttsHint !== undefined) {
    updates.push('tts_hint=?')
    values.push(body.ttsHint || null)
  }
  if (body.srs !== undefined) {
    updates.push('srs_interval=?', 'srs_ease=?', 'srs_due=?')
    values.push(body.srs.interval || null, body.srs.ease || null, body.srs.due || null)
  }
  
  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }
  
  values.push(body.id)
  await query(`UPDATE cards SET ${updates.join(', ')} WHERE id=?`, values)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request): Promise<Response> {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await query("DELETE FROM cards WHERE id=?", [id])
  return NextResponse.json({ ok: true })
}


