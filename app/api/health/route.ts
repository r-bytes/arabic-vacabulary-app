import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(): Promise<Response> {
  try {
    const [rows] = await query<{ ok: number }>("SELECT 1 as ok")
    return NextResponse.json({
      ok: true,
      db: rows.length > 0 && rows[0].ok === 1,
      env: {
        host: !!process.env.DB_HOST,
        user: !!process.env.DB_USER,
        db: !!process.env.DB_NAME,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}