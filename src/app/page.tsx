"use client"

import { Gamepad2, Trophy } from "lucide-react"
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
import { useGameStore } from "@/stores/game-store"

export default function HomePage() {
	const t = useTranslations()
	const router = useRouter()
	const gameStatus = useGameStore((s) => s.status)
	const resetGame = useGameStore((s) => s.resetGame)
	const [showConfirm, setShowConfirm] = useState(false)

	const hasActiveGame = gameStatus === "playing" || gameStatus === "paused"

	function handleGameButton() {
		if (hasActiveGame) {
			router.push("/game/turn")
		} else {
			router.push("/game/setup")
		}
	}

	function handleNewGameWhileActive() {
		setShowConfirm(true)
	}

	function confirmNewGame() {
		resetGame()
		setShowConfirm(false)
		router.push("/game/setup")
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
			<div className="text-center">
				<h1 className="text-5xl font-extrabold tracking-tight text-indigo-900">{t("app.name")}</h1>
				<p className="mt-2 text-lg text-indigo-600/70">{t("app.description")}</p>
			</div>

			<div className="flex w-full flex-col gap-4">
				<Button
					size="lg"
					className="h-16 text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
					onClick={handleGameButton}
				>
					<Gamepad2 className="mr-2 h-6 w-6" />
					{hasActiveGame ? t("home.continueGame") : t("home.newGame")}
				</Button>

				{hasActiveGame && (
					<Button
						size="lg"
						variant="outline"
						className="h-14 text-base font-semibold"
						onClick={handleNewGameWhileActive}
					>
						<Gamepad2 className="mr-2 h-5 w-5" />
						{t("home.newGame")}
					</Button>
				)}

				{hasActiveGame && (
					<Button
						size="lg"
						variant="outline"
						className="h-14 text-base font-semibold"
						onClick={() => router.push("/ranking")}
					>
						<Trophy className="mr-2 h-5 w-5" />
						{t("home.ranking")}
					</Button>
				)}
			</div>

			<Dialog open={showConfirm} onOpenChange={setShowConfirm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("home.newGame")}</DialogTitle>
						<DialogDescription>{t("setup.confirmNewGame")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowConfirm(false)}>
							{t("common.cancel")}
						</Button>
						<Button onClick={confirmNewGame}>{t("common.confirm")}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
