# Configurar e sair do jogo na `/play` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar, na tela `/play`, um menu em sheet que permite alterar categorias/dificuldade/cronômetro ao vivo e oferecer duas ações de saída (voltar para home preservando o jogo, ou encerrar jogo zerando o estado).

**Architecture:** Novo botão `⋮` no header da `/play` abre um `Sheet` com duas seções (Configurar/Sair). Alterações em categorias e dificuldade são aplicadas imediatamente via nova action `updateSettings` no `game-store`, que re-sorteia a palavra corrente quando ela deixa de encaixar nos novos filtros (sem contar como `skipped`). Mudanças em `timerMode`/`timerSeconds` só valem a partir da próxima rodada — o `useTimer` trava o valor no `start()` via ref.

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Zustand (persist middleware), next-intl, Tailwind, base-ui (Sheet), lucide-react, Vitest.

**Spec:** `docs/superpowers/specs/2026-04-19-play-screen-configure-exit-design.md`

---

## Task ordering

- **Task 1, 2, 3** podem ser executadas em paralelo (sem dependência entre si).
- **Task 4** depende de 1 (usa `updateSettings`) e 3 (usa i18n keys).
- **Task 5** depende de 2 (timer ref) e 4 (componente do sheet).

---

## Task 1: Substituir `updateCategories` por `updateSettings` no `game-store`

**Files:**
- Modify: `src/stores/game-store.ts`
- Modify: `src/stores/__tests__/game-store.test.ts`
- Modify: `src/app/game/turn/page.tsx` (chamador — migrar pra nova API)

### Contexto

`updateCategories(categories)` existe no store e é usada em `/turn/page.tsx`. A spec pede uma action mais geral (`updateSettings(partial)`) que:
1. Aceite alterações em qualquer campo de `GameSettings`.
2. Ignore alterações que resultariam em `selectedCategories.length === 0`.
3. Se `currentWord` deixa de encaixar nos novos filtros (`selectedCategories`/`difficulty`), sorteia nova palavra sem incrementar `skipped`.
4. Reset do pool quando não houver palavras — com flag `poolWasReset: true`.
5. Mudanças em `timerMode`/`timerSeconds` não devem alterar `currentWord`.

Como `updateCategories` vira um caso particular de `updateSettings`, removemos a action antiga e migramos `/turn/page.tsx` no mesmo commit (senão o TS quebra).

### Steps

- [ ] **Step 1.1: Escrever testes falhos para `updateSettings`**

Substitua o bloco `describe("updateCategories", ...)` em `src/stores/__tests__/game-store.test.ts` (linhas 96-102) pelos testes abaixo. Mantenha todos os outros testes intactos.

```ts
	describe("updateSettings", () => {
		it("updates selected categories mid-game", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().updateSettings({ selectedCategories: ["animals", "actions"] })
			expect(useGameStore.getState().settings.selectedCategories).toEqual(["animals", "actions"])
		})

		it("updates difficulty mid-game", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().updateSettings({ difficulty: "medium" })
			expect(useGameStore.getState().settings.difficulty).toBe("medium")
		})

		it("updates timerSeconds without touching currentWord", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const wordBefore = useGameStore.getState().currentWord
			useGameStore.getState().updateSettings({ timerSeconds: 30 })
			expect(useGameStore.getState().settings.timerSeconds).toBe(30)
			expect(useGameStore.getState().currentWord).toEqual(wordBefore)
		})

		it("updates timerMode without touching currentWord", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const wordBefore = useGameStore.getState().currentWord
			useGameStore.getState().updateSettings({ timerMode: "unlimited" })
			expect(useGameStore.getState().settings.timerMode).toBe("unlimited")
			expect(useGameStore.getState().currentWord).toEqual(wordBefore)
		})

		it("keeps current word when it still fits new filters", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const before = useGameStore.getState().currentWord
			useGameStore.getState().updateSettings({ selectedCategories: ["animals", "actions"] })
			expect(useGameStore.getState().currentWord).toEqual(before)
		})

		it("re-draws word when category is removed, without incrementing skipped", () => {
			useGameStore
				.getState()
				.startGame({ ...defaultSettings, selectedCategories: ["animals", "actions"] })
			useGameStore.getState().drawWord()
			const before = useGameStore.getState().currentWord!
			const otherCategory = before.category === "animals" ? "actions" : "animals"
			useGameStore.getState().updateSettings({ selectedCategories: [otherCategory] })
			const after = useGameStore.getState().currentWord!
			expect(after.id).not.toBe(before.id)
			expect(after.category).toBe(otherCategory)
			expect(useGameStore.getState().teamStats["team-1"].skipped).toBe(0)
		})

		it("re-draws word when difficulty changes, without incrementing skipped", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const before = useGameStore.getState().currentWord!
			useGameStore.getState().updateSettings({ difficulty: "medium" })
			const after = useGameStore.getState().currentWord!
			expect(after.id).not.toBe(before.id)
			expect(after.difficulty).toBe("medium")
			expect(useGameStore.getState().teamStats["team-1"].skipped).toBe(0)
		})

		it("ignores update that would empty selectedCategories", () => {
			useGameStore.getState().startGame(defaultSettings)
			const before = useGameStore.getState().settings.selectedCategories
			useGameStore.getState().updateSettings({ selectedCategories: [] })
			expect(useGameStore.getState().settings.selectedCategories).toEqual(before)
		})
	})
```

