import { beforeEach, describe, expect, it } from "vitest"
import type { GameSettings } from "@/data/types"
import { useGameStore } from "../game-store"

const defaultSettings: GameSettings = {
	selectedTeamIds: ["team-1", "team-2"],
	selectedCategories: ["animals"],
	difficulty: "easy",
	timerMode: "countdown",
	timerSeconds: 60,
}

describe("useGameStore", () => {
	beforeEach(() => {
		useGameStore.getState().resetGame()
	})

	describe("startGame", () => {
		it("initializes game with settings and team stats", () => {
			useGameStore.getState().startGame(defaultSettings)
			const state = useGameStore.getState()
			expect(state.status).toBe("playing")
			expect(state.settings).toEqual(defaultSettings)
			expect(state.currentTeamIndex).toBe(0)
			expect(state.teamStats["team-1"]).toEqual({ correct: 0, wrong: 0, skipped: 0 })
			expect(state.teamStats["team-2"]).toEqual({ correct: 0, wrong: 0, skipped: 0 })
		})
	})

	describe("drawWord", () => {
		it("draws a word matching category and difficulty", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const word = useGameStore.getState().currentWord
			expect(word).not.toBeNull()
			expect(word?.category).toBe("animals")
			expect(word?.difficulty).toBe("easy")
		})

		it("does not repeat words until pool is exhausted", () => {
			useGameStore.getState().startGame(defaultSettings)
			const drawnIds = new Set<string>()
			for (let i = 0; i < 5; i++) {
				useGameStore.getState().drawWord()
				const word = useGameStore.getState().currentWord!
				expect(drawnIds.has(word.id)).toBe(false)
				drawnIds.add(word.id)
				useGameStore.getState().submitResult("correct")
			}
		})
	})

	describe("submitResult", () => {
		it("records correct answer for current team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("correct")
			const stats = useGameStore.getState().teamStats["team-1"]
			expect(stats.correct).toBe(1)
		})

		it("records wrong answer for current team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("wrong")
			const stats = useGameStore.getState().teamStats["team-1"]
			expect(stats.wrong).toBe(1)
		})

		it("advances to next team after submit", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("correct")
			expect(useGameStore.getState().currentTeamIndex).toBe(1)
		})

		it("wraps around to first team after last", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("correct")
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("correct")
			expect(useGameStore.getState().currentTeamIndex).toBe(0)
		})

		it("stores lastResult and lastWord for result screen", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const word = useGameStore.getState().currentWord!
			useGameStore.getState().submitResult("correct")
			expect(useGameStore.getState().lastResult).toBe("correct")
			expect(useGameStore.getState().lastWord).toEqual(word)
		})
	})

	describe("updateCategories", () => {
		it("updates selected categories mid-game", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().updateCategories(["animals", "actions"])
			expect(useGameStore.getState().settings.selectedCategories).toEqual(["animals", "actions"])
		})
	})

	describe("resetGame", () => {
		it("resets all game state to idle", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("correct")
			useGameStore.getState().resetGame()
			const state = useGameStore.getState()
			expect(state.status).toBe("idle")
			expect(state.currentWord).toBeNull()
			expect(state.teamStats).toEqual({})
			expect(state.usedWordIds).toEqual([])
		})
	})

	describe("getCurrentTeamId", () => {
		it("returns the current team id", () => {
			useGameStore.getState().startGame(defaultSettings)
			expect(useGameStore.getState().getCurrentTeamId()).toBe("team-1")
		})
	})

	describe("getNextTeamId", () => {
		it("returns the next team id", () => {
			useGameStore.getState().startGame(defaultSettings)
			expect(useGameStore.getState().getNextTeamId()).toBe("team-2")
		})

		it("wraps around to first team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("correct")
			expect(useGameStore.getState().getNextTeamId()).toBe("team-1")
		})
	})

	describe("getRoundNumber", () => {
		it("returns total plays + 1", () => {
			useGameStore.getState().startGame(defaultSettings)
			expect(useGameStore.getState().getRoundNumber()).toBe(1)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("correct")
			expect(useGameStore.getState().getRoundNumber()).toBe(2)
		})
	})

	describe("regenerateWord", () => {
		it("replaces current word with a different word", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const firstWord = useGameStore.getState().currentWord!
			useGameStore.getState().regenerateWord()
			const newWord = useGameStore.getState().currentWord!
			expect(newWord).not.toBeNull()
			expect(newWord.id).not.toBe(firstWord.id)
		})

		it("increments skipped counter for current team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			const stats = useGameStore.getState().teamStats["team-1"]
			expect(stats.skipped).toBe(1)
		})

		it("does not advance to next team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			expect(useGameStore.getState().currentTeamIndex).toBe(0)
		})

		it("returns discarded word to the pool (available for future draws)", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const discarded = useGameStore.getState().currentWord!
			useGameStore.getState().regenerateWord()
			expect(useGameStore.getState().usedWordIds).not.toContain(discarded.id)
		})

		it("keeps new word in usedWordIds so it is not redrawn again", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			const newWordId = useGameStore.getState().currentWord!.id
			expect(useGameStore.getState().usedWordIds).toContain(newWordId)
		})

		it("always leaves a non-null currentWord after regenerate", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			expect(useGameStore.getState().currentWord).not.toBeNull()
		})
	})
})
