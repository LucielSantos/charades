"use client"

import { Button } from "@/components/ui/button"
import type { Team } from "@/data/types"
import { Pencil, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface TeamListProps {
  teams: Team[]
  onEdit: (team: Team) => void
  onDelete: (id: string) => void
}

export function TeamList({ teams, onEdit, onDelete }: TeamListProps) {
  const t = useTranslations("teams")

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">{t("noTeams")}</p>
        <p className="text-sm mt-1">{t("minTeams")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
        >
          <div
            className="h-5 w-5 rounded-full shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <span className="flex-1 font-semibold text-gray-800 truncate">
            {team.name}
          </span>
          <Button variant="ghost" size="icon" onClick={() => onEdit(team)}>
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(team.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  )
}
