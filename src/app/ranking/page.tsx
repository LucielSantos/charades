"use client"

import { ArrowLeft, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { RankingTable } from "@/components/game/ranking-table"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"

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

	const gameTeams = teams.filter((team) => teamStats[team.id])

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

			<RankingTable teams={gameTeams} stats={teamStats} />

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
