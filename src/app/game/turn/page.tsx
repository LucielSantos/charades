"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CategoryGrid } from "@/components/game/category-grid"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"
import { ArrowLeft, Settings } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function GameTurnPage() {
  const t = useTranslations("turn")
  const tc = useTranslations("common")
  const router = useRouter()

  const getCurrentTeamId = useGameStore((s) => s.getCurrentTeamId)
  const selectedCategories = useGameStore((s) => s.settings.selectedCategories)
  const updateCategories = useGameStore((s) => s.updateCategories)
  const drawWord = useGameStore((s) => s.drawWord)
  const getTeamById = useTeamStore((s) => s.getTeamById)

  const [settingsOpen, setSettingsOpen] = useState(false)

  const teamId = getCurrentTeamId()
  const team = getTeamById(teamId)

  function handleStart() {
    drawWord()
    router.push("/game/play")
  }

  if (!team) {
    router.push("/")
    return null
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 relative"
      style={{
        background: `linear-gradient(135deg, ${team.color}33, ${team.color}66)`,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-4"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-4"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="h-5 w-5" />
      </Button>

      <div className="text-center space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
          {t("teamTurn")}
        </p>
        <div
          className="h-20 w-20 rounded-full mx-auto shadow-lg"
          style={{ backgroundColor: team.color }}
        />
        <h1 className="text-4xl font-extrabold text-gray-900">{team.name}</h1>
        <p className="text-gray-600">{t("passDevice")}</p>
      </div>

      <Button
        size="lg"
        className="mt-12 h-16 w-full text-xl font-bold bg-white text-gray-900 hover:bg-gray-50 shadow-lg"
        onClick={handleStart}
      >
        {t("start")}
      </Button>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("editCategories")}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <CategoryGrid
              selected={selectedCategories}
              onChange={updateCategories}
            />
          </div>
          <Button className="w-full mt-4" onClick={() => setSettingsOpen(false)}>
            {tc("confirm")}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
