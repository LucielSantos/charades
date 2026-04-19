"use client"

import { Volume2, VolumeX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ActionButtons } from "@/components/game/action-buttons"
import { TimerDisplay } from "@/components/game/timer-display"
import { WordDisplay } from "@/components/game/word-display"
import type { PlayResult } from "@/data/types"
import { usePressure } from "@/hooks/use-pressure"
import { useTimer } from "@/hooks/use-timer"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"

export default function GamePlayPage() {
	const t = useTranslations("play")
	const tToast = useTranslations("toast")
	const router = useRouter()

	const currentWord = useGameStore((s) => s.currentWord)
	const settings = useGameStore((s) => s.settings)
	const getCurrentTeamId = useGameStore((s) => s.getCurrentTeamId)
	const getRoundNumber = useGameStore((s) => s.getRoundNumber)
	const submitResult = useGameStore((s) => s.submitResult)
	const regenerateWord = useGameStore((s) => s.regenerateWord)
	const poolWasReset = useGameStore((s) => s.poolWasReset)
	const clearPoolResetFlag = useGameStore((s) => s.clearPoolResetFlag)
	const getTeamById = useTeamStore((s) => s.getTeamById)

	const [muted, setMuted] = useState(false)
	const [hydrated, setHydrated] = useState(false)

	useEffect(() => setHydrated(true), [])

	const team = getTeamById(getCurrentTeamId())
	const roundNumber = getRoundNumber()

	const timer = useTimer({
		mode: settings.timerMode,
		seconds: settings.timerSeconds,
	})

	usePressure({
		pressurePhase: timer.pressurePhase,
		isRunning: timer.isRunning,
		muted,
	})

	useEffect(() => {
		timer.start()
		return () => timer.pause()
	}, [timer.start, timer.pause])

	useEffect(() => {
		if (poolWasReset) {
			toast(tToast("wordsReset"))
			clearPoolResetFlag()
		}
	}, [poolWasReset, clearPoolResetFlag, tToast])

	function handleAction(result: PlayResult) {
		timer.pause()
		submitResult(result)
		router.push("/game/result")
	}

	function handleRegenerate() {
		regenerateWord()
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: only redirect on initial hydration
	useEffect(() => {
		if (hydrated && (!currentWord || !team)) router.push("/game/turn")
	}, [hydrated])

	if (!hydrated || !currentWord || !team) return null

	return (
		<div className="flex flex-col min-h-screen px-6 py-8 relative">
			{/* Pressure overlay */}
			{timer.pressurePhase !== "none" && (
				<div
					className={`fixed inset-0 pointer-events-none transition-opacity z-10 ${
						timer.pressurePhase === "low"
							? "bg-red-500/5"
							: timer.pressurePhase === "medium"
								? "bg-red-500/10"
								: "bg-red-500/20"
					}`}
				/>
			)}

			{/* Header */}
			<div className="flex items-center justify-between mb-8 relative z-20">
				<div className="flex items-center gap-2">
					<div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
					<span className="font-semibold text-gray-700">{team.name}</span>
				</div>
				<span className="text-sm text-gray-500">{t("round", { round: roundNumber })}</span>
				<button type="button" onClick={() => setMuted(!muted)} className="text-gray-500">
					{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
				</button>
			</div>

			{/* Timer */}
			<div className="mb-8 relative z-20">
				<TimerDisplay
					displayTime={timer.displayTime}
					pressurePhase={timer.pressurePhase}
					isExpired={timer.isExpired}
				/>
			</div>

			{/* Word */}
			<div className="flex-1 flex items-center justify-center relative z-20">
				<WordDisplay
					word={currentWord.text}
					category={currentWord.category}
					difficulty={currentWord.difficulty}
				/>
			</div>

			{/* Actions */}
			<div className="relative z-20 pb-4">
				<ActionButtons onAction={handleAction} onRegenerate={handleRegenerate} />
			</div>
		</div>
	)
}
