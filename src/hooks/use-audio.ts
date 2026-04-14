"use client"

import { useCallback, useEffect, useRef } from "react"

interface UseAudioReturn {
	playTick: () => void
	playBeep: () => void
}

export function useAudio(muted: boolean): UseAudioReturn {
	const tickRef = useRef<HTMLAudioElement | null>(null)
	const beepRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		tickRef.current = new Audio("/sounds/tick.mp3")
		beepRef.current = new Audio("/sounds/beep.mp3")
		tickRef.current.preload = "auto"
		beepRef.current.preload = "auto"
	}, [])

	const playTick = useCallback(() => {
		if (muted || !tickRef.current) return
		tickRef.current.currentTime = 0
		tickRef.current.play().catch(() => {})
	}, [muted])

	const playBeep = useCallback(() => {
		if (muted || !beepRef.current) return
		beepRef.current.currentTime = 0
		beepRef.current.play().catch(() => {})
	}, [muted])

	return { playTick, playBeep }
}
