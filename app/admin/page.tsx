"use client"

import { AuthButton } from "@/components/auth-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Shield, Users, FolderTree, FileText, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

interface Folder {
  id: string
  name: string
  userId: string
  userEmail: string
  userName: string
  createdAt: string
}

interface Card {
  id: string
  ar: string
  folderId: string
  userId: string
  userEmail: string
  userName: string
}

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"users" | "folders" | "cards">("users")
  const [selectedUserForReassign, setSelectedUserForReassign] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session?.user) {
      checkAdminAndLoad()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router])

  async function checkAdminAndLoad() {
    try {
      // Check if user is admin by fetching their role
      const userRes = await fetch("/api/admin/users")
      if (userRes.status === 403) {
        router.push("/")
        toast.error("Geen toegang: Admin rechten vereist")
        return
      }
      if (!userRes.ok) throw new Error("Failed to check admin status")

      await loadData()
    } catch (error) {
      console.error("Admin check error:", error)
      toast.error("Fout bij laden van admin data")
    } finally {
      setLoading(false)
    }
  }

  async function loadData() {
    try {
      const [usersRes, dataRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/data"),
      ])

      if (!usersRes.ok || !dataRes.ok) throw new Error("Failed to load data")

      const [usersData, data] = await Promise.all([usersRes.json(), dataRes.json()])
      setUsers(usersData)
      setFolders(data.folders)
      setCards(data.cards)
    } catch (error) {
      console.error("Load error:", error)
      toast.error("Fout bij laden van data")
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update role")
      }

      toast.success("Rol bijgewerkt")
      await loadData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(errorMessage || "Fout bij bijwerken van rol")
    }
  }

  async function reassignItems(type: "folders" | "cards") {
    if (!selectedUserForReassign || selectedItems.length === 0) {
      toast.error("Selecteer eerst items en een gebruiker")
      return
    }

    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ids: selectedItems,
          userId: selectedUserForReassign,
        }),
      })

      if (!res.ok) throw new Error("Failed to reassign")

      toast.success(`${selectedItems.length} ${type === "folders" ? "map(pen)" : "kaart(en)"} toegewezen`)
      setSelectedItems([])
      setSelectedUserForReassign(null)
      await loadData()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(errorMessage || "Fout bij toewijzen")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">Laden...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-4 w-4" />
            Gebruikers ({users.length})
          </Button>
          <Button
            variant={activeTab === "folders" ? "default" : "outline"}
            onClick={() => setActiveTab("folders")}
          >
            <FolderTree className="mr-2 h-4 w-4" />
            Mappen ({folders.length})
          </Button>
          <Button
            variant={activeTab === "cards" ? "default" : "outline"}
            onClick={() => setActiveTab("cards")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Kaarten ({cards.length})
          </Button>
        </div>

        {activeTab === "users" && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Gebruikersbeheer</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Gemaakt op</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString("nl-NL")}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {activeTab === "folders" && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Mappen Toewijzen</h2>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedUserForReassign || ""}
                      onValueChange={setSelectedUserForReassign}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecteer gebruiker" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.email} ({user.name || "Geen naam"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => reassignItems("folders")}
                      disabled={!selectedUserForReassign}
                    >
                      Toewijzen ({selectedItems.length})
                    </Button>
                  </div>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === folders.length && folders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(folders.map((f) => f.id))
                          } else {
                            setSelectedItems([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead>Eigenaar</TableHead>
                    <TableHead>Gemaakt op</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folders.map((folder) => (
                    <TableRow key={folder.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(folder.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, folder.id])
                            } else {
                              setSelectedItems(selectedItems.filter((id) => id !== folder.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{folder.name}</TableCell>
                      <TableCell>
                        {folder.userEmail} ({folder.userName || "Geen naam"})
                      </TableCell>
                      <TableCell>
                        {new Date(folder.createdAt).toLocaleDateString("nl-NL")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === "cards" && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Kaarten Toewijzen</h2>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedUserForReassign || ""}
                      onValueChange={setSelectedUserForReassign}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecteer gebruiker" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.email} ({user.name || "Geen naam"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => reassignItems("cards")}
                      disabled={!selectedUserForReassign}
                    >
                      Toewijzen ({selectedItems.length})
                    </Button>
                  </div>
                )}
              </div>
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === cards.length && cards.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(cards.map((c) => c.id))
                            } else {
                              setSelectedItems([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Arabisch</TableHead>
                      <TableHead>Eigenaar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(card.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, card.id])
                              } else {
                                setSelectedItems(selectedItems.filter((id) => id !== card.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{card.ar}</TableCell>
                        <TableCell>
                          {card.userEmail} ({card.userName || "Geen naam"})
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

