import { requireAdmin } from "@/lib/auth-helpers"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"

// Get all folders and cards (admin view)
export async function GET(): Promise<Response> {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const [folders] = await query(
      `SELECT f.id, f.name, f.created_at as createdAt, f.user_id as userId,
              u.email as userEmail, u.name as userName
       FROM folders f
       LEFT JOIN users u ON f.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
       ORDER BY f.created_at DESC`
    )

    const [cards] = await query(
      `SELECT c.id, c.ar, c.translit, c.nl, c.en, c.tags, c.folder_id as folderId,
              c.audio_url as audioUrl, c.tts_hint as ttsHint,
              c.srs_interval as srsInterval, c.srs_ease as srsEase, c.srs_due as srsDue,
              c.user_id as userId,
              u.email as userEmail, u.name as userName
       FROM cards c
       LEFT JOIN users u ON c.user_id COLLATE utf8mb4_unicode_ci = u.id COLLATE utf8mb4_unicode_ci
       ORDER BY c.id DESC`
    )

    return NextResponse.json({
      folders: folders.map((f: any) => ({
        ...f,
        id: String(f.id),
        folderId: f.folderId ? String(f.folderId) : null,
      })),
      cards: cards.map((c: any) => ({
        id: String(c.id),
        ar: c.ar,
        translit: c.translit || undefined,
        gloss: { nl: c.nl || undefined, en: c.en || undefined },
        tags: c.tags ? String(c.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
        folderId: String(c.folderId),
        audioUrl: c.audioUrl || undefined,
        ttsHint: c.ttsHint || undefined,
        srs: c.srsInterval != null ? { interval: c.srsInterval, ease: c.srsEase, due: c.srsDue } : undefined,
        userId: c.userId,
        userEmail: c.userEmail,
        userName: c.userName,
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Reassign folders/cards to users
export async function POST(req: Request): Promise<Response> {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const { type, ids, userId } = await req.json()

    if (!type || !ids || !Array.isArray(ids) || !userId) {
      return NextResponse.json({ error: "Missing type, ids, or userId" }, { status: 400 })
    }

    // Verify user exists
    const [users]: any = await query("SELECT id FROM users WHERE id = ?", [userId])
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (type === 'folders') {
      await query(
        `UPDATE folders SET user_id = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
        [userId, ...ids]
      )
    } else if (type === 'cards') {
      await query(
        `UPDATE cards SET user_id = ? WHERE id IN (${ids.map(() => '?').join(',')})`,
        [userId, ...ids]
      )
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