- [ ] **Step 1.2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/stores/__tests__/game-store.test.ts`

Expected: Build/type error OR testes falham porque `updateSettings` não existe (e `updateCategories` foi removido do describe). A saída deve mencionar `updateSettings is not a function` ou erro de tipo.

- [ ] **Step 1.3: Implementar `updateSettings` e remover `updateCategories` em `src/stores/game-store.ts`**

Altere `src/stores/game-store.ts`:

No trecho da interface (linhas 6-17), substitua:
```ts
	updateCategories: (categories: CategoryId[]) => void
```
por:
```ts
	updateSettings: (partial: Partial<GameSettings>) => void
```

No corpo do `create`, substitua o bloco `updateCategories` (linhas 160-164) pelo seguinte bloco:

```ts
		updateSettings: (partial) => {
			const state = get()
			const nextSettings: GameSettings = { ...state.settings, ...partial }

			// Protege contra zero categorias
			if (nextSettings.selectedCategories.length === 0) return

			const categoriesChanged =
				partial.selectedCategories !== undefined &&
				(partial.selectedCategories.length !== state.settings.selectedCategories.length ||
					partial.selectedCategories.some((c) => !state.settings.selectedCategories.includes(c)))
			const difficultyChanged =
				partial.difficulty !== undefined && partial.difficulty !== state.settings.difficulty

			const word = state.currentWord
			const wordStillFits =
				!word ||
				(nextSettings.selectedCategories.includes(word.category) &&
					nextSettings.difficulty === word.difficulty)

			if (!categoriesChanged && !difficultyChanged) {
				set({ settings: nextSettings })
				return
			}

			if (wordStillFits) {
				set({ settings: nextSettings })
				return
			}

			// Palavra atual não encaixa mais — sorteia uma nova, sem contar como skipped.
			const usedWithoutCurrent = word
				? state.usedWordIds.filter((id) => id !== word.id)
				: state.usedWordIds

			let available = getAvailableWords(
				nextSettings.selectedCategories,
				nextSettings.difficulty,
				usedWithoutCurrent,
			)
			let resetPool = false

			if (available.length === 0) {
				available = getAvailableWords(
					nextSettings.selectedCategories,
					nextSettings.difficulty,
					[],
				)
				resetPool = true
			}

			if (available.length === 0) {
				// Nenhuma palavra possível nos novos filtros — aplica settings mesmo assim
				// e limpa currentWord para forçar redirect.
				set({
					settings: nextSettings,
					currentWord: null,
				})
				return
			}

			const newWord = pickRandomWord(available)
			const nextUsed = resetPool ? [newWord.id] : [...usedWithoutCurrent, newWord.id]

			set({
				settings: nextSettings,
				currentWord: newWord,
				usedWordIds: nextUsed,
				poolWasReset: resetPool,
			})
		},
```

- [ ] **Step 1.4: Migrar `src/app/game/turn/page.tsx` para a nova API**

Altere duas linhas:

Linha 20, de:
```ts
	const updateCategories = useGameStore((s) => s.updateCategories)
