"use client"

import { BookOpen, Briefcase, Clapperboard, PawPrint, Users, Zap } from "lucide-react"
import { useTranslations } from "next-intl"
import { categories } from "@/data/categories"
import type { CategoryId } from "@/data/types"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	PawPrint,
	Briefcase,
	BookOpen,
	Clapperboard,
	Zap,
	Users,
}

interface CategoryGridProps {
	selected: CategoryId[]
	onChange: (categories: CategoryId[]) => void
}

export function CategoryGrid({ selected, onChange }: CategoryGridProps) {
	const t = useTranslations()

	function toggleCategory(id: CategoryId) {
		if (selected.includes(id)) {
			if (selected.length <= 1) return
			onChange(selected.filter((c) => c !== id))
		} else {
			onChange([...selected, id])
		}
	}

	return (
		<div className="grid grid-cols-2 gap-3">
			{categories.map((cat) => {
				const Icon = iconMap[cat.icon]
				const isSelected = selected.includes(cat.id)
				return (
					<button
						key={cat.id}
						type="button"
						onClick={() => toggleCategory(cat.id)}
						className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
							isSelected
								? "border-indigo-500 bg-indigo-50 text-indigo-700"
								: "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
						}`}
					>
						{Icon && <Icon className="h-6 w-6" />}
						<span className="text-sm font-semibold">{t(cat.labelKey)}</span>
					</button>
				)
			})}
		</div>
	)
}
