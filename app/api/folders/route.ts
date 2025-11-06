import { query } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"

export async function GET(): Promise<Response> {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user // Error response

  const [rows] = await query(
    "SELECT id, name, created_at as createdAt FROM folders WHERE user_id = ? ORDER BY created_at ASC",
    [user.id]
  )
  // Convert id to string to match cards API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const folders = rows.map((row: any) => ({
    ...row,
    id: String(row.id)
  }))
  return NextResponse.json(folders)
}

export async function POST(req: Request): Promise<Response> {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user // Error response

  try {
    const { name } = await req.json()
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    }
    const createdAt = new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result]: any = await query(
      "INSERT INTO folders (name, user_id, created_at) VALUES (?, ?, ?)",
      [name, user.id, createdAt]
    )
    const id = String(result.insertId)
    return NextResponse.json({ id, name, createdAt: createdAt.toISOString() })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: Request): Promise<Response> {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user // Error response

  const { id, name } = await req.json()
  if (!id || !name) return NextResponse.json({ error: "Missing id/name" }, { status: 400 })
  
  // Verify folder belongs to user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [folders]: any = await query("SELECT id FROM folders WHERE id = ? AND user_id = ?", [id, user.id])
  if (folders.length === 0) {
    return NextResponse.json({ error: "Folder not found or unauthorized" }, { status: 404 })
  }
  
  await query("UPDATE folders SET name=? WHERE id=? AND user_id=?", [name, id, user.id])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request): Promise<Response> {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user // Error response

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  
  // Verify folder belongs to user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [folders]: any = await query("SELECT id FROM folders WHERE id = ? AND user_id = ?", [id, user.id])
  if (folders.length === 0) {
    return NextResponse.json({ error: "Folder not found or unauthorized" }, { status: 404 })
  }
  
  await query("DELETE FROM folders WHERE id=? AND user_id=?", [id, user.id])
  return NextResponse.json({ ok: true })
}


