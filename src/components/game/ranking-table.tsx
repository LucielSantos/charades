"use client"

import { Crown } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Team, TeamStats } from "@/data/types"

function getAccuracy(stats: TeamStats): number {
	const total = stats.correct + stats.wrong + stats.skipped
	if (total === 0) return 0
	return Math.round((stats.correct / total) * 100)
}

interface RankingTableProps {
	teams: Team[]
	stats: Record<string, TeamStats>
}

export function RankingTable({ teams, stats }: RankingTableProps) {
	const t = useTranslations("ranking")

	const sorted = [...teams]
		.filter((team) => stats[team.id])
		.sort((a, b) => (stats[b.id]?.correct ?? 0) - (stats[a.id]?.correct ?? 0))

	return (
		<div>
			<div className="grid grid-cols-[32px_1fr_48px_48px_48px_48px] gap-2 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
				<span>{t("position")}</span>
				<span>{t("team")}</span>
				<span className="text-center">{t("points")}</span>
				<span className="text-center">{t("wrong")}</span>
				<span className="text-center">{t("skipped")}</span>
				<span className="text-center">{t("accuracy")}</span>
			</div>
			<div className="space-y-2">
				{sorted.map((team, index) => {
					const s = stats[team.id]
					if (!s) return null
					const isFirst = index === 0 && s.correct > 0

					return (
						<div
							key={team.id}
							className={`grid grid-cols-[32px_1fr_48px_48px_48px_48px] gap-2 items-center rounded-xl p-3 ${
								isFirst
									? "bg-gradient-to-r from-yellow-50 to-amber-50 ring-2 ring-yellow-300"
									: "bg-white shadow-sm"
							}`}
						>
							<span className="text-center font-bold text-gray-400 flex items-center justify-center">
								{isFirst ? <Crown className="h-5 w-5 text-yellow-500" /> : index + 1}
							</span>
							<div className="flex items-center gap-2 min-w-0">
								<div
									className="h-4 w-4 rounded-full shrink-0"
									style={{ backgroundColor: team.color }}
								/>
								<span className="font-semibold text-gray-800 truncate">{team.name}</span>
							</div>
							<span className="text-center font-bold text-indigo-600">{s.correct}</span>
							<span className="text-center text-sm text-red-500">{s.wrong}</span>
							<span className="text-center text-sm text-yellow-600">{s.skipped}</span>
							<span className="text-center text-sm text-gray-600">{getAccuracy(s)}%</span>
						</div>
					)
				})}
			</div>
		</div>
	)
}
