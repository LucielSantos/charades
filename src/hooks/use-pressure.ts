"use client"

import { useEffect } from "react"
import { useAudio } from "./use-audio"
import type { PressurePhase } from "./use-timer"
import { useVibration } from "./use-vibration"

interface UsePressureOptions {
	pressurePhase: PressurePhase
	timeLeft: number
	isRunning: boolean
	muted: boolean
}

interface UsePressureReturn {
	unlockAudio: () => void
}

export function usePressure({
	pressurePhase,
	timeLeft,
	isRunning,
	muted,
}: UsePressureOptions): UsePressureReturn {
	const { playTick, playBeep, unlock } = useAudio(muted)
	const { vibrate } = useVibration()

	useEffect(() => {
		if (!isRunning || pressurePhase === "none") return

		if (pressurePhase === "high") {
			playBeep()
		} else {
			playTick()
		}

		vibrate(pressurePhase)
	}, [timeLeft, pressurePhase, isRunning, playTick, playBeep, vibrate])

	return { unlockAudio: unlock }
}
