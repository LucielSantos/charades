# Regenerar Palavra — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o botão "Pular" na tela de jogada por uma ação "Trocar palavra" que sorteia outra palavra sem encerrar a jogada, incrementando o contador `skipped` do time (renomeado para "Trocadas" na UI).

**Architecture:** Adicionar uma nova ação `regenerateWord` no Zustand store que re-sorteia `currentWord` dentro da mesma jogada, volta a palavra descartada ao pool, incrementa o contador de trocas do time atual e não avança o turno. A UI passa a chamar essa ação em vez de `submitResult("skipped")`. O valor `"skipped"` sai do union type `PlayResult` — trocas não são mais um resultado de jogada.

**Tech Stack:** Next.js 16 (App Router), React 19, Zustand 5, next-intl, vitest, biome, lucide-react, tailwind.

**Spec:** [docs/superpowers/specs/2026-04-19-regenerate-word-design.md](../specs/2026-04-19-regenerate-word-design.md)

---

### Task 1: Adicionar testes de `regenerateWord` ao store

**Files:**
- Modify: `src/stores/__tests__/game-store.test.ts`

- [ ] **Step 1: Adicionar describe block para `regenerateWord` no final do arquivo de teste (antes do fechamento do describe externo)**

Adicione o seguinte bloco logo após o describe `"getRoundNumber"`:

```typescript
	describe("regenerateWord", () => {
		it("replaces current word with a different word", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const firstWord = useGameStore.getState().currentWord!
			useGameStore.getState().regenerateWord()
			const newWord = useGameStore.getState().currentWord!
			expect(newWord).not.toBeNull()
			expect(newWord.id).not.toBe(firstWord.id)
		})

		it("increments skipped counter for current team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			const stats = useGameStore.getState().teamStats["team-1"]
			expect(stats.skipped).toBe(1)
		})

		it("does not advance to next team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			expect(useGameStore.getState().currentTeamIndex).toBe(0)
		})

		it("returns discarded word to the pool (available for future draws)", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			const discarded = useGameStore.getState().currentWord!
			useGameStore.getState().regenerateWord()
			// Após regenerar, o id descartado NÃO deve estar em usedWordIds
			expect(useGameStore.getState().usedWordIds).not.toContain(discarded.id)
		})

		it("keeps new word in usedWordIds so it is not redrawn again", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			const newWordId = useGameStore.getState().currentWord!.id
			expect(useGameStore.getState().usedWordIds).toContain(newWordId)
		})

		it("always leaves a non-null currentWord after regenerate", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().regenerateWord()
			expect(useGameStore.getState().currentWord).not.toBeNull()
		})
	})
```

- [ ] **Step 2: Rodar os testes para verificar que os novos testes falham**

Run: `yarn test src/stores/__tests__/game-store.test.ts`
Expected: Falha com "regenerateWord is not a function" ou erro de tipo TypeScript em `regenerateWord`.

- [ ] **Step 3: Commit**

```bash
git add src/stores/__tests__/game-store.test.ts
git commit -m "test: add failing tests for regenerateWord action"
```

---

### Task 2: Implementar `regenerateWord` e remover `"skipped"` do `PlayResult`

**Files:**
- Modify: `src/data/types.ts`
- Modify: `src/stores/game-store.ts`
- Modify: `src/stores/__tests__/game-store.test.ts` (remover teste de `submitResult("skipped")`)

- [ ] **Step 1: Remover `"skipped"` do union `PlayResult` em `src/data/types.ts`**

Altere a linha:

```typescript
export type PlayResult = "correct" | "wrong" | "skipped"
```

Para:

```typescript
export type PlayResult = "correct" | "wrong"
```

**Importante:** o campo `TeamStats.skipped` permanece inalterado — ele agora representa palavras trocadas, não puladas.

- [ ] **Step 2: Adicionar `regenerateWord` ao `GameStore` interface em `src/stores/game-store.ts`**

Em `interface GameStore extends GameState`, adicione `regenerateWord: () => void` logo após `drawWord`:

```typescript
interface GameStore extends GameState {
	startGame: (settings: GameSettings) => void
	drawWord: () => void
	regenerateWord: () => void
	submitResult: (result: PlayResult) => void
	updateCategories: (categories: CategoryId[]) => void
	resetGame: () => void
	getCurrentTeamId: () => string
	getNextTeamId: () => string
	getRoundNumber: () => number
	clearPoolResetFlag: () => void
}
```

- [ ] **Step 3: Implementar `regenerateWord` no store**

