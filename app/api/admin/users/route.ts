import { query } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"

// Get all users
export async function GET(): Promise<Response> {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users]: any = await query(
      "SELECT id, email, name, role, created_at as createdAt FROM users ORDER BY created_at DESC"
    )
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// Update user role
export async function PUT(req: Request): Promise<Response> {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  try {
    const { userId, role } = await req.json()
    
    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 })
    }

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Prevent removing last admin
    if (role === 'user') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [admins]: any = await query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      if (admins[0].count <= 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [checkUser]: any = await query("SELECT role FROM users WHERE id = ?", [userId])
        if (checkUser[0]?.role === 'admin') {
          return NextResponse.json(
            { error: "Cannot remove last admin" },
            { status: 400 }
          )
        }
      }
    }

    await query("UPDATE users SET role = ? WHERE id = ?", [role, userId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

