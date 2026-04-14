import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Team } from "@/data/types"

interface TeamStore {
  teams: Team[]
  addTeam: (name: string, color: string) => void
  updateTeam: (id: string, name: string, color: string) => void
  removeTeam: (id: string) => void
  getUsedColors: () => string[]
  getTeamById: (id: string) => Team | undefined
  reset: () => void
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set, get) => ({
      teams: [],

      addTeam: (name, color) => {
        const team: Team = {
          id: crypto.randomUUID(),
          name,
          color,
        }
        set((state) => ({ teams: [...state.teams, team] }))
      },

      updateTeam: (id, name, color) => {
        set((state) => ({
          teams: state.teams.map((t) => (t.id === id ? { ...t, name, color } : t)),
        }))
      },

      removeTeam: (id) => {
        set((state) => ({ teams: state.teams.filter((t) => t.id !== id) }))
      },

      getUsedColors: () => {
        return get().teams.map((t) => t.color)
      },

      getTeamById: (id) => {
        return get().teams.find((t) => t.id === id)
      },

      reset: () => set({ teams: [] }),
    }),
    {
      name: "charades-teams",
    },
  ),
)