No objeto criado pelo `create<GameStore>()`, adicione a ação `regenerateWord` logo após `drawWord`:

```typescript
regenerateWord: () => {
	const { settings, usedWordIds, currentWord, currentTeamIndex, teamStats } = get()
	if (!currentWord) return

	const teamId = settings.selectedTeamIds[currentTeamIndex]
	const currentStats = teamStats[teamId]

	const usedWithoutCurrent = usedWordIds.filter((id) => id !== currentWord.id)

	let available = getAvailableWords(
		settings.selectedCategories,
		settings.difficulty,
		usedWithoutCurrent,
	).filter((w) => w.id !== currentWord.id)

	let resetPool = false
	if (available.length === 0) {
		available = getAvailableWords(settings.selectedCategories, settings.difficulty, []).filter(
			(w) => w.id !== currentWord.id,
		)
		resetPool = true
	}

	if (available.length === 0) return

	const newWord = pickRandomWord(available)
	const nextUsed = resetPool ? [newWord.id] : [...usedWithoutCurrent, newWord.id]

	set({
		currentWord: newWord,
		usedWordIds: nextUsed,
		teamStats: {
			...teamStats,
			[teamId]: { ...currentStats, skipped: currentStats.skipped + 1 },
		},
		poolWasReset: resetPool,
	})
},
```

- [ ] **Step 4: Remover tratamento de `"skipped"` em `submitResult`**

No método `submitResult`, remover a linha `else if (result === "skipped") updatedStats.skipped += 1`. O método fica:

```typescript
submitResult: (result) => {
	const { settings, currentTeamIndex, currentWord, teamStats } = get()
	const teamId = settings.selectedTeamIds[currentTeamIndex]
	const currentStats = teamStats[teamId]

	const updatedStats = { ...currentStats }
	if (result === "correct") updatedStats.correct += 1
	else if (result === "wrong") updatedStats.wrong += 1

	const nextIndex = (currentTeamIndex + 1) % settings.selectedTeamIds.length

	set({
		teamStats: { ...teamStats, [teamId]: updatedStats },
		currentTeamIndex: nextIndex,
		lastResult: result,
		lastWord: currentWord,
		currentWord: null,
	})
},
```

- [ ] **Step 5: Remover o teste obsoleto de `submitResult("skipped")` em `src/stores/__tests__/game-store.test.ts`**

Apague o bloco inteiro:

```typescript
		it("records skipped for current team", () => {
			useGameStore.getState().startGame(defaultSettings)
			useGameStore.getState().drawWord()
			useGameStore.getState().submitResult("skipped")
			const stats = useGameStore.getState().teamStats["team-1"]
			expect(stats.skipped).toBe(1)
		})
```

- [ ] **Step 6: Rodar os testes e confirmar que todos passam**

Run: `yarn test src/stores/__tests__/game-store.test.ts`
Expected: PASS (todos os testes de `regenerateWord` + testes existentes ainda verdes).

- [ ] **Step 7: Commit**

```bash
git add src/data/types.ts src/stores/game-store.ts src/stores/__tests__/game-store.test.ts
git commit -m "feat(store): add regenerateWord action and remove skipped from PlayResult"
```

---

### Task 3: Atualizar `ActionButtons` para usar `onRegenerate`

**Files:**
- Modify: `src/components/game/action-buttons.tsx`

- [ ] **Step 1: Substituir o conteúdo inteiro do arquivo**

Novo conteúdo:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/action-buttons.tsx
git commit -m "feat(ui): replace skip button with regenerate button in ActionButtons"
```

---

### Task 4: Atualizar `play/page.tsx` para chamar `regenerateWord`

**Files:**
- Modify: `src/app/game/play/page.tsx`

- [ ] **Step 1: Selecionar a ação `regenerateWord` do store**

Adicione esta linha logo após a linha `const submitResult = useGameStore((s) => s.submitResult)`:

```typescript
	const regenerateWord = useGameStore((s) => s.regenerateWord)
```

- [ ] **Step 2: Adicionar o handler `handleRegenerate`**

Adicione a função logo abaixo de `handleAction`:

```typescript
	function handleRegenerate() {
		regenerateWord()
	}
