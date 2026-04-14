import { useCallback, useEffect, useRef, useState } from "react"
import type { TimerMode } from "@/data/types"

export type PressurePhase = "none" | "low" | "medium" | "high"

interface UseTimerOptions {
	mode: TimerMode
	seconds: number
}

interface UseTimerReturn {
	timeLeft: number
	elapsed: number
	displayTime: string
	isRunning: boolean
	isExpired: boolean
	pressurePhase: PressurePhase
	start: () => void
	pause: () => void
	reset: () => void
}

function formatTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function getPressurePhase(timeLeft: number, mode: TimerMode): PressurePhase {
	if (mode === "unlimited") return "none"
	if (timeLeft <= 2) return "high"
	if (timeLeft <= 5) return "medium"
	if (timeLeft <= 10) return "low"
	return "none"
}

export function useTimer({ mode, seconds }: UseTimerOptions): UseTimerReturn {
	const [timeLeft, setTimeLeft] = useState(seconds)
	const [elapsed, setElapsed] = useState(0)
	const [isRunning, setIsRunning] = useState(false)
	const [isExpired, setIsExpired] = useState(false)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const clearTimer = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
	}, [])

	const start = useCallback(() => {
		if (isExpired) return
		setIsRunning(true)
	}, [isExpired])

	const pause = useCallback(() => {
		setIsRunning(false)
		clearTimer()
	}, [clearTimer])

	const reset = useCallback(() => {
		clearTimer()
		setTimeLeft(seconds)
		setElapsed(0)
		setIsRunning(false)
		setIsExpired(false)
	}, [seconds, clearTimer])

	useEffect(() => {
		if (!isRunning) {
			clearTimer()
			return
		}

		intervalRef.current = setInterval(() => {
			if (mode === "countdown") {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsRunning(false)
						setIsExpired(true)
						return 0
					}
					return prev - 1
				})
			} else {
				setElapsed((prev) => prev + 1)
			}
		}, 1000)

		return clearTimer
	}, [isRunning, mode, clearTimer])

	const displaySeconds = mode === "countdown" ? timeLeft : elapsed
	const displayTime = formatTime(displaySeconds)
	const pressurePhase = getPressurePhase(timeLeft, mode)

	return {
		timeLeft,
		elapsed,
		displayTime,
		isRunning,
		isExpired,
		pressurePhase,
		start,
		pause,
		reset,
	}
}
