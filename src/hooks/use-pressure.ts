"use client"

import { useEffect, useRef } from "react"
import type { PressurePhase } from "./use-timer"
import { useAudio } from "./use-audio"
import { useVibration } from "./use-vibration"

interface UsePressureOptions {
  pressurePhase: PressurePhase
  isRunning: boolean
  muted: boolean
}

export function usePressure({ pressurePhase, isRunning, muted }: UsePressureOptions) {
  const { playTick, playBeep } = useAudio(muted)
  const { vibrate } = useVibration()
  const prevPhaseRef = useRef<PressurePhase>("none")

  useEffect(() => {
    if (!isRunning || pressurePhase === "none") {
      prevPhaseRef.current = pressurePhase
      return
    }

    if (pressurePhase !== prevPhaseRef.current) {
      prevPhaseRef.current = pressurePhase
    }

    if (pressurePhase === "high") {
      playBeep()
    } else {
      playTick()
    }

    vibrate(pressurePhase)
  }, [pressurePhase, isRunning, playTick, playBeep, vibrate])
}
