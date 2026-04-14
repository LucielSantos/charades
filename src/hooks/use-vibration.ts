"use client"

import { useCallback } from "react"
import type { PressurePhase } from "./use-timer"

export function useVibration() {
	const vibrate = useCallback((phase: PressurePhase) => {
		if (typeof navigator === "undefined" || !navigator.vibrate) return

		switch (phase) {
			case "low":
				navigator.vibrate(100)
				break
			case "medium":
				navigator.vibrate([100, 50, 100])
				break
			case "high":
				navigator.vibrate([200])
				break
		}
	}, [])

	return { vibrate }
}
