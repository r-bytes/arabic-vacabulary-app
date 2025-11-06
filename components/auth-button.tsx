"use client"

import { Button } from "@/components/ui/button"
import { useSession, signIn, signOut } from "next-auth/react"
import { LogIn, LogOut, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-4 w-4" />
      </Button>
    )
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{session.user.name || "Gebruiker"}</p>
              <p className="text-xs text-muted-foreground">{session.user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Uitloggen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button variant="ghost" size="icon" onClick={() => signIn()}>
      <LogIn className="h-4 w-4" />
    </Button>
  )
}

