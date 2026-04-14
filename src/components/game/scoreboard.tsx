"use client"

import { useTranslations } from "next-intl"
import type { Team, TeamStats } from "@/data/types"

interface ScoreboardProps {
	teams: Team[]
	stats: Record<string, TeamStats>
	highlightTeamId?: string
	compact?: boolean
}

export function Scoreboard({ teams, stats, highlightTeamId, compact }: ScoreboardProps) {
	const _t = useTranslations("ranking")

	const sorted = [...teams]
		.filter((team) => stats[team.id])
		.sort((a, b) => (stats[b.id]?.correct ?? 0) - (stats[a.id]?.correct ?? 0))

	return (
		<div className="space-y-2">
			{sorted.map((team, index) => {
				const s = stats[team.id]
				if (!s) return null
				const isHighlight = team.id === highlightTeamId
				return (
					<div
						key={team.id}
						className={`flex items-center gap-3 rounded-xl p-3 ${
							isHighlight ? "bg-white/80 ring-2 ring-indigo-300" : "bg-white/50"
						}`}
					>
						<span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>
						<div
							className="h-4 w-4 rounded-full shrink-0"
							style={{ backgroundColor: team.color }}
						/>
						<span className="font-semibold text-gray-800 flex-1 truncate">{team.name}</span>
						<span className="text-lg font-bold text-indigo-600">{s.correct}</span>
						{!compact && (
							<div className="flex gap-2 text-xs text-gray-500">
								<span>{s.wrong}E</span>
								<span>{s.skipped}P</span>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}
