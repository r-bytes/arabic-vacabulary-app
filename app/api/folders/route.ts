import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(): Promise<Response> {
  const [rows] = await query(
    "SELECT id, name, created_at as createdAt FROM folders ORDER BY created_at ASC"
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
  try {
    const { name } = await req.json()
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    }
    const createdAt = new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result]: any = await query(
      "INSERT INTO folders (name, created_at) VALUES (?, ?)",
      [name, createdAt]
    )
    const id = String(result.insertId)
    return NextResponse.json({ id, name, createdAt: createdAt.toISOString() })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: Request): Promise<Response> {
  const { id, name } = await req.json()
  if (!id || !name) return NextResponse.json({ error: "Missing id/name" }, { status: 400 })
  await query("UPDATE folders SET name=? WHERE id=?", [name, id])
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request): Promise<Response> {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await query("DELETE FROM folders WHERE id=?", [id])
  return NextResponse.json({ ok: true })
}


