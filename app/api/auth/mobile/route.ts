import { NextResponse } from "next/server"
import { query } from "@/lib/db"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs")

// Simple mobile auth endpoint that returns a user ID token
// For production, use JWT tokens instead
export async function POST(req: Request): Promise<Response> {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email/password" }, { status: 400 })
    }

    // Check if user exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users]: any = await query(
      "SELECT id, email, name, password FROM users WHERE email = ?",
      [email]
    )

    if (users.length === 0) {
      // Create new user if doesn't exist (auto-registration)
      const hashedPassword = await bcrypt.hash(password, 10)
      const userId = crypto.randomUUID()
      
      await query(
        "INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)",
        [userId, email, email.split("@")[0], hashedPassword]
      )

      return NextResponse.json({ 
        success: true, 
        token: userId, // In production, use JWT
        user: { id: userId, email, name: email.split("@")[0] }
      })
    }

    const user = users[0]
    
    // Check password
    if (user.password && await bcrypt.compare(password, user.password)) {
      return NextResponse.json({ 
        success: true, 
        token: user.id, // In production, use JWT
        user: { id: user.id, email: user.email, name: user.name }
      })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Mobile auth error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

