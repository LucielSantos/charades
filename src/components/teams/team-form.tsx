"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Team } from "@/data/types"
import { teamColors } from "@/data/colors"
import { useTeamStore } from "@/stores/team-store"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { ColorPicker } from "./color-picker"

interface TeamFormProps {
  open: boolean
  onClose: () => void
  team?: Team | null
}

export function TeamForm({ open, onClose, team }: TeamFormProps) {
  const t = useTranslations("teams")
  const { addTeam, updateTeam, getUsedColors } = useTeamStore()
  const [name, setName] = useState("")
  const [color, setColor] = useState(teamColors[0].hex)

  const usedColors = getUsedColors()

  useEffect(() => {
    if (team) {
      setName(team.name)
      setColor(team.color)
    } else {
      setName("")
      const firstAvailable = teamColors.find((c) => !usedColors.includes(c.hex))
      setColor(firstAvailable?.hex ?? teamColors[0].hex)
    }
  }, [team, open, usedColors])

  function handleSave() {
    if (!name.trim()) return
    if (team) {
      updateTeam(team.id, name.trim(), color)
    } else {
      addTeam(name.trim(), color)
    }
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{team ? t("editTeam") : t("addTeam")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t("teamName")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("teamNamePlaceholder")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              maxLength={20}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t("color")}</label>
            <div className="mt-2">
              <ColorPicker selected={color} usedColors={usedColors} onChange={setColor} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={!name.trim()}>
              {t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
