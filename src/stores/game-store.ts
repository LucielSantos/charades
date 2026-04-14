import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CategoryId, GameSettings, GameState, PlayResult, TeamStats, Word } from "@/data/types"
import { words as allWords } from "@/data/words"

interface GameStore extends GameState {
  startGame: (settings: GameSettings) => void
  drawWord: () => void
  submitResult: (result: PlayResult) => void
  updateCategories: (categories: CategoryId[]) => void
  resetGame: () => void
  getCurrentTeamId: () => string
  getNextTeamId: () => string
  getRoundNumber: () => number
  clearPoolResetFlag: () => void
}

const initialState: GameState = {
  status: "idle",
  settings: {
    selectedTeamIds: [],
    selectedCategories: [],
    difficulty: "easy",
    timerMode: "countdown",
    timerSeconds: 60,
  },
  currentTeamIndex: 0,
  currentWord: null,
  usedWordIds: [],
  teamStats: {},
  lastResult: null,
  lastWord: null,
  poolWasReset: false,
}

function getAvailableWords(
  categories: CategoryId[],
  difficulty: string,
  usedIds: string[],
): Word[] {
  return allWords.filter(
    (w) =>
      categories.includes(w.category) &&
      w.difficulty === difficulty &&
      !usedIds.includes(w.id),
  )
}

function pickRandomWord(words: Word[]): Word {
  return words[Math.floor(Math.random() * words.length)]
}

function getTotalPlays(teamStats: Record<string, TeamStats>): number {
  return Object.values(teamStats).reduce(
    (sum, s) => sum + s.correct + s.wrong + s.skipped,
    0,
  )
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startGame: (settings) => {
        const teamStats: Record<string, TeamStats> = {}
        for (const teamId of settings.selectedTeamIds) {
          teamStats[teamId] = { correct: 0, wrong: 0, skipped: 0 }
        }
        set({
          status: "playing",
          settings,
          currentTeamIndex: 0,
          currentWord: null,
          usedWordIds: [],
          teamStats,
          lastResult: null,
          lastWord: null,
          poolWasReset: false,
        })
      },

      drawWord: () => {
        const { settings, usedWordIds } = get()
        let available = getAvailableWords(
          settings.selectedCategories,
          settings.difficulty,
          usedWordIds,
        )

        if (available.length === 0) {
          available = getAvailableWords(
            settings.selectedCategories,
            settings.difficulty,
            [],
          )
          set({ usedWordIds: [], poolWasReset: true })
        }

        if (available.length === 0) return

        const word = pickRandomWord(available)
        set((state) => ({
          currentWord: word,
          usedWordIds: [...state.usedWordIds, word.id],
        }))
      },

      submitResult: (result) => {
        const { settings, currentTeamIndex, currentWord, teamStats } = get()
        const teamId = settings.selectedTeamIds[currentTeamIndex]
        const currentStats = teamStats[teamId]

        const updatedStats = { ...currentStats }
        if (result === "correct") updatedStats.correct += 1
        else if (result === "wrong") updatedStats.wrong += 1
        else if (result === "skipped") updatedStats.skipped += 1

        const nextIndex = (currentTeamIndex + 1) % settings.selectedTeamIds.length

        set({
          teamStats: { ...teamStats, [teamId]: updatedStats },
          currentTeamIndex: nextIndex,
          lastResult: result,
          lastWord: currentWord,
          currentWord: null,
        })
      },

      updateCategories: (categories) => {
        set((state) => ({
          settings: { ...state.settings, selectedCategories: categories },
        }))
      },

      resetGame: () => set(initialState),

      clearPoolResetFlag: () => set({ poolWasReset: false }),

      getCurrentTeamId: () => {
        const { settings, currentTeamIndex } = get()
        return settings.selectedTeamIds[currentTeamIndex]
      },

      getNextTeamId: () => {
        const { settings, currentTeamIndex } = get()
        const nextIndex = (currentTeamIndex + 1) % settings.selectedTeamIds.length
        return settings.selectedTeamIds[nextIndex]
      },

      getRoundNumber: () => {
        return getTotalPlays(get().teamStats) + 1
      },
    }),
    {
      name: "charades-game",
    },
  ),
)
