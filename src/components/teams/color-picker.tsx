"use client"

import { teamColors } from "@/data/colors"
import { Check } from "lucide-react"

interface ColorPickerProps {
  selected: string
  usedColors: string[]
  onChange: (color: string) => void
}

export function ColorPicker({ selected, usedColors, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {teamColors.map((color) => {
        const isUsed = usedColors.includes(color.hex) && color.hex !== selected
        const isSelected = color.hex === selected
        return (
          <button
            key={color.hex}
            type="button"
            disabled={isUsed}
            onClick={() => onChange(color.hex)}
            className={`relative h-10 w-10 rounded-full transition-all ${
              isUsed ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-110"
            } ${isSelected ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          >
            {isSelected && (
              <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />
            )}
          </button>
        )
      })}
    </div>
  )
}
