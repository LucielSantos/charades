"use client"

import { Home, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { CategoryGrid } from "@/components/game/category-grid"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import type { Difficulty, TimerMode } from "@/data/types"
import { useGameStore } from "@/stores/game-store"

interface PlayMenuSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onExitHome: () => void
	onEndGame: () => void
}

const TIMER_OPTIONS = [30, 60, 90]

export function PlayMenuSheet({
	open,
	onOpenChange,
	onExitHome,
	onEndGame,
}: PlayMenuSheetProps) {
	const t = useTranslations("play")
	const tSetup = useTranslations("setup")
	const tc = useTranslations("common")

	const settings = useGameStore((s) => s.settings)
	const updateSettings = useGameStore((s) => s.updateSettings)

	const [confirmEndOpen, setConfirmEndOpen] = useState(false)

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
					<SheetHeader>
						<SheetTitle>{t("menu")}</SheetTitle>
					</SheetHeader>

					<section className="py-2">
						<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
							{t("configure")}
						</h3>

						<div className="mb-4">
							<p className="text-xs font-semibold text-gray-500 mb-2">{t("categories")}</p>
							<CategoryGrid
								selected={settings.selectedCategories}
								onChange={(selectedCategories) => updateSettings({ selectedCategories })}
							/>
						</div>

						<div className="mb-4">
							<p className="text-xs font-semibold text-gray-500 mb-2">{t("difficulty")}</p>
							<div className="flex gap-2">
								{(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
									<button
										key={d}
										type="button"
										onClick={() => updateSettings({ difficulty: d })}
										className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
											settings.difficulty === d
												? "bg-indigo-600 text-white shadow-md"
												: "bg-white text-gray-600 border border-gray-200"
										}`}
									>
										{tSetup(d)}
									</button>
								))}
							</div>
						</div>

						<div className="mb-2">
							<p className="text-xs font-semibold text-gray-500 mb-2">{t("timer")}</p>
							<div className="flex gap-2 mb-2">
								{(["countdown", "unlimited"] as TimerMode[]).map((m) => (
									<button
										key={m}
										type="button"
										onClick={() => updateSettings({ timerMode: m })}
										className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
											settings.timerMode === m
												? "bg-indigo-600 text-white shadow-md"
												: "bg-white text-gray-600 border border-gray-200"
										}`}
									>
										{tSetup(m)}
									</button>
								))}
							</div>
							{settings.timerMode === "countdown" && (
								<div className="flex gap-2">
									{TIMER_OPTIONS.map((s) => (
										<button
											key={s}
											type="button"
											onClick={() => updateSettings({ timerSeconds: s })}
											className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
												settings.timerSeconds === s
													? "bg-indigo-500 text-white"
													: "bg-white text-gray-600 border border-gray-200"
											}`}
										>
											{tSetup("seconds", { seconds: s })}
										</button>
									))}
								</div>
							)}
							<p className="text-xs text-gray-400 mt-2">{t("timerNote")}</p>
						</div>
					</section>

					<Separator className="my-4" />

					<section className="pb-2">
						<h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
							{t("exit")}
						</h3>
						<div className="flex flex-col gap-2">
							<Button variant="outline" className="w-full h-12" onClick={onExitHome}>
								<Home className="mr-2 h-4 w-4" />
								{t("exitHome")}
							</Button>
							<Button
								variant="destructive"
								className="w-full h-12"
								onClick={() => setConfirmEndOpen(true)}
							>
								<LogOut className="mr-2 h-4 w-4" />
								{t("endGame")}
							</Button>
						</div>
					</section>

					<Button className="w-full mt-4" onClick={() => onOpenChange(false)}>
						{t("close")}
					</Button>
				</SheetContent>
			</Sheet>

			<Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("endGame")}</DialogTitle>
						<DialogDescription>{t("endGameConfirm")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmEndOpen(false)}>
							{tc("cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								setConfirmEndOpen(false)
								onEndGame()
							}}
						>
							{t("endGame")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