```
para:
```ts
	const updateSettings = useGameStore((s) => s.updateSettings)
```

Linha 95, de:
```tsx
						<CategoryGrid selected={selectedCategories} onChange={updateCategories} />
```
para:
```tsx
						<CategoryGrid
							selected={selectedCategories}
							onChange={(selectedCategories) => updateSettings({ selectedCategories })}
						/>
```

- [ ] **Step 1.5: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/stores/__tests__/game-store.test.ts`

Expected: todos os testes passam (incluindo os 8 novos em `updateSettings`, os 3 de `startGame`, etc.). Nenhum erro de tipo.

- [ ] **Step 1.6: Rodar o typecheck**

Run: `npx tsc --noEmit`

Expected: zero erros.

- [ ] **Step 1.7: Commit**

```bash
git add src/stores/game-store.ts src/stores/__tests__/game-store.test.ts src/app/game/turn/page.tsx
git commit -m "$(cat <<'EOF'
refactor(game-store): replace updateCategories with updateSettings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Travar `seconds`/`mode` do `useTimer` durante execução

**Files:**
- Modify: `src/hooks/use-timer.ts`
- Modify: `src/hooks/__tests__/use-timer.test.ts`

### Contexto

Hoje o hook usa `seconds` direto como initial state (`useState(seconds)`) e deriva `pressurePhase` a partir do prop `mode`. Se a página `/play` alterar `settings.timerSeconds` no meio da rodada, a página re-renderiza com novos props — **não** reinicia o `timeLeft` (porque `useState` só usa o initial no mount), mas o `pressurePhase` passa a ler o novo `mode` e poderia classificar errado.

Para o design: uma vez que `start()` seja chamado, o hook deve travar `seconds` e `mode` em uma ref — alterações posteriores dos props só valem no próximo `start()` (ou `reset()`). Antes de o usuário clicar start, mudanças nos props continuam aplicando normalmente (hidrata o `timeLeft` inicial).

### Steps

- [ ] **Step 2.1: Escrever testes falhos**

Adicione um novo `describe` dentro do describe externo `"useTimer"` em `src/hooks/__tests__/use-timer.test.ts`, logo depois do `describe("unlimited mode", ...)` (por volta da linha 93):

```ts
	describe("locked config per run", () => {
		it("does not reset timeLeft when seconds prop changes mid-run", () => {
			const { result, rerender } = renderHook(
				({ seconds }) => useTimer({ mode: "countdown", seconds }),
				{ initialProps: { seconds: 60 } },
			)
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(3000))
			expect(result.current.timeLeft).toBe(57)

			rerender({ seconds: 30 })
			expect(result.current.timeLeft).toBe(57)

			act(() => vi.advanceTimersByTime(1000))
			expect(result.current.timeLeft).toBe(56)
		})

		it("uses the latest seconds prop on next reset+start", () => {
			const { result, rerender } = renderHook(
				({ seconds }) => useTimer({ mode: "countdown", seconds }),
				{ initialProps: { seconds: 60 } },
			)
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(5000))

			rerender({ seconds: 30 })
			act(() => result.current.reset())
			expect(result.current.timeLeft).toBe(30)

			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(1000))
			expect(result.current.timeLeft).toBe(29)
		})

		it("locks mode at start — switching prop mid-run does not change interval behavior", () => {
			const { result, rerender } = renderHook(
				({ mode }) => useTimer({ mode, seconds: 60 }),
				{ initialProps: { mode: "countdown" as const } },
			)
			act(() => result.current.start())
			act(() => vi.advanceTimersByTime(2000))
			expect(result.current.timeLeft).toBe(58)

			rerender({ mode: "unlimited" as const })
			act(() => vi.advanceTimersByTime(3000))
			// Still counting down, not switched to elapsed.
			expect(result.current.timeLeft).toBe(55)
		})
	})
```

- [ ] **Step 2.2: Rodar os testes e confirmar que falham**

Run: `npx vitest run src/hooks/__tests__/use-timer.test.ts`

Expected: ao menos o 3º teste falha (mode não está travado — o `useEffect` reage a `mode` novo e muda comportamento). O 1º pode já passar acidentalmente (initial state só roda uma vez), mas a trava explícita garante o 3º.

- [ ] **Step 2.3: Implementar a trava**

Reescreva `src/hooks/use-timer.ts` inteiro:

```ts
import { useCallback, useEffect, useRef, useState } from "react"
import type { TimerMode } from "@/data/types"

export type PressurePhase = "none" | "low" | "medium" | "high"

interface UseTimerOptions {
	mode: TimerMode
	seconds: number
}

interface UseTimerReturn {
	timeLeft: number
	elapsed: number
	displayTime: string
	isRunning: boolean
	isExpired: boolean
	pressurePhase: PressurePhase
	start: () => void
	pause: () => void
	reset: () => void
}

function formatTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function getPressurePhase(timeLeft: number, mode: TimerMode): PressurePhase {
	if (mode === "unlimited") return "none"
	if (timeLeft <= 2) return "high"
	if (timeLeft <= 5) return "medium"
	if (timeLeft <= 10) return "low"
	return "none"
}

export function useTimer({ mode, seconds }: UseTimerOptions): UseTimerReturn {
	const [timeLeft, setTimeLeft] = useState(seconds)
	const [elapsed, setElapsed] = useState(0)
	const [isRunning, setIsRunning] = useState(false)
	const [isExpired, setIsExpired] = useState(false)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	// Latest values from props (read by start/reset when they fire).
	const latestSecondsRef = useRef(seconds)
	const latestModeRef = useRef(mode)
	useEffect(() => {
		latestSecondsRef.current = seconds
	}, [seconds])
	useEffect(() => {
		latestModeRef.current = mode
	}, [mode])

	// Active run values — frozen at start()/reset(). The interval only reads these.
	const activeModeRef = useRef<TimerMode>(mode)
	const [activeMode, setActiveMode] = useState<TimerMode>(mode)

	const clearTimer = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			intervalRef.current = null
		}
	}, [])

	const start = useCallback(() => {
		if (isExpired) return
		activeModeRef.current = latestModeRef.current
		setActiveMode(latestModeRef.current)
		setIsRunning(true)
	}, [isExpired])

	const pause = useCallback(() => {
		setIsRunning(false)
		clearTimer()
	}, [clearTimer])

	const reset = useCallback(() => {
		clearTimer()
		const freshSeconds = latestSecondsRef.current
		const freshMode = latestModeRef.current
		activeModeRef.current = freshMode
		setActiveMode(freshMode)
		setTimeLeft(freshSeconds)
		setElapsed(0)
		setIsRunning(false)
		setIsExpired(false)
	}, [clearTimer])

	useEffect(() => {
		if (!isRunning) {
			clearTimer()
			return
		}

		intervalRef.current = setInterval(() => {
			if (activeModeRef.current === "countdown") {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setIsRunning(false)
						setIsExpired(true)
						return 0
					}
					return prev - 1
				})
			} else {
				setElapsed((prev) => prev + 1)
			}
		}, 1000)

		return clearTimer
	}, [isRunning, clearTimer])

	// If the timer has never started and the `seconds` prop changes, keep the
	// displayed initial value in sync (so the setup screen preview stays fresh).
	useEffect(() => {
		if (!isRunning && !isExpired && elapsed === 0) {
			setTimeLeft(seconds)
		}
	}, [seconds, isRunning, isExpired, elapsed])

	const displaySeconds = activeMode === "countdown" ? timeLeft : elapsed
	const displayTime = formatTime(displaySeconds)
	const pressurePhase = getPressurePhase(timeLeft, activeMode)

	return {
		timeLeft,
		elapsed,
		displayTime,
		isRunning,
		isExpired,
		pressurePhase,
		start,
		pause,
		reset,
	}
}
```

- [ ] **Step 2.4: Rodar os testes e confirmar que passam**

Run: `npx vitest run src/hooks/__tests__/use-timer.test.ts`

Expected: todos os testes passam, incluindo os 3 novos em `"locked config per run"` e os existentes (count-down, unlimited, pressure, pause/resume, reset).

- [ ] **Step 2.5: Commit**

```bash
git add src/hooks/use-timer.ts src/hooks/__tests__/use-timer.test.ts
git commit -m "$(cat <<'EOF'
refactor(use-timer): freeze mode and seconds for each run

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Adicionar strings i18n

**Files:**
- Modify: `src/messages/pt-BR.json`

### Contexto

Precisamos de chaves novas para o menu da `/play`: título do sheet, rótulos de seções e botões de sair, e uma chave de confirmação de "encerrar jogo". Reaproveitamos textos existentes do `ranking` quando possível (mas criamos aliases sob `play` para manter os componentes independentes).

### Steps

- [ ] **Step 3.1: Adicionar chaves em `src/messages/pt-BR.json`**

Dentro do bloco `"play": { ... }` (linhas 57-66), adicione as chaves abaixo antes do `}` de fechamento:

```json
		"menu": "Menu",
		"configure": "Configurar",
		"exit": "Sair",
		"exitHome": "Voltar para home",
		"endGame": "Encerrar jogo",
		"endGameConfirm": "Tem certeza? O placar sera apagado.",
		"close": "Fechar",
		"categories": "Categorias",
		"difficulty": "Dificuldade",
		"timer": "Cronometro",
		"timerNote": "A mudanca de cronometro vale a partir da proxima rodada"
```

Observação: cada chave deve estar separada por vírgula da anterior; a última chave do bloco (antes do `}`) NÃO leva vírgula.

O bloco `play` final deve ficar assim (para referência — substitua o bloco inteiro):

```json
	"play": {
		"round": "Rodada {round}",
		"timeUp": "Tempo!",
		"regenerate": "Trocar",
		"wrong": "Errou",
		"correct": "Acertou",
		"hideWord": "Esconder palavra",
		"showWord": "Mostrar palavra",
		"start": "Iniciar",
		"menu": "Menu",
		"configure": "Configurar",
		"exit": "Sair",
		"exitHome": "Voltar para home",
		"endGame": "Encerrar jogo",
		"endGameConfirm": "Tem certeza? O placar sera apagado.",
		"close": "Fechar",
		"categories": "Categorias",
		"difficulty": "Dificuldade",
		"timer": "Cronometro",
		"timerNote": "A mudanca de cronometro vale a partir da proxima rodada"
	},
```

- [ ] **Step 3.2: Validar JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/messages/pt-BR.json','utf8')); console.log('ok')"`

Expected: `ok`.

- [ ] **Step 3.3: Commit**

```bash
git add src/messages/pt-BR.json
git commit -m "$(cat <<'EOF'
i18n: add play menu strings for configure and exit sheet

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Criar `PlayMenuSheet`

**Files:**
- Create: `src/components/game/play-menu-sheet.tsx`

### Contexto

Componente do sheet com duas seções:
1. **Configurar** — `CategoryGrid` + toggles de dificuldade + toggles de cronômetro, todos ligados ao `game-store` via `updateSettings`.
2. **Sair** — botões "Voltar para home" e "Encerrar jogo"; o segundo abre um `Dialog` de confirmação interno.

O componente é self-contained: recebe `open/onOpenChange` e dispara callbacks `onExitHome`/`onEndGame` para a página decidir o roteamento.

**Padrão do projeto:** `/turn/page.tsx` usa `side="bottom"` no `SheetContent`. Seguimos o mesmo padrão para consistência (sem responsive à direita por enquanto).

### Steps

- [ ] **Step 4.1: Criar o arquivo `src/components/game/play-menu-sheet.tsx`**

Conteúdo completo:

```tsx
"use client"

import { Home, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { CategoryGrid } from "@/components/game/category-grid"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import type { Difficulty, TimerMode } from "@/data/types"
import { useGameStore } from "@/stores/game-store"

interface PlayMenuSheetProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onExitHome: () => void
	onEndGame: () => void
}

const TIMER_OPTIONS = [30, 60, 90]

