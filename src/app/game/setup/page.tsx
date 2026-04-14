"use client"

import { ArrowLeft, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { CategoryGrid } from "@/components/game/category-grid"
import { Button } from "@/components/ui/button"
import { allCategoryIds } from "@/data/categories"
import type { CategoryId, Difficulty, TimerMode } from "@/data/types"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"

const TIMER_OPTIONS = [30, 60, 90]

export default function GameSetupPage() {
	const t = useTranslations("setup")
	const _tc = useTranslations("common")
	const router = useRouter()
	const teams = useTeamStore((s) => s.teams)
	const startGame = useGameStore((s) => s.startGame)

	const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
	const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([...allCategoryIds])
	const [difficulty, setDifficulty] = useState<Difficulty>("easy")
	const [timerMode, setTimerMode] = useState<TimerMode>("countdown")
	const [timerSeconds, setTimerSeconds] = useState(60)

	function toggleTeam(id: string) {
		setSelectedTeamIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
	}

	function handleStart() {
		if (selectedTeamIds.length < 2) return
		if (selectedCategories.length < 1) return
		startGame({
			selectedTeamIds,
			selectedCategories,
			difficulty,
			timerMode,
			timerSeconds,
		})
		router.push("/game/turn")
	}

	const canStart = selectedTeamIds.length >= 2 && selectedCategories.length >= 1

	return (
		<div className="flex flex-col min-h-screen px-6 py-8 pb-24">
			<div className="flex items-center gap-3 mb-6">
				<Button variant="ghost" size="icon" onClick={() => router.push("/")}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
			</div>

			{/* Teams */}
			<section className="mb-8">
				<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
					{t("selectTeams")}
				</h2>
				<div className="flex flex-wrap gap-2">
					{teams.map((team) => {
						const isSelected = selectedTeamIds.includes(team.id)
						return (
							<button
								key={team.id}
								type="button"
								onClick={() => toggleTeam(team.id)}
								className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
									isSelected
										? "text-white shadow-md"
										: "bg-white text-gray-600 border border-gray-200"
								}`}
								style={isSelected ? { backgroundColor: team.color } : undefined}
							>
								{!isSelected && (
									<div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
								)}
								{team.name}
							</button>
						)
					})}
				</div>
				{selectedTeamIds.length < 2 && <p className="text-xs text-red-500 mt-2">{t("minTeams")}</p>}
			</section>

			{/* Categories */}
			<section className="mb-8">
				<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
					{t("selectCategories")}
				</h2>
				<CategoryGrid selected={selectedCategories} onChange={setSelectedCategories} />
			</section>

			{/* Difficulty */}
			<section className="mb-8">
				<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
					{t("difficulty")}
				</h2>
				<div className="flex gap-2">
					{(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
						<button
							key={d}
							type="button"
							onClick={() => setDifficulty(d)}
							className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
								difficulty === d
									? "bg-indigo-600 text-white shadow-md"
									: "bg-white text-gray-600 border border-gray-200"
							}`}
						>
							{t(d)}
						</button>
					))}
				</div>
			</section>

			{/* Timer */}
			<section className="mb-8">
				<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
					{t("timer")}
				</h2>
				<div className="flex gap-2 mb-3">
					{(["countdown", "unlimited"] as TimerMode[]).map((m) => (
						<button
							key={m}
							type="button"
							onClick={() => setTimerMode(m)}
							className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
								timerMode === m
									? "bg-indigo-600 text-white shadow-md"
									: "bg-white text-gray-600 border border-gray-200"
							}`}
						>
							{t(m)}
						</button>
					))}
				</div>
				{timerMode === "countdown" && (
					<div className="flex gap-2">
						{TIMER_OPTIONS.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setTimerSeconds(s)}
								className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
									timerSeconds === s
										? "bg-indigo-500 text-white"
										: "bg-white text-gray-600 border border-gray-200"
								}`}
							>
								{t("seconds", { seconds: s })}
							</button>
						))}
					</div>
				)}
			</section>

			{/* Start Button */}
			<div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/80 to-transparent">
				<div className="mx-auto max-w-[430px]">
					<Button
						size="lg"
						className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
						disabled={!canStart}
						onClick={handleStart}
					>
						<Play className="mr-2 h-5 w-5" />
						{t("startGame")}
					</Button>
				</div>
			</div>
		</div>
	)
}
