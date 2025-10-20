import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(): Promise<Response> {
  try {
    const [rows] = await query("SELECT 1 as ok")
    return NextResponse.json({
      ok: true,
      db: rows && (rows as any[])[0]?.ok === 1,
      env: {
        host: !!process.env.DB_HOST,
        user: !!process.env.DB_USER,
        db: !!process.env.DB_NAME,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}