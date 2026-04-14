"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TeamForm } from "@/components/teams/team-form"
import { TeamList } from "@/components/teams/team-list"
import type { Team } from "@/data/types"
import { useTeamStore } from "@/stores/team-store"
import { ArrowLeft, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function TeamsPage() {
  const t = useTranslations("teams")
  const tc = useTranslations("common")
  const router = useRouter()
  const { teams, removeTeam } = useTeamStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleEdit(team: Team) {
    setEditingTeam(team)
    setFormOpen(true)
  }

  function handleAdd() {
    setEditingTeam(null)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingTeam(null)
  }

  function confirmDelete() {
    if (deleteId) {
      removeTeam(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <div className="flex-1" />
        <Button
          size="icon"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleAdd}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <TeamList teams={teams} onEdit={handleEdit} onDelete={setDeleteId} />

      <TeamForm open={formOpen} onClose={handleCloseForm} team={editingTeam} />

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
