import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useTimer } from "../use-timer"

describe("useTimer", () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe("countdown mode", () => {
		it("counts down from initial seconds", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 60 }))
			expect(result.current.timeLeft).toBe(60)
			expect(result.current.isRunning).toBe(false)
		})

		it("decrements time when started", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 60 }))
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(1000))
			expect(result.current.timeLeft).toBe(59)
			expect(result.current.isRunning).toBe(true)
		})

		it("stops at zero", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 3 }))
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(5000))
			expect(result.current.timeLeft).toBe(0)
			expect(result.current.isExpired).toBe(true)
			expect(result.current.isRunning).toBe(false)
		})

		it("reports pressure phase", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 12 }))
			act(() => result.current.start())

			expect(result.current.pressurePhase).toBe("none")

			act(() => vi.advanceTimersByTime(2000))
			expect(result.current.pressurePhase).toBe("low")

			act(() => vi.advanceTimersByTime(5000))
			expect(result.current.pressurePhase).toBe("medium")

			act(() => vi.advanceTimersByTime(3000))
			expect(result.current.pressurePhase).toBe("high")
		})

		it("can be paused and resumed", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 60 }))
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(3000))
			expect(result.current.timeLeft).toBe(57)

			act(() => result.current.pause())
			act(() => vi.advanceTimersByTime(5000))
			expect(result.current.timeLeft).toBe(57)

			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(2000))
			expect(result.current.timeLeft).toBe(55)
		})

		it("can be reset", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 60 }))
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(10000))
			act(() => result.current.reset())
			expect(result.current.timeLeft).toBe(60)
			expect(result.current.isRunning).toBe(false)
			expect(result.current.isExpired).toBe(false)
		})
	})

	describe("unlimited mode", () => {
		it("counts up from zero", () => {
			const { result } = renderHook(() => useTimer({ mode: "unlimited", seconds: 0 }))
			expect(result.current.elapsed).toBe(0)
		})

		it("increments elapsed when started", () => {
			const { result } = renderHook(() => useTimer({ mode: "unlimited", seconds: 0 }))
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(5000))
			expect(result.current.elapsed).toBe(5)
			expect(result.current.pressurePhase).toBe("none")
		})
	})

	describe("formatTime", () => {
		it("formats seconds as M:SS", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 95 }))
			expect(result.current.displayTime).toBe("1:35")
		})

		it("formats zero as 0:00", () => {
			const { result } = renderHook(() => useTimer({ mode: "countdown", seconds: 0 }))
			expect(result.current.displayTime).toBe("0:00")
		})
	})
})
