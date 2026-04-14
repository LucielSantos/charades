"use client"

import type { PressurePhase } from "@/hooks/use-timer"

interface TimerDisplayProps {
	displayTime: string
	pressurePhase: PressurePhase
	isExpired: boolean
}

export function TimerDisplay({ displayTime, pressurePhase, isExpired }: TimerDisplayProps) {
	const phaseStyles: Record<PressurePhase, string> = {
		none: "bg-gray-100 text-gray-800",
		low: "bg-red-100 text-red-700 animate-pulse-slow",
		medium: "bg-red-200 text-red-800 animate-pulse-fast",
		high: "bg-red-500 text-white animate-pulse-fast",
	}

	return (
		<div
			className={`rounded-2xl px-6 py-3 text-center transition-all ${
				isExpired ? "bg-red-500 text-white" : phaseStyles[pressurePhase]
			}`}
		>
			<span className="text-4xl font-bold tabular-nums">{isExpired ? "Tempo!" : displayTime}</span>
		</div>
	)
}
