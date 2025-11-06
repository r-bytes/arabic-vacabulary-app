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
    const [users]: any = await query("SELECT id, email, name FROM users WHERE id = ?", [token])
    if (users.length > 0) {
      return {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
      }
    }
  }
  
  // Fallback to NextAuth session (web)
  const session = await auth()
  return session?.user
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

