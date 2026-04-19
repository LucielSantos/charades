"use client"

import { useCallback, useEffect, useRef } from "react"

interface UseAudioReturn {
	playTick: () => void
	playBeep: () => void
	unlock: () => void
}

type AudioContextCtor = typeof AudioContext

export function useAudio(muted: boolean): UseAudioReturn {
	const ctxRef = useRef<AudioContext | null>(null)

	useEffect(() => {
		return () => {
			ctxRef.current?.close()
			ctxRef.current = null
		}
	}, [])

	const unlock = useCallback(() => {
		if (ctxRef.current) {
			if (ctxRef.current.state === "suspended") ctxRef.current.resume()
			return
		}
		const Ctor: AudioContextCtor | undefined =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
		if (!Ctor) return
		ctxRef.current = new Ctor()
	}, [])

	const playTone = useCallback(
		(frequency: number, durationMs: number, peakGain: number) => {
			if (muted) return
			const ctx = ctxRef.current
			if (!ctx) return
			if (ctx.state === "suspended") ctx.resume()

			const now = ctx.currentTime
			const dur = durationMs / 1000
			const osc = ctx.createOscillator()
			const gain = ctx.createGain()

			osc.type = "sine"
			osc.frequency.value = frequency

			gain.gain.setValueAtTime(0, now)
			gain.gain.linearRampToValueAtTime(peakGain, now + 0.005)
			gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

			osc.connect(gain)
			gain.connect(ctx.destination)

			osc.start(now)
			osc.stop(now + dur)
		},
		[muted],
	)

	const playTick = useCallback(() => playTone(1200, 60, 0.25), [playTone])
	const playBeep = useCallback(() => playTone(880, 180, 0.4), [playTone])

	return { playTick, playBeep, unlock }
}
