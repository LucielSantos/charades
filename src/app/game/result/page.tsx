"use client"

import { ArrowRight, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Confetti } from "@/components/game/confetti"
import { Scoreboard } from "@/components/game/scoreboard"
import { Button } from "@/components/ui/button"
import type { PlayResult } from "@/data/types"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"

const resultConfig: Record<
	PlayResult,
	{
		gradient: string
		icon: React.ComponentType<{ className?: string }>
		labelKey: string
	}
> = {
	correct: {
		gradient: "from-green-400 to-emerald-500",
		icon: Check,
		labelKey: "result.correct",
	},
	wrong: {
		gradient: "from-red-400 to-rose-500",
		icon: X,
		labelKey: "result.wrong",
	},
	skipped: {
		gradient: "from-yellow-400 to-amber-500",
		icon: ArrowRight,
		labelKey: "result.skipped",
	},
}

export default function GameResultPage() {
	const t = useTranslations()
	const router = useRouter()

	const lastResult = useGameStore((s) => s.lastResult)
	const lastWord = useGameStore((s) => s.lastWord)
	const teamStats = useGameStore((s) => s.teamStats)
	const getCurrentTeamId = useGameStore((s) => s.getCurrentTeamId)
	const getTeamById = useTeamStore((s) => s.getTeamById)
	const teams = useTeamStore((s) => s.teams)

	const nextTeam = getTeamById(getCurrentTeamId())

	if (!lastResult || !lastWord) {
		router.push("/game/turn")
		return null
	}

	const config = resultConfig[lastResult]
	const Icon = config.icon

	const gameTeams = teams.filter((team) => teamStats[team.id])

	return (
		<div
			className={`flex flex-col items-center min-h-screen px-6 py-12 bg-gradient-to-br ${config.gradient}`}
		>
			{lastResult === "correct" && <Confetti />}

			<div className="animate-bounce-in mb-4">
				<div className="h-24 w-24 rounded-full bg-white/30 flex items-center justify-center">
					<Icon className="h-14 w-14 text-white" />
				</div>
			</div>

			<h1 className="text-3xl font-extrabold text-white mb-2">{t(config.labelKey)}</h1>
			<p className="text-xl text-white/80 font-semibold mb-8">{lastWord.text}</p>

			<div className="w-full bg-white/20 rounded-2xl p-4 backdrop-blur-sm mb-8">
				<h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3 text-center">
					{t("result.score")}
				</h2>
				<Scoreboard teams={gameTeams} stats={teamStats} compact />
			</div>

			<Button
				size="lg"
				className="w-full h-14 text-lg font-bold bg-white text-gray-900 hover:bg-gray-50 shadow-lg"
				onClick={() => router.push("/game/turn")}
			>
				{t("result.next", { team: nextTeam?.name ?? "" })}
			</Button>
		</div>
	)
}
