"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import type { CategoryId } from "@/data/types"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"

/**
 * AmbientTint
 *
 * Side-effect component (renders null). Sets four CSS custom properties on
 * `document.documentElement` so that the decorative blobs rendered by
 * <DesktopStage /> can tint themselves based on the current route and game
 * state.
 *
 * CSS vars written:
 *   --ambient-blob-1         primary blob
 *   --ambient-blob-2         secondary blob
 *   --ambient-blob-3         tertiary blob (kept neutral)
 *   --ambient-blob-category  category accent (transparent off-gameplay)
 *
 * On non-gameplay routes the palette is neutral (indigo/violet/pink).
 * On `/game/turn` and `/game/play` the primary/secondary blobs are driven by
 * the current team's color and the category blob reflects the current
 * category (or the first selected category if no word is drawn yet).
 */

/* ---------------- neutral palette (non-gameplay + fallback) ---------------- */

const NEUTRAL_BLOB_1 = "oklch(0.82 0.09 280)" // indigo-300
const NEUTRAL_BLOB_2 = "oklch(0.82 0.09 310)" // violet-300
const NEUTRAL_BLOB_3 = "oklch(0.87 0.06 350)" // pink-200
const NEUTRAL_CATEGORY = "transparent"

/* ---------------- category → accent color map ---------------- */
/*
 * Keys cover:
 *  - the actual CategoryId slugs shipped in src/data/categories.ts
 *    (animals, professions, bible, movies, actions, characters)
 *  - the Portuguese/English labels mentioned in the design spec as defensive
 *    fall-backs in case the store ever carries a translated identifier.
 */
const CATEGORY_ACCENTS: Record<string, string> = {
	// shipped CategoryId slugs
	movies: "oklch(0.35 0.12 25)", // wine / red-900
	animals: "oklch(0.48 0.12 60)", // amber-800
	// spec-mentioned aliases (defensive)
	filmes: "oklch(0.35 0.12 25)",
	series: "oklch(0.35 0.12 25)",
	esportes: "oklch(0.52 0.12 160)",
	sports: "oklch(0.52 0.12 160)",
	música: "oklch(0.45 0.18 300)",
	musica: "oklch(0.45 0.18 300)",
	music: "oklch(0.45 0.18 300)",
	lugares: "oklch(0.45 0.12 240)",
	places: "oklch(0.45 0.12 240)",
	animais: "oklch(0.48 0.12 60)",
	comida: "oklch(0.58 0.18 40)",
	food: "oklch(0.58 0.18 40)",
}

const CATEGORY_FALLBACK = "oklch(0.42 0.17 285)" // indigo-800

function resolveCategoryAccent(id: CategoryId | string | undefined): string {
	if (!id) return CATEGORY_FALLBACK
	const key = String(id).toLowerCase()
	return CATEGORY_ACCENTS[key] ?? CATEGORY_FALLBACK
}

/* ---------------- team color helpers ---------------- */

/**
 * Given a team color string (hex like `#ef4444`, any valid CSS color, or
 * undefined) return a pair `[primary, secondary]` suitable for `background-
 * color`. `secondary` is a lighter, slightly cooler sibling produced via
 * `color-mix` so we don't need to know the input color space.
 */
function buildTeamBlobs(teamColor: string | undefined): [string, string] {
	if (!teamColor) return [NEUTRAL_BLOB_1, NEUTRAL_BLOB_2]
	const primary = teamColor
	// Lighter / cooler sibling: mix toward a cool violet-white.
	const secondary = `color-mix(in oklch, ${teamColor} 55%, oklch(0.92 0.06 300))`
	return [primary, secondary]
}

/* ---------------- route detection ---------------- */

const GAMEPLAY_ROUTE_RE = /(^|\/)game\/(turn|play)(\/|$)/

function isGameplayRoute(pathname: string | null): boolean {
	if (!pathname) return false
	return GAMEPLAY_ROUTE_RE.test(pathname)
}

/* ---------------- component ---------------- */

export default function AmbientTint(): null {
	const pathname = usePathname()
	const gameplay = isGameplayRoute(pathname)

	// Only subscribe to the slices we actually consume so unrelated store
	// updates don't re-render (and re-run the effect) for nothing.
	const currentTeamId = useGameStore((s) => s.settings.selectedTeamIds[s.currentTeamIndex])
	const currentCategory = useGameStore((s) => s.currentWord?.category)
	const firstSelectedCategory = useGameStore((s) => s.settings.selectedCategories[0])
	const teamColor = useTeamStore((s) =>
		currentTeamId ? s.teams.find((t) => t.id === currentTeamId)?.color : undefined,
	)

	useEffect(() => {
		const root = typeof document !== "undefined" ? document.documentElement : null
		if (!root) return

		let blob1 = NEUTRAL_BLOB_1
		let blob2 = NEUTRAL_BLOB_2
		const blob3 = NEUTRAL_BLOB_3
		let categoryColor = NEUTRAL_CATEGORY

		if (gameplay) {
			try {
				const [primary, secondary] = buildTeamBlobs(teamColor)
				blob1 = primary
				blob2 = secondary
				const catId = currentCategory ?? firstSelectedCategory
				categoryColor = resolveCategoryAccent(catId)
			} catch {
				// Any unexpected shape → stay on the neutral palette.
				blob1 = NEUTRAL_BLOB_1
				blob2 = NEUTRAL_BLOB_2
				categoryColor = NEUTRAL_CATEGORY
			}
		}

		root.style.setProperty("--ambient-blob-1", blob1)
		root.style.setProperty("--ambient-blob-2", blob2)
		root.style.setProperty("--ambient-blob-3", blob3)
		root.style.setProperty("--ambient-blob-category", categoryColor)

		return () => {
			root.style.removeProperty("--ambient-blob-1")
			root.style.removeProperty("--ambient-blob-2")
			root.style.removeProperty("--ambient-blob-3")
			root.style.removeProperty("--ambient-blob-category")
		}
	}, [gameplay, teamColor, currentCategory, firstSelectedCategory])

	return null
}
