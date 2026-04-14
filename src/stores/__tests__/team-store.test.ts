import { beforeEach, describe, expect, it } from "vitest"
import { useTeamStore } from "../team-store"

describe("useTeamStore", () => {
  beforeEach(() => {
    useTeamStore.getState().reset()
  })

  describe("addTeam", () => {
    it("adds a team with id, name and color", () => {
      useTeamStore.getState().addTeam("Leoes", "#ef4444")
      const teams = useTeamStore.getState().teams
      expect(teams).toHaveLength(1)
      expect(teams[0].name).toBe("Leoes")
      expect(teams[0].color).toBe("#ef4444")
      expect(teams[0].id).toBeDefined()
    })
  })

  describe("updateTeam", () => {
    it("updates team name and color", () => {
      useTeamStore.getState().addTeam("Leoes", "#ef4444")
      const id = useTeamStore.getState().teams[0].id
      useTeamStore.getState().updateTeam(id, "Tigres", "#3b82f6")
      const team = useTeamStore.getState().teams[0]
      expect(team.name).toBe("Tigres")
      expect(team.color).toBe("#3b82f6")
    })
  })

  describe("removeTeam", () => {
    it("removes a team by id", () => {
      useTeamStore.getState().addTeam("Leoes", "#ef4444")
      useTeamStore.getState().addTeam("Tigres", "#3b82f6")
      const id = useTeamStore.getState().teams[0].id
      useTeamStore.getState().removeTeam(id)
      expect(useTeamStore.getState().teams).toHaveLength(1)
      expect(useTeamStore.getState().teams[0].name).toBe("Tigres")
    })
  })

  describe("getUsedColors", () => {
    it("returns colors already in use", () => {
      useTeamStore.getState().addTeam("Leoes", "#ef4444")
      useTeamStore.getState().addTeam("Tigres", "#3b82f6")
      const used = useTeamStore.getState().getUsedColors()
      expect(used).toEqual(["#ef4444", "#3b82f6"])
    })
  })

  describe("getTeamById", () => {
    it("returns team by id", () => {
      useTeamStore.getState().addTeam("Leoes", "#ef4444")
      const id = useTeamStore.getState().teams[0].id
      const team = useTeamStore.getState().getTeamById(id)
      expect(team?.name).toBe("Leoes")
    })

    it("returns undefined for unknown id", () => {
      const team = useTeamStore.getState().getTeamById("unknown")
      expect(team).toBeUndefined()
    })
  })
})
