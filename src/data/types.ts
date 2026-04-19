export type CategoryId = "animals" | "professions" | "bible" | "movies" | "actions" | "characters"

export type Difficulty = "easy" | "medium" | "hard"

export type TimerMode = "countdown" | "unlimited"

export type PlayResult = "correct" | "wrong"

export type GameStatus = "idle" | "setup" | "playing" | "paused"

export interface Team {
	id: string
	name: string
	color: string
}

export interface Word {
	id: string
	text: string
	category: CategoryId
	difficulty: Difficulty
}

export interface Category {
	id: CategoryId
	labelKey: string
	icon: string
}

export interface GameSettings {
	selectedTeamIds: string[]
	selectedCategories: CategoryId[]
	difficulty: Difficulty
	timerMode: TimerMode
	timerSeconds: number
}

export interface TeamStats {
	correct: number
	wrong: number
	skipped: number
}

export interface GameState {
	status: GameStatus
	settings: GameSettings
	currentTeamIndex: number
	currentWord: Word | null
	usedWordIds: string[]
	teamStats: Record<string, TeamStats>
	lastResult: PlayResult | null
	lastWord: Word | null
	poolWasReset: boolean
}
