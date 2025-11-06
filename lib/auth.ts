import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { query } from "./db"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs")

export const authOptions: NextAuthConfig = {
  providers: [
    // Email/Password provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check if user exists
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [users]: any = await query(
            "SELECT id, email, name, password FROM users WHERE email = ?",
            [credentials.email]
          )

          if (users.length === 0) {
            // Create new user if doesn't exist (for simplicity, allow auto-registration)
            // In production, you might want separate registration endpoint
            const hashedPassword = await bcrypt.hash(credentials.password, 10)
            const userId = crypto.randomUUID()
            
            await query(
              "INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)",
              [userId, credentials.email, (credentials.email as string).split("@")[0], hashedPassword]
            )

            return {
              id: userId,
              email: credentials.email,
              name: (credentials.email as string).split("@")[0],
            }
          }

          const user = users[0]
          
          // Check password
          if (user.password && await bcrypt.compare(credentials.password, user.password)) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }

          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    }),
    // Google OAuth provider (optional)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [users]: any = await query(
            "SELECT id FROM users WHERE email = ?",
            [user.email]
          )

          if (users.length === 0) {
            // Create new user
            await query(
              "INSERT INTO users (id, email, name, image, emailVerified) VALUES (?, ?, ?, ?, ?)",
              [user.id, user.email, user.name || user.email?.split("@")[0] || "User", user.image, new Date()]
            )
          }

          // Link account
          await query(
            `INSERT INTO accounts (id, user_id, type, provider, provider_account_id, access_token, expires_at, token_type, scope)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), expires_at = VALUES(expires_at)`,
            [
              crypto.randomUUID(),
              user.id,
              account.type,
              account.provider,
              account.providerAccountId,
              account.access_token,
              account.expires_at,
              account.token_type,
              account.scope ? (account.scope as string).split(" ") : undefined
            ]
          )
        } catch (error: unknown) {
          console.error("OAuth sign in error:", error instanceof Error ? error.message : error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