```

- [ ] **Step 3: Passar a prop `onRegenerate` ao `ActionButtons`**

Altere:

```tsx
<ActionButtons onAction={handleAction} />
```

Para:

```tsx
<ActionButtons onAction={handleAction} onRegenerate={handleRegenerate} />
```

- [ ] **Step 4: Commit**

```bash
git add src/app/game/play/page.tsx
git commit -m "feat(play): wire regenerate button to regenerateWord action"
```

---

### Task 5: Limpar entrada `skipped` em `result/page.tsx`

**Files:**
- Modify: `src/app/game/result/page.tsx`

- [ ] **Step 1: Remover a entrada `skipped` do `resultConfig` e o import de `ArrowRight`**

Altere a declaração de `resultConfig` para:

```tsx
const resultConfig: Record<
	PlayResult,
	{
		gradient: string
		icon: React.ComponentType<{ className?: string }>
		labelKey: string
	}
> = {
	correct: {
		gradient: "from-green-400 to-emerald-500",
		icon: Check,
		labelKey: "result.correct",
	},
	wrong: {
		gradient: "from-red-400 to-rose-500",
		icon: X,
		labelKey: "result.wrong",
	},
}
```

E altere o import:

```tsx
import { ArrowRight, Check, X } from "lucide-react"
```

Para:

```tsx
import { Check, X } from "lucide-react"
```

- [ ] **Step 2: Rodar `yarn build` para verificar ausência de erros de TypeScript**

Run: `yarn build`
Expected: Build concluído sem erros. `PlayResult` agora é `"correct" | "wrong"` e o `Record<PlayResult, ...>` está completo.

- [ ] **Step 3: Commit**

```bash
git add src/app/game/result/page.tsx
git commit -m "feat(result): remove skipped result config entry"
```

---

### Task 6: Atualizar traduções `pt-BR.json`

**Files:**
- Modify: `src/messages/pt-BR.json`

- [ ] **Step 1: Atualizar o bloco `play`**

No bloco `play`, substitua:

```json
"skip": "Pular",
```

Por:

```json
"regenerate": "Trocar",
```

- [ ] **Step 2: Atualizar o bloco `result`**

Remova a linha:

```json
"skipped": "Pulou",
```

(as demais chaves `correct`, `wrong`, `next` permanecem)

- [ ] **Step 3: Atualizar o bloco `ranking`**

Substitua:

```json
"skipped": "Puladas",
```

Por:

```json
"skipped": "Trocadas",
```

(o nome da chave permanece `skipped` para manter compatibilidade com `TeamStats.skipped`; apenas o texto exibido muda)

- [ ] **Step 4: Rodar testes e build**

Run: `yarn test && yarn build`
Expected: PASS em tudo. Nenhum texto missing.

- [ ] **Step 5: Commit**

```bash
git add src/messages/pt-BR.json
git commit -m "feat(i18n): rename skip/skipped labels to Trocar/Trocadas"
```

---

### Task 7: Verificação final — lint, build, testes

**Files:** nenhum.

- [ ] **Step 1: Rodar lint**

Run: `yarn lint`
Expected: Sem erros.

- [ ] **Step 2: Rodar build**

Run: `yarn build`
Expected: Build concluído com sucesso.

- [ ] **Step 3: Rodar todos os testes**

Run: `yarn test`
Expected: Todos os testes passam.

- [ ] **Step 4: Smoke test manual no dev server**

Run: `yarn dev`

No navegador:
1. Criar/selecionar 2 times, ir até `/game/play`.
2. Verificar que o botão amarelo mostra "Trocar" com ícone de refresh.
3. Clicar em "Trocar" — a palavra deve mudar, o time **não** deve mudar, o timer deve continuar correndo, não deve navegar para `/game/result`.
4. Clicar em "Trocar" várias vezes seguidas — deve funcionar ilimitadamente.
5. Clicar em "Acertou" — deve navegar para `/game/result` normalmente. Nenhum botão amarelo "Pulou" deve aparecer na tela de resultado.
6. Em `/ranking`, verificar que a coluna que antes dizia "Puladas" agora diz "Trocadas" e exibe o número de regenerações.

Se algum passo falhar, investigar antes de considerar a tarefa concluída.

- [ ] **Step 5: Commit final (somente se algum arquivo mudou neste passo)**

Se não houve mudanças adicionais, pular este passo. Caso contrário:

```bash
git add -A
git commit -m "chore: verification fixes for regenerate-word"
```

---

## Notas

- `TeamStats.skipped` mantém o nome no modelo para não invalidar partidas persistidas no `localStorage` (chave `charades-game`). Só o texto exibido na UI muda para "Trocadas".
- `getAccuracy` em `ranking-table.tsx` inclui `skipped` no denominador. Isso significa que trocas afetam a taxa de acerto — comportamento intencional (pressão implícita contra trocar demais). Não alterar neste plano.
- Nenhuma migração de dados é necessária: contadores em andamento permanecem válidos com a nova semântica.
