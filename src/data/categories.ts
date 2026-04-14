import type { Category, CategoryId } from "./types"

export const categories: Category[] = [
	{ id: "animals", labelKey: "categories.animals", icon: "PawPrint" },
	{ id: "professions", labelKey: "categories.professions", icon: "Briefcase" },
	{ id: "bible", labelKey: "categories.bible", icon: "BookOpen" },
	{ id: "movies", labelKey: "categories.movies", icon: "Clapperboard" },
	{ id: "actions", labelKey: "categories.actions", icon: "Zap" },
	{ id: "characters", labelKey: "categories.characters", icon: "Users" },
]

export const allCategoryIds: CategoryId[] = categories.map((c) => c.id)
