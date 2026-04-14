"use client"

import type { CategoryId, Difficulty } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface WordDisplayProps {
  word: string
  category: CategoryId
  difficulty: Difficulty
}

const difficultyColors: Record<Difficulty, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
}

export function WordDisplay({ word, category, difficulty }: WordDisplayProps) {
  const t = useTranslations()
  const [hidden, setHidden] = useState(false)

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {t(`categories.${category}`)}
        </Badge>
        <Badge variant="secondary" className={`text-xs ${difficultyColors[difficulty]}`}>
          {t(`setup.${difficulty}`)}
        </Badge>
      </div>

      <div className="relative">
        <h1 className="text-4xl font-extrabold text-gray-900 min-h-[48px]">
          {hidden ? "* * * * *" : word}
        </h1>
        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {hidden ? (
            <>
              <Eye className="h-4 w-4" />
              {t("play.showWord")}
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              {t("play.hideWord")}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