export function PlayMenuSheet({
	open,
	onOpenChange,
	onExitHome,
	onEndGame,
}: PlayMenuSheetProps) {
	const t = useTranslations("play")
	const tSetup = useTranslations("setup")
	const tc = useTranslations("common")

	const settings = useGameStore((s) => s.settings)
	const updateSettings = useGameStore((s) => s.updateSettings)

	const [confirmEndOpen, setConfirmEndOpen] = useState(false)

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
					<SheetHeader>
						<SheetTitle>{t("menu")}</SheetTitle>
					</SheetHeader>

					<section className="py-2">
						<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
							{t("configure")}
						</h2>

						<div className="mb-4">
							<p className="text-xs font-semibold text-gray-500 mb-2">{t("categories")}</p>
							<CategoryGrid
								selected={settings.selectedCategories}
								onChange={(selectedCategories) => updateSettings({ selectedCategories })}
							/>
						</div>

						<div className="mb-4">
							<p className="text-xs font-semibold text-gray-500 mb-2">{t("difficulty")}</p>
							<div className="flex gap-2">
								{(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
									<button
										key={d}
										type="button"
										onClick={() => updateSettings({ difficulty: d })}
										className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
											settings.difficulty === d
												? "bg-indigo-600 text-white shadow-md"
												: "bg-white text-gray-600 border border-gray-200"
										}`}
									>
										{tSetup(d)}
									</button>
								))}
							</div>
						</div>

						<div className="mb-2">
							<p className="text-xs font-semibold text-gray-500 mb-2">{t("timer")}</p>
							<div className="flex gap-2 mb-2">
								{(["countdown", "unlimited"] as TimerMode[]).map((m) => (
									<button
										key={m}
										type="button"
										onClick={() => updateSettings({ timerMode: m })}
										className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
											settings.timerMode === m
												? "bg-indigo-600 text-white shadow-md"
												: "bg-white text-gray-600 border border-gray-200"
										}`}
									>
										{tSetup(m)}
									</button>
								))}
							</div>
							{settings.timerMode === "countdown" && (
								<div className="flex gap-2">
									{TIMER_OPTIONS.map((s) => (
										<button
											key={s}
											type="button"
											onClick={() => updateSettings({ timerSeconds: s })}
											className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
												settings.timerSeconds === s
													? "bg-indigo-500 text-white"
													: "bg-white text-gray-600 border border-gray-200"
											}`}
										>
											{tSetup("seconds", { seconds: s })}
										</button>
									))}
								</div>
							)}
							<p className="text-xs text-gray-400 mt-2">{t("timerNote")}</p>
						</div>
					</section>

					<Separator className="my-4" />

					<section className="pb-2">
						<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
							{t("exit")}
						</h2>
						<div className="flex flex-col gap-2">
							<Button variant="outline" className="w-full h-12" onClick={onExitHome}>
								<Home className="mr-2 h-4 w-4" />
								{t("exitHome")}
							</Button>
							<Button
								variant="destructive"
								className="w-full h-12"
								onClick={() => setConfirmEndOpen(true)}
							>
								<LogOut className="mr-2 h-4 w-4" />
								{t("endGame")}
							</Button>
						</div>
					</section>

					<Button className="w-full mt-4" onClick={() => onOpenChange(false)}>
						{t("close")}
					</Button>
				</SheetContent>
			</Sheet>

			<Dialog open={confirmEndOpen} onOpenChange={setConfirmEndOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("endGame")}</DialogTitle>
						<DialogDescription>{t("endGameConfirm")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmEndOpen(false)}>
							{tc("cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								setConfirmEndOpen(false)
								onEndGame()
							}}
						>
							{t("endGame")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
```

- [ ] **Step 4.2: Rodar typecheck**

Run: `npx tsc --noEmit`

Expected: zero erros.

- [ ] **Step 4.3: Rodar testes (garantir que nada quebrou)**

Run: `npx vitest run`

Expected: todos passam.

- [ ] **Step 4.4: Commit**

```bash
git add src/components/game/play-menu-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(play): add PlayMenuSheet with configure and exit sections

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Integrar o menu na `/play`

**Files:**
- Modify: `src/app/game/play/page.tsx`

### Contexto

Adicionar:
1. Botão `⋮` (lucide `EllipsisVertical`) no header à direita do mute.
2. Estado `menuOpen` controlando o sheet.
3. Efeito que pausa o timer quando o sheet abre e retoma se estava rodando.
4. Handlers `handleExitHome` (`router.push("/")`) e `handleEndGame` (`resetGame() → router.push("/")`).

### Steps

- [ ] **Step 5.1: Rescrever `src/app/game/play/page.tsx` com a integração**

Substitua o arquivo inteiro pelo conteúdo abaixo. Mudanças em relação ao atual:
- Importa `EllipsisVertical` e `PlayMenuSheet`.
- Importa `resetGame` do store.
- Estado `menuOpen` + ref `wasRunningRef` para pausa/retomada.
- Botão `⋮` no header.
- Handlers `handleExitHome`, `handleEndGame`.
- Effect que reage a `menuOpen`.

```tsx
"use client"

import { EllipsisVertical, Play, Volume2, VolumeX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ActionButtons } from "@/components/game/action-buttons"
import { PlayMenuSheet } from "@/components/game/play-menu-sheet"
import { TimerDisplay } from "@/components/game/timer-display"
import { WordDisplay } from "@/components/game/word-display"
import { Button } from "@/components/ui/button"
import type { PlayResult } from "@/data/types"
import { usePressure } from "@/hooks/use-pressure"
import { useTimer } from "@/hooks/use-timer"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"

export default function GamePlayPage() {
	const t = useTranslations("play")
	const tToast = useTranslations("toast")
	const router = useRouter()

	const currentWord = useGameStore((s) => s.currentWord)
	const settings = useGameStore((s) => s.settings)
	const getCurrentTeamId = useGameStore((s) => s.getCurrentTeamId)
	const getRoundNumber = useGameStore((s) => s.getRoundNumber)
	const submitResult = useGameStore((s) => s.submitResult)
	const regenerateWord = useGameStore((s) => s.regenerateWord)
	const resetGame = useGameStore((s) => s.resetGame)
	const poolWasReset = useGameStore((s) => s.poolWasReset)
	const clearPoolResetFlag = useGameStore((s) => s.clearPoolResetFlag)
	const getTeamById = useTeamStore((s) => s.getTeamById)

	const [muted, setMuted] = useState(false)
	const [hydrated, setHydrated] = useState(false)
	const [hasStarted, setHasStarted] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	const wasRunningRef = useRef(false)

	useEffect(() => setHydrated(true), [])

	const team = getTeamById(getCurrentTeamId())
	const roundNumber = getRoundNumber()

	const timer = useTimer({
		mode: settings.timerMode,
		seconds: settings.timerSeconds,
	})

	usePressure({
		pressurePhase: timer.pressurePhase,
		isRunning: timer.isRunning,
		muted,
	})

	useEffect(() => {
		return () => timer.pause()
	}, [timer.pause])

	// Pausa o cronômetro ao abrir o menu; retoma ao fechar se estava rodando.
	useEffect(() => {
		if (menuOpen) {
			wasRunningRef.current = timer.isRunning
			if (timer.isRunning) timer.pause()
		} else if (wasRunningRef.current) {
			wasRunningRef.current = false
			timer.start()
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only reacts to menuOpen
	}, [menuOpen])

	function handleStart() {
		setHasStarted(true)
		timer.start()
	}

	useEffect(() => {
		if (poolWasReset) {
			toast(tToast("wordsReset"))
			clearPoolResetFlag()
		}
	}, [poolWasReset, clearPoolResetFlag, tToast])

	function handleAction(result: PlayResult) {
		timer.pause()
		submitResult(result)
		router.push("/game/result")
	}

	function handleRegenerate() {
		regenerateWord()
	}

	function handleExitHome() {
		timer.pause()
		wasRunningRef.current = false
		setMenuOpen(false)
		router.push("/")
	}

	function handleEndGame() {
		timer.pause()
		wasRunningRef.current = false
		setMenuOpen(false)
		resetGame()
		router.push("/")
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: only redirect on initial hydration
	useEffect(() => {
		if (hydrated && (!currentWord || !team)) router.push("/game/turn")
	}, [hydrated])

	if (!hydrated || !currentWord || !team) return null

	return (
		<div className="flex flex-col min-h-screen px-6 py-8 relative">
			{/* Pressure overlay */}
			{timer.pressurePhase !== "none" && (
				<div
					className={`fixed inset-0 pointer-events-none transition-opacity z-10 ${
						timer.pressurePhase === "low"
							? "bg-red-500/5"
							: timer.pressurePhase === "medium"
								? "bg-red-500/10"
								: "bg-red-500/20"
					}`}
				/>
			)}

			{/* Header */}
			<div className="flex items-center justify-between mb-8 relative z-20">
				<div className="flex items-center gap-2">
					<div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
					<span className="font-semibold text-gray-700">{team.name}</span>
				</div>
				<span className="text-sm text-gray-500">{t("round", { round: roundNumber })}</span>
				<div className="flex items-center gap-2">
					<button type="button" onClick={() => setMuted(!muted)} className="text-gray-500">
						{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
					</button>
					<button
						type="button"
						onClick={() => setMenuOpen(true)}
						className="text-gray-500"
						aria-label={t("menu")}
					>
						<EllipsisVertical className="h-5 w-5" />
					</button>
				</div>
			</div>

			{/* Timer */}
			<div className="mb-8 relative z-20">
				{hasStarted ? (
					<TimerDisplay
						displayTime={timer.displayTime}
						pressurePhase={timer.pressurePhase}
						isExpired={timer.isExpired}
					/>
				) : (
					<Button
						size="lg"
						className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-bold"
						onClick={handleStart}
					>
						<Play className="mr-2 h-5 w-5" />
						{t("start")}
					</Button>
				)}
			</div>

			{/* Word */}
			<div className="flex-1 flex items-center justify-center relative z-20">
				<WordDisplay
					word={currentWord.text}
					category={currentWord.category}
					difficulty={currentWord.difficulty}
				/>
			</div>

			{/* Actions */}
			<div className="relative z-20 pb-4">
				<ActionButtons
					onAction={handleAction}
					onRegenerate={handleRegenerate}
					disabled={!hasStarted}
					regenerateDisabled={hasStarted}
				/>
			</div>

			<PlayMenuSheet
				open={menuOpen}
				onOpenChange={setMenuOpen}
				onExitHome={handleExitHome}
				onEndGame={handleEndGame}
			/>
		</div>
	)
}
```

- [ ] **Step 5.2: Rodar typecheck**

Run: `npx tsc --noEmit`

Expected: zero erros.

- [ ] **Step 5.3: Rodar todos os testes**

Run: `npx vitest run`

Expected: todos passam.

- [ ] **Step 5.4: Verificação manual no navegador**

Run: `npm run dev` (em background se preferir).

Manualmente, abra `http://localhost:3000`, vá em "Novo Jogo", configure 2 times e categorias, inicie o jogo, entre na `/play`. Teste:

1. Clicar `⋮` abre o sheet. Cronômetro pausa (observe o display parado).
2. Fechar o sheet retoma o cronômetro.
3. Abrir o sheet, mudar dificuldade — se a palavra atual não encaixar, ela troca automaticamente; o contador "Trocadas" do time **não** deve subir.
4. Abrir o sheet, tirar uma categoria — mesma coisa.
5. Mudar cronômetro para 30s — tempo visível no cronômetro da rodada atual **não** muda. Próxima rodada já usa 30s.
6. Clicar "Voltar para home" leva para home, botão "Continuar Jogo" aparece e leva de volta para `/game/turn`.
7. Clicar "Encerrar jogo" → confirmar → volta para home, botão "Continuar Jogo" **não** aparece mais.

Se tudo ok, mate o dev server.

- [ ] **Step 5.5: Commit**

```bash
git add src/app/game/play/page.tsx
git commit -m "$(cat <<'EOF'
feat(play): add options menu with configure and exit actions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review (scratch)

- **Spec coverage:**
  - Botão ⋮ no header → Task 5 ✓
  - Sheet com Configurar/Sair → Task 4 ✓
  - `updateSettings` + re-sorteio sem skipped → Task 1 ✓
  - Timer travado durante run → Task 2 ✓
  - Pausa/retoma ao abrir/fechar sheet → Task 5 ✓
  - "Voltar para home" preservando estado → Task 5 (`handleExitHome`) ✓
  - "Encerrar jogo" com confirmação + resetGame → Task 4 (dialog) + Task 5 (handler) ✓
  - i18n keys → Task 3 ✓
  - Testes do store e do timer → Tasks 1 e 2 ✓

- **Placeholders:** nenhum TBD/TODO.

- **Type consistency:** `updateSettings(partial: Partial<GameSettings>)` é consistente entre store, chamador em `/turn`, e chamador em `PlayMenuSheet`. Callbacks `onExitHome`/`onEndGame` iguais em ambos os lados.

- **Escopo:** simples e focado; cabe num plano só.
