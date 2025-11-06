import { auth } from "./auth"
import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function getCurrentUser() {
  // Check for mobile auth token (Bearer token)
  const headersList = await headers()
  const authHeader = headersList.get("authorization")
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    // For mobile: token is the user ID (in production, verify JWT)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { query } = require("./db")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users]: any = await query("SELECT id, email, name, role FROM users WHERE id = ?", [token])
    if (users.length > 0) {
      return {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        role: users[0].role || 'user',
      }
    }
  }
  
  // Fallback to NextAuth session (web)
  const session = await auth()
  if (session?.user) {
    // Fetch role from database
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { query } = require("./db")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users]: any = await query("SELECT role FROM users WHERE id = ?", [session.user.id])
    return {
      ...session.user,
      role: users.length > 0 ? (users[0].role || 'user') : 'user',
    }
  }
  return null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user || !user.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user // Error response
  
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 }
    )
  }
  return user
}

