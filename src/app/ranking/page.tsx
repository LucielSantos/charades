"use client"

import { ArrowLeft, Crown, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import type { TeamStats } from "@/data/types"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"

function getAccuracy(stats: TeamStats): number {
	const total = stats.correct + stats.wrong + stats.skipped
	if (total === 0) return 0
	return Math.round((stats.correct / total) * 100)
}

export default function RankingPage() {
	const t = useTranslations("ranking")
	const tc = useTranslations("common")
	const router = useRouter()

	const teamStats = useGameStore((s) => s.teamStats)
	const status = useGameStore((s) => s.status)
	const resetGame = useGameStore((s) => s.resetGame)
	const teams = useTeamStore((s) => s.teams)

	const [showEndConfirm, setShowEndConfirm] = useState(false)

	if (status === "idle") {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen px-6">
				<p className="text-gray-500 text-lg">{t("noGame")}</p>
				<Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
					{tc("back")}
				</Button>
			</div>
		)
	}

	const gameTeams = teams
		.filter((team) => teamStats[team.id])
		.sort((a, b) => (teamStats[b.id]?.correct ?? 0) - (teamStats[a.id]?.correct ?? 0))

	function handleEndGame() {
		resetGame()
		setShowEndConfirm(false)
		router.push("/")
	}

	return (
		<div className="flex flex-col min-h-screen px-6 py-8">
			<div className="flex items-center gap-3 mb-6">
				<Button variant="ghost" size="icon" onClick={() => router.push("/")}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
			</div>

			{/* Header row */}
			<div className="grid grid-cols-[32px_1fr_48px_48px_48px_48px] gap-2 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
				<span>{t("position")}</span>
				<span>{t("team")}</span>
				<span className="text-center">{t("points")}</span>
				<span className="text-center">{t("wrong")}</span>
				<span className="text-center">{t("skipped")}</span>
				<span className="text-center">{t("accuracy")}</span>
			</div>

			{/* Team rows */}
			<div className="space-y-2">
				{gameTeams.map((team, index) => {
					const stats = teamStats[team.id]
					if (!stats) return null
					const isFirst = index === 0 && stats.correct > 0

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
							<span className="text-center font-bold text-indigo-600">{stats.correct}</span>
							<span className="text-center text-sm text-red-500">{stats.wrong}</span>
							<span className="text-center text-sm text-yellow-600">{stats.skipped}</span>
							<span className="text-center text-sm text-gray-600">{getAccuracy(stats)}%</span>
						</div>
					)
				})}
			</div>

			<div className="mt-auto pt-8">
				<Button
					variant="outline"
					className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50"
					onClick={() => setShowEndConfirm(true)}
				>
					<XCircle className="mr-2 h-5 w-5" />
					{t("endGame")}
				</Button>
			</div>

			<Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("endGame")}</DialogTitle>
						<DialogDescription>{t("endGameConfirm")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowEndConfirm(false)}>
							{tc("cancel")}
						</Button>
						<Button variant="destructive" onClick={handleEndGame}>
							{tc("confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
