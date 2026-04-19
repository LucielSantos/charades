"use client"

import { Check, RotateCw, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { PlayResult } from "@/data/types"

interface ActionButtonsProps {
	onAction: (result: PlayResult) => void
	onRegenerate: () => void
}

export function ActionButtons({ onAction, onRegenerate }: ActionButtonsProps) {
	const t = useTranslations("play")

	return (
		<div className="flex gap-3">
			<Button
				size="lg"
				className="flex-1 h-14 bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
				onClick={onRegenerate}
			>
				<RotateCw className="mr-1 h-5 w-5" />
				{t("regenerate")}
			</Button>
			<Button
				size="lg"
				className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white font-bold"
				onClick={() => onAction("wrong")}
			>
				<X className="mr-1 h-5 w-5" />
				{t("wrong")}
			</Button>
			<Button
				size="lg"
				className="flex-1 h-14 bg-green-500 hover:bg-green-600 text-white font-bold"
				onClick={() => onAction("correct")}
			>
				<Check className="mr-1 h-5 w-5" />
				{t("correct")}
			</Button>
		</div>
	)
}
