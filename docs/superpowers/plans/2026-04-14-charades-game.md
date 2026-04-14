# Charades Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first charades (mimica) party game with team management, configurable categories/difficulty/timer, pressure effects, and detailed ranking.

**Architecture:** Next.js App Router with client-side state managed by Zustand (persisted to localStorage). All game data (words, categories) is hardcoded. Pages follow a hub navigation pattern — Home links to Teams, Game Setup, and Ranking. Game flow cycles through Turn → Play → Result screens.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Biome (linter/formatter), Tailwind CSS 4, Shadcn UI, Lucide React, Zustand, next-intl, @ducanh2912/next-pwa, Vitest + React Testing Library

---

## File Structure

```
src/
  app/
    layout.tsx              # Root layout with providers (i18n, Toaster)
    page.tsx                # Home hub
    teams/page.tsx          # Team CRUD
    game/
      setup/page.tsx        # Game configuration
      play/page.tsx         # Active game screen
      result/page.tsx       # Feedback after each word
      turn/page.tsx         # Team preparation screen
    ranking/page.tsx        # Detailed ranking
    globals.css             # Tailwind + custom animations
  components/
    ui/                     # Shadcn UI (auto-generated)
    game/
      timer-display.tsx     # Timer with pressure visuals
      action-buttons.tsx    # Skip/Wrong/Correct buttons
      word-display.tsx      # Word with hide/show toggle
      category-grid.tsx     # Reusable category selector (setup + turn)
      scoreboard.tsx        # Team scores list (result + ranking)
      confetti.tsx          # CSS confetti animation
    teams/
      team-form.tsx         # Create/Edit team sheet
      team-list.tsx         # Team list with actions
      color-picker.tsx      # Color palette selector
  stores/
    team-store.ts           # Team CRUD + persistence
    game-store.ts           # Game state + word selection + persistence
  data/
    types.ts                # All TypeScript interfaces
    categories.ts           # Category definitions
    words.ts                # Word database (~150+ words)
    colors.ts               # Team color palette
  hooks/
    use-timer.ts            # Timer logic (countdown/unlimited)
    use-audio.ts            # Sound manager + mute toggle
    use-vibration.ts        # Vibration API wrapper
    use-pressure.ts         # Orchestrates timer + audio + vibration for pressure effect
  lib/
    utils.ts                # cn() helper (Shadcn)
  messages/
    pt-BR.json              # All UI strings
  i18n/
    request.ts              # next-intl config
public/
  sounds/
    tick.mp3                # Tick sound for pressure
    beep.mp3                # Beep sound for final seconds
  manifest.json             # PWA manifest
  icons/                    # PWA icons
next.config.ts              # Next.js + PWA config
biome.json                  # Biome config
```

---

## Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `biome.json`, `vitest.config.ts`, `src/lib/utils.ts`
- Modify: `next.config.ts`, `package.json`, `tsconfig.json`

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --turbopack
```

Accept defaults. This creates the project in the current directory.

- [ ] **Step 2: Install core dependencies**

```bash
pnpm add zustand next-intl lucide-react
pnpm add -D @biomejs/biome vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Configure Biome**

Create `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "asNeeded"
    }
  }
}
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    css: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
```

Create `src/test-setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 5: Add scripts to package.json**

Add to `scripts` in `package.json`:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "biome check .",
  "format": "biome format --write ."
}
```

- [ ] **Step 6: Initialize Shadcn UI**

```bash
npx shadcn@latest init
```

Choose: New York style, Zinc base color, CSS variables. This creates `src/lib/utils.ts` with `cn()` and `components.json`.

- [ ] **Step 7: Install required Shadcn components**

```bash
npx shadcn@latest add button card dialog sheet badge toggle separator sonner
```

- [ ] **Step 8: Verify setup**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Biome, Tailwind, Shadcn UI, Vitest"
```

---

## Task 2: Types, Constants & Word Data

**Files:**
- Create: `src/data/types.ts`, `src/data/categories.ts`, `src/data/colors.ts`, `src/data/words.ts`

- [ ] **Step 1: Create type definitions**

Create `src/data/types.ts`:

```typescript
export type CategoryId = "animals" | "professions" | "bible" | "movies" | "actions" | "characters"

export type Difficulty = "easy" | "medium" | "hard"

export type TimerMode = "countdown" | "unlimited"

export type PlayResult = "correct" | "wrong" | "skipped"

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
}
```

- [ ] **Step 2: Create categories data**

Create `src/data/categories.ts`:

```typescript
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
```

- [ ] **Step 3: Create color palette**

Create `src/data/colors.ts`:

```typescript
export interface TeamColor {
  name: string
  hex: string
}

export const teamColors: TeamColor[] = [
  { name: "Vermelho", hex: "#ef4444" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Verde", hex: "#22c55e" },
  { name: "Roxo", hex: "#8b5cf6" },
  { name: "Laranja", hex: "#f97316" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Ciano", hex: "#06b6d4" },
  { name: "Amarelo", hex: "#eab308" },
]
```

- [ ] **Step 4: Create word database**

Create `src/data/words.ts`:

```typescript
import type { Word } from "./types"

export const words: Word[] = [
  // === ANIMALS ===
  // Easy
  { id: "ani-01", text: "Gato", category: "animals", difficulty: "easy" },
  { id: "ani-02", text: "Cachorro", category: "animals", difficulty: "easy" },
  { id: "ani-03", text: "Pássaro", category: "animals", difficulty: "easy" },
  { id: "ani-04", text: "Peixe", category: "animals", difficulty: "easy" },
  { id: "ani-05", text: "Cobra", category: "animals", difficulty: "easy" },
  { id: "ani-06", text: "Macaco", category: "animals", difficulty: "easy" },
  { id: "ani-07", text: "Coelho", category: "animals", difficulty: "easy" },
  { id: "ani-08", text: "Sapo", category: "animals", difficulty: "easy" },
  // Medium
  { id: "ani-09", text: "Elefante", category: "animals", difficulty: "medium" },
  { id: "ani-10", text: "Girafa", category: "animals", difficulty: "medium" },
  { id: "ani-11", text: "Pinguim", category: "animals", difficulty: "medium" },
  { id: "ani-12", text: "Tartaruga", category: "animals", difficulty: "medium" },
  { id: "ani-13", text: "Águia", category: "animals", difficulty: "medium" },
  { id: "ani-14", text: "Jacaré", category: "animals", difficulty: "medium" },
  { id: "ani-15", text: "Cavalo", category: "animals", difficulty: "medium" },
  { id: "ani-16", text: "Tubarão", category: "animals", difficulty: "medium" },
  { id: "ani-17", text: "Gorila", category: "animals", difficulty: "medium" },
  // Hard
  { id: "ani-18", text: "Ornitorrinco", category: "animals", difficulty: "hard" },
  { id: "ani-19", text: "Camaleão", category: "animals", difficulty: "hard" },
  { id: "ani-20", text: "Flamingo", category: "animals", difficulty: "hard" },
  { id: "ani-21", text: "Polvo", category: "animals", difficulty: "hard" },
  { id: "ani-22", text: "Preguiça", category: "animals", difficulty: "hard" },
  { id: "ani-23", text: "Hipopótamo", category: "animals", difficulty: "hard" },
  { id: "ani-24", text: "Suricato", category: "animals", difficulty: "hard" },
  { id: "ani-25", text: "Tatu", category: "animals", difficulty: "hard" },

  // === PROFESSIONS ===
  // Easy
  { id: "pro-01", text: "Médico", category: "professions", difficulty: "easy" },
  { id: "pro-02", text: "Professor", category: "professions", difficulty: "easy" },
  { id: "pro-03", text: "Bombeiro", category: "professions", difficulty: "easy" },
  { id: "pro-04", text: "Policial", category: "professions", difficulty: "easy" },
  { id: "pro-05", text: "Cozinheiro", category: "professions", difficulty: "easy" },
  { id: "pro-06", text: "Cantor", category: "professions", difficulty: "easy" },
  { id: "pro-07", text: "Pintor", category: "professions", difficulty: "easy" },
  { id: "pro-08", text: "Motorista", category: "professions", difficulty: "easy" },
  // Medium
  { id: "pro-09", text: "Dentista", category: "professions", difficulty: "medium" },
  { id: "pro-10", text: "Fotógrafo", category: "professions", difficulty: "medium" },
  { id: "pro-11", text: "Astronauta", category: "professions", difficulty: "medium" },
  { id: "pro-12", text: "Carpinteiro", category: "professions", difficulty: "medium" },
  { id: "pro-13", text: "Mecânico", category: "professions", difficulty: "medium" },
  { id: "pro-14", text: "Veterinário", category: "professions", difficulty: "medium" },
  { id: "pro-15", text: "Padeiro", category: "professions", difficulty: "medium" },
  { id: "pro-16", text: "Eletricista", category: "professions", difficulty: "medium" },
  { id: "pro-17", text: "Mergulhador", category: "professions", difficulty: "medium" },
  // Hard
  { id: "pro-18", text: "Arqueólogo", category: "professions", difficulty: "hard" },
  { id: "pro-19", text: "Diplomata", category: "professions", difficulty: "hard" },
  { id: "pro-20", text: "Advogado", category: "professions", difficulty: "hard" },
  { id: "pro-21", text: "Engenheiro", category: "professions", difficulty: "hard" },
  { id: "pro-22", text: "Psicólogo", category: "professions", difficulty: "hard" },
  { id: "pro-23", text: "Sommelier", category: "professions", difficulty: "hard" },
  { id: "pro-24", text: "Maestro", category: "professions", difficulty: "hard" },
  { id: "pro-25", text: "Leiloeiro", category: "professions", difficulty: "hard" },

  // === BIBLE ===
  // Easy
  { id: "bib-01", text: "Adão e Eva", category: "bible", difficulty: "easy" },
  { id: "bib-02", text: "Arca de Noé", category: "bible", difficulty: "easy" },
  { id: "bib-03", text: "Moisés", category: "bible", difficulty: "easy" },
  { id: "bib-04", text: "Davi e Golias", category: "bible", difficulty: "easy" },
  { id: "bib-05", text: "Jonas e a Baleia", category: "bible", difficulty: "easy" },
  { id: "bib-06", text: "Jesus", category: "bible", difficulty: "easy" },
  { id: "bib-07", text: "Nascimento de Jesus", category: "bible", difficulty: "easy" },
  { id: "bib-08", text: "Anjo", category: "bible", difficulty: "easy" },
  // Medium
  { id: "bib-09", text: "Sansão e Dalila", category: "bible", difficulty: "medium" },
  { id: "bib-10", text: "Torre de Babel", category: "bible", difficulty: "medium" },
  { id: "bib-11", text: "Travessia do Mar Vermelho", category: "bible", difficulty: "medium" },
  { id: "bib-12", text: "Daniel na Cova dos Leões", category: "bible", difficulty: "medium" },
  { id: "bib-13", text: "Abraão", category: "bible", difficulty: "medium" },
  { id: "bib-14", text: "Sarça Ardente", category: "bible", difficulty: "medium" },
  { id: "bib-15", text: "Jardim do Éden", category: "bible", difficulty: "medium" },
  { id: "bib-16", text: "Última Ceia", category: "bible", difficulty: "medium" },
  { id: "bib-17", text: "Batismo", category: "bible", difficulty: "medium" },
  // Hard
  { id: "bib-18", text: "Apocalipse", category: "bible", difficulty: "hard" },
  { id: "bib-19", text: "Salomão", category: "bible", difficulty: "hard" },
  { id: "bib-20", text: "Lázaro", category: "bible", difficulty: "hard" },
  { id: "bib-21", text: "Judas", category: "bible", difficulty: "hard" },
  { id: "bib-22", text: "Êxodo", category: "bible", difficulty: "hard" },
  { id: "bib-23", text: "Arca da Aliança", category: "bible", difficulty: "hard" },
  { id: "bib-24", text: "Rainha de Sabá", category: "bible", difficulty: "hard" },
  { id: "bib-25", text: "Pentecostes", category: "bible", difficulty: "hard" },

  // === MOVIES/SERIES ===
  // Easy
  { id: "mov-01", text: "Homem-Aranha", category: "movies", difficulty: "easy" },
  { id: "mov-02", text: "Rei Leão", category: "movies", difficulty: "easy" },
  { id: "mov-03", text: "Frozen", category: "movies", difficulty: "easy" },
  { id: "mov-04", text: "Harry Potter", category: "movies", difficulty: "easy" },
  { id: "mov-05", text: "Titanic", category: "movies", difficulty: "easy" },
  { id: "mov-06", text: "Star Wars", category: "movies", difficulty: "easy" },
  { id: "mov-07", text: "Procurando Nemo", category: "movies", difficulty: "easy" },
  { id: "mov-08", text: "Toy Story", category: "movies", difficulty: "easy" },
  // Medium
  { id: "mov-09", text: "Stranger Things", category: "movies", difficulty: "medium" },
  { id: "mov-10", text: "Jurassic Park", category: "movies", difficulty: "medium" },
  { id: "mov-11", text: "Matrix", category: "movies", difficulty: "medium" },
  { id: "mov-12", text: "Piratas do Caribe", category: "movies", difficulty: "medium" },
  { id: "mov-13", text: "Breaking Bad", category: "movies", difficulty: "medium" },
  { id: "mov-14", text: "Game of Thrones", category: "movies", difficulty: "medium" },
  { id: "mov-15", text: "Indiana Jones", category: "movies", difficulty: "medium" },
  { id: "mov-16", text: "Shrek", category: "movies", difficulty: "medium" },
  { id: "mov-17", text: "Missão Impossível", category: "movies", difficulty: "medium" },
  // Hard
  { id: "mov-18", text: "Interestelar", category: "movies", difficulty: "hard" },
  { id: "mov-19", text: "O Poderoso Chefão", category: "movies", difficulty: "hard" },
  { id: "mov-20", text: "Clube da Luta", category: "movies", difficulty: "hard" },
  { id: "mov-21", text: "Laranja Mecânica", category: "movies", difficulty: "hard" },
  { id: "mov-22", text: "Blade Runner", category: "movies", difficulty: "hard" },
  { id: "mov-23", text: "Pulp Fiction", category: "movies", difficulty: "hard" },
  { id: "mov-24", text: "O Sexto Sentido", category: "movies", difficulty: "hard" },
  { id: "mov-25", text: "Black Mirror", category: "movies", difficulty: "hard" },

  // === ACTIONS ===
  // Easy
  { id: "act-01", text: "Nadar", category: "actions", difficulty: "easy" },
  { id: "act-02", text: "Dançar", category: "actions", difficulty: "easy" },
  { id: "act-03", text: "Cozinhar", category: "actions", difficulty: "easy" },
  { id: "act-04", text: "Dormir", category: "actions", difficulty: "easy" },
  { id: "act-05", text: "Correr", category: "actions", difficulty: "easy" },
  { id: "act-06", text: "Pular", category: "actions", difficulty: "easy" },
  { id: "act-07", text: "Chorar", category: "actions", difficulty: "easy" },
  { id: "act-08", text: "Rir", category: "actions", difficulty: "easy" },
  // Medium
  { id: "act-09", text: "Dirigir", category: "actions", difficulty: "medium" },
  { id: "act-10", text: "Pescar", category: "actions", difficulty: "medium" },
  { id: "act-11", text: "Escalar", category: "actions", difficulty: "medium" },
  { id: "act-12", text: "Surfar", category: "actions", difficulty: "medium" },
  { id: "act-13", text: "Fotografar", category: "actions", difficulty: "medium" },
  { id: "act-14", text: "Patinar", category: "actions", difficulty: "medium" },
  { id: "act-15", text: "Mergulhar", category: "actions", difficulty: "medium" },
  { id: "act-16", text: "Cavalgar", category: "actions", difficulty: "medium" },
  { id: "act-17", text: "Acampar", category: "actions", difficulty: "medium" },
  // Hard
  { id: "act-18", text: "Meditar", category: "actions", difficulty: "hard" },
  { id: "act-19", text: "Negociar", category: "actions", difficulty: "hard" },
  { id: "act-20", text: "Contrabandear", category: "actions", difficulty: "hard" },
  { id: "act-21", text: "Hipnotizar", category: "actions", difficulty: "hard" },
  { id: "act-22", text: "Malabarismo", category: "actions", difficulty: "hard" },
  { id: "act-23", text: "Reger", category: "actions", difficulty: "hard" },
  { id: "act-24", text: "Esculpir", category: "actions", difficulty: "hard" },
  { id: "act-25", text: "Declamar", category: "actions", difficulty: "hard" },

  // === CHARACTERS ===
  // Easy
  { id: "chr-01", text: "Batman", category: "characters", difficulty: "easy" },
  { id: "chr-02", text: "Superman", category: "characters", difficulty: "easy" },
  { id: "chr-03", text: "Mickey Mouse", category: "characters", difficulty: "easy" },
  { id: "chr-04", text: "Mario", category: "characters", difficulty: "easy" },
  { id: "chr-05", text: "Hulk", category: "characters", difficulty: "easy" },
  { id: "chr-06", text: "Elsa", category: "characters", difficulty: "easy" },
  { id: "chr-07", text: "Pikachu", category: "characters", difficulty: "easy" },
  { id: "chr-08", text: "Bob Esponja", category: "characters", difficulty: "easy" },
  // Medium
  { id: "chr-09", text: "Coringa", category: "characters", difficulty: "medium" },
  { id: "chr-10", text: "Darth Vader", category: "characters", difficulty: "medium" },
  { id: "chr-11", text: "Gandalf", category: "characters", difficulty: "medium" },
  { id: "chr-12", text: "Mulher Maravilha", category: "characters", difficulty: "medium" },
  { id: "chr-13", text: "Capitão América", category: "characters", difficulty: "medium" },
  { id: "chr-14", text: "Wolverine", category: "characters", difficulty: "medium" },
  { id: "chr-15", text: "Scooby-Doo", category: "characters", difficulty: "medium" },
  { id: "chr-16", text: "Goku", category: "characters", difficulty: "medium" },
  { id: "chr-17", text: "Shrek", category: "characters", difficulty: "medium" },
  // Hard
  { id: "chr-18", text: "Thanos", category: "characters", difficulty: "hard" },
  { id: "chr-19", text: "Voldemort", category: "characters", difficulty: "hard" },
  { id: "chr-20", text: "Hannibal Lecter", category: "characters", difficulty: "hard" },
  { id: "chr-21", text: "Sherlock Holmes", category: "characters", difficulty: "hard" },
  { id: "chr-22", text: "Chapolin Colorado", category: "characters", difficulty: "hard" },
  { id: "chr-23", text: "Freddy Krueger", category: "characters", difficulty: "hard" },
  { id: "chr-24", text: "Lara Croft", category: "characters", difficulty: "hard" },
  { id: "chr-25", text: "Optimus Prime", category: "characters", difficulty: "hard" },
]
```

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat: add types, categories, colors, and word database"
```

---

## Task 3: i18n Setup

**Files:**
- Create: `src/messages/pt-BR.json`, `src/i18n/request.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Create Portuguese messages file**

Create `src/messages/pt-BR.json`:

```json
{
  "app": {
    "name": "Mimica",
    "description": "Jogo de mimica para grupos"
  },
  "home": {
    "newGame": "Novo Jogo",
    "continueGame": "Continuar Jogo",
    "teams": "Times",
    "ranking": "Ranking"
  },
  "teams": {
    "title": "Times",
    "addTeam": "Adicionar Time",
    "editTeam": "Editar Time",
    "teamName": "Nome do time",
    "teamNamePlaceholder": "Ex: Leoes",
    "color": "Cor",
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "deleteConfirm": "Tem certeza que deseja excluir este time?",
    "noTeams": "Nenhum time cadastrado",
    "minTeams": "Cadastre pelo menos 2 times para jogar"
  },
  "categories": {
    "animals": "Animais",
    "professions": "Profissoes",
    "bible": "Biblia",
    "movies": "Filmes/Series",
    "actions": "Acoes",
    "characters": "Personagens"
  },
  "setup": {
    "title": "Configurar Jogo",
    "selectTeams": "Selecione os Times",
    "selectCategories": "Categorias",
    "difficulty": "Dificuldade",
    "timer": "Cronometro",
    "easy": "Facil",
    "medium": "Medio",
    "hard": "Dificil",
    "countdown": "Cronometro",
    "unlimited": "Ilimitado",
    "seconds": "{seconds}s",
    "startGame": "Iniciar Jogo",
    "minTeams": "Selecione pelo menos 2 times",
    "minCategories": "Selecione pelo menos 1 categoria",
    "confirmNewGame": "Iniciar novo jogo vai encerrar o jogo atual. Continuar?"
  },
  "turn": {
    "teamTurn": "Vez do time",
    "passDevice": "Passe o celular para o mimico",
    "start": "Comecar",
    "editCategories": "Editar Categorias"
  },
  "play": {
    "round": "Rodada {round}",
    "timeUp": "Tempo!",
    "skip": "Pular",
    "wrong": "Errou",
    "correct": "Acertou",
    "hideWord": "Esconder palavra",
    "showWord": "Mostrar palavra"
  },
  "result": {
    "correct": "Acertou!",
    "wrong": "Errou!",
    "skipped": "Pulou",
    "next": "Proximo: Time {team}",
    "score": "Placar"
  },
  "ranking": {
    "title": "Ranking",
    "position": "Pos",
    "team": "Time",
    "correct": "Acertos",
    "wrong": "Erros",
    "skipped": "Puladas",
    "accuracy": "Taxa",
    "points": "Pontos",
    "endGame": "Encerrar Jogo",
    "endGameConfirm": "Tem certeza? O placar sera apagado.",
    "noGame": "Nenhum jogo ativo"
  },
  "common": {
    "back": "Voltar",
    "confirm": "Confirmar",
    "cancel": "Cancelar",
    "yes": "Sim",
    "no": "Nao"
  },
  "toast": {
    "wordsReset": "Todas as palavras foram usadas! Reiniciando o baralho."
  }
}
```

- [ ] **Step 2: Create next-intl request config**

Create `src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async () => {
  const locale = "pt-BR"
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 3: Update next.config.ts**

Add the next-intl plugin to `next.config.ts`:

```typescript
import createNextIntlPlugin from "next-intl/plugin"
import type { NextConfig } from "next"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 4: Update root layout to wrap with NextIntlClientProvider**

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mimica - Jogo de Mimica",
  description: "Jogo de mimica para grupos. Divirta-se com seus amigos!",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-violet-100 antialiased">
        <NextIntlClientProvider messages={messages}>
          <main className="mx-auto max-w-[430px] min-h-screen">
            {children}
          </main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Verify i18n works**

```bash
pnpm build
```

Expected: Build succeeds. No i18n errors.

- [ ] **Step 6: Commit**

```bash
git add src/messages/ src/i18n/ src/app/layout.tsx next.config.ts
git commit -m "feat: configure next-intl with pt-BR messages"
```

---

## Task 4: Team Store (TDD)

**Files:**
- Create: `src/stores/team-store.ts`, `src/stores/__tests__/team-store.test.ts`

- [ ] **Step 1: Write failing tests for team store**

Create `src/stores/__tests__/team-store.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- src/stores/__tests__/team-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement team store**

Create `src/stores/team-store.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- src/stores/__tests__/team-store.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/
git commit -m "feat: add team store with CRUD operations and localStorage persistence"
```

---

## Task 5: Game Store (TDD)

**Files:**
- Create: `src/stores/game-store.ts`, `src/stores/__tests__/game-store.test.ts`

- [ ] **Step 1: Write failing tests for game store**

Create `src/stores/__tests__/game-store.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useGameStore } from "../game-store"
import type { GameSettings } from "@/data/types"

const defaultSettings: GameSettings = {
  selectedTeamIds: ["team-1", "team-2"],
  selectedCategories: ["animals"],
  difficulty: "easy",
  timerMode: "countdown",
  timerSeconds: 60,
}

describe("useGameStore", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  describe("startGame", () => {
    it("initializes game with settings and team stats", () => {
      useGameStore.getState().startGame(defaultSettings)
      const state = useGameStore.getState()
      expect(state.status).toBe("playing")
      expect(state.settings).toEqual(defaultSettings)
      expect(state.currentTeamIndex).toBe(0)
      expect(state.teamStats["team-1"]).toEqual({ correct: 0, wrong: 0, skipped: 0 })
      expect(state.teamStats["team-2"]).toEqual({ correct: 0, wrong: 0, skipped: 0 })
    })
  })

  describe("drawWord", () => {
    it("draws a word matching category and difficulty", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      const word = useGameStore.getState().currentWord
      expect(word).not.toBeNull()
      expect(word!.category).toBe("animals")
      expect(word!.difficulty).toBe("easy")
    })

    it("does not repeat words until pool is exhausted", () => {
      useGameStore.getState().startGame(defaultSettings)
      const drawnIds = new Set<string>()
      for (let i = 0; i < 5; i++) {
        useGameStore.getState().drawWord()
        const word = useGameStore.getState().currentWord!
        expect(drawnIds.has(word.id)).toBe(false)
        drawnIds.add(word.id)
        useGameStore.getState().submitResult("correct")
      }
    })
  })

  describe("submitResult", () => {
    it("records correct answer for current team", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("correct")
      const stats = useGameStore.getState().teamStats["team-1"]
      expect(stats.correct).toBe(1)
    })

    it("records wrong answer for current team", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("wrong")
      const stats = useGameStore.getState().teamStats["team-1"]
      expect(stats.wrong).toBe(1)
    })

    it("records skipped for current team", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("skipped")
      const stats = useGameStore.getState().teamStats["team-1"]
      expect(stats.skipped).toBe(1)
    })

    it("advances to next team after submit", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("correct")
      expect(useGameStore.getState().currentTeamIndex).toBe(1)
    })

    it("wraps around to first team after last", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("correct")
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("correct")
      expect(useGameStore.getState().currentTeamIndex).toBe(0)
    })

    it("stores lastResult and lastWord for result screen", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      const word = useGameStore.getState().currentWord!
      useGameStore.getState().submitResult("correct")
      expect(useGameStore.getState().lastResult).toBe("correct")
      expect(useGameStore.getState().lastWord).toEqual(word)
    })
  })

  describe("updateCategories", () => {
    it("updates selected categories mid-game", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().updateCategories(["animals", "actions"])
      expect(useGameStore.getState().settings.selectedCategories).toEqual(["animals", "actions"])
    })
  })

  describe("resetGame", () => {
    it("resets all game state to idle", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("correct")
      useGameStore.getState().resetGame()
      const state = useGameStore.getState()
      expect(state.status).toBe("idle")
      expect(state.currentWord).toBeNull()
      expect(state.teamStats).toEqual({})
      expect(state.usedWordIds).toEqual([])
    })
  })

  describe("getCurrentTeamId", () => {
    it("returns the current team id", () => {
      useGameStore.getState().startGame(defaultSettings)
      expect(useGameStore.getState().getCurrentTeamId()).toBe("team-1")
    })
  })

  describe("getNextTeamId", () => {
    it("returns the next team id", () => {
      useGameStore.getState().startGame(defaultSettings)
      expect(useGameStore.getState().getNextTeamId()).toBe("team-2")
    })

    it("wraps around to first team", () => {
      useGameStore.getState().startGame(defaultSettings)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("correct")
      expect(useGameStore.getState().getNextTeamId()).toBe("team-1")
    })
  })

  describe("getRoundNumber", () => {
    it("returns total plays + 1", () => {
      useGameStore.getState().startGame(defaultSettings)
      expect(useGameStore.getState().getRoundNumber()).toBe(1)
      useGameStore.getState().drawWord()
      useGameStore.getState().submitResult("correct")
      expect(useGameStore.getState().getRoundNumber()).toBe(2)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- src/stores/__tests__/game-store.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement game store**

Create `src/stores/game-store.ts`:

```typescript
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CategoryId, GameSettings, GameState, PlayResult, TeamStats, Word } from "@/data/types"
import { words as allWords } from "@/data/words"

interface GameStore extends GameState {
  startGame: (settings: GameSettings) => void
  drawWord: () => void
  submitResult: (result: PlayResult) => void
  updateCategories: (categories: CategoryId[]) => void
  resetGame: () => void
  getCurrentTeamId: () => string
  getNextTeamId: () => string
  getRoundNumber: () => number
}

const initialState: GameState = {
  status: "idle",
  settings: {
    selectedTeamIds: [],
    selectedCategories: [],
    difficulty: "easy",
    timerMode: "countdown",
    timerSeconds: 60,
  },
  currentTeamIndex: 0,
  currentWord: null,
  usedWordIds: [],
  teamStats: {},
  lastResult: null,
  lastWord: null,
}

function getAvailableWords(
  categories: CategoryId[],
  difficulty: string,
  usedIds: string[],
): Word[] {
  return allWords.filter(
    (w) =>
      categories.includes(w.category) &&
      w.difficulty === difficulty &&
      !usedIds.includes(w.id),
  )
}

function pickRandomWord(words: Word[]): Word {
  return words[Math.floor(Math.random() * words.length)]
}

function getTotalPlays(teamStats: Record<string, TeamStats>): number {
  return Object.values(teamStats).reduce(
    (sum, s) => sum + s.correct + s.wrong + s.skipped,
    0,
  )
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startGame: (settings) => {
        const teamStats: Record<string, TeamStats> = {}
        for (const teamId of settings.selectedTeamIds) {
          teamStats[teamId] = { correct: 0, wrong: 0, skipped: 0 }
        }
        set({
          status: "playing",
          settings,
          currentTeamIndex: 0,
          currentWord: null,
          usedWordIds: [],
          teamStats,
          lastResult: null,
          lastWord: null,
        })
      },

      drawWord: () => {
        const { settings, usedWordIds } = get()
        let available = getAvailableWords(
          settings.selectedCategories,
          settings.difficulty,
          usedWordIds,
        )

        if (available.length === 0) {
          // Pool exhausted — reset
          available = getAvailableWords(
            settings.selectedCategories,
            settings.difficulty,
            [],
          )
          set({ usedWordIds: [] })
        }

        if (available.length === 0) return

        const word = pickRandomWord(available)
        set((state) => ({
          currentWord: word,
          usedWordIds: [...state.usedWordIds, word.id],
        }))
      },

      submitResult: (result) => {
        const { settings, currentTeamIndex, currentWord, teamStats } = get()
        const teamId = settings.selectedTeamIds[currentTeamIndex]
        const currentStats = teamStats[teamId]

        const updatedStats = { ...currentStats }
        if (result === "correct") updatedStats.correct += 1
        else if (result === "wrong") updatedStats.wrong += 1
        else if (result === "skipped") updatedStats.skipped += 1

        const nextIndex = (currentTeamIndex + 1) % settings.selectedTeamIds.length

        set({
          teamStats: { ...teamStats, [teamId]: updatedStats },
          currentTeamIndex: nextIndex,
          lastResult: result,
          lastWord: currentWord,
          currentWord: null,
        })
      },

      updateCategories: (categories) => {
        set((state) => ({
          settings: { ...state.settings, selectedCategories: categories },
        }))
      },

      resetGame: () => set(initialState),

      getCurrentTeamId: () => {
        const { settings, currentTeamIndex } = get()
        return settings.selectedTeamIds[currentTeamIndex]
      },

      getNextTeamId: () => {
        const { settings, currentTeamIndex } = get()
        const nextIndex = (currentTeamIndex + 1) % settings.selectedTeamIds.length
        return settings.selectedTeamIds[nextIndex]
      },

      getRoundNumber: () => {
        return getTotalPlays(get().teamStats) + 1
      },
    }),
    {
      name: "charades-game",
    },
  ),
)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- src/stores/__tests__/game-store.test.ts
```

Expected: All 13 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/game-store.ts src/stores/__tests__/game-store.test.ts
git commit -m "feat: add game store with word selection, scoring, and team rotation"
```

---

## Task 6: useTimer Hook (TDD)

**Files:**
- Create: `src/hooks/use-timer.ts`, `src/hooks/__tests__/use-timer.test.ts`

- [ ] **Step 1: Write failing tests for useTimer**

Create `src/hooks/__tests__/use-timer.test.ts`:

```typescript
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useTimer } from "../use-timer"

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe("countdown mode", () => {
    it("counts down from initial seconds", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 60 }),
      )
      expect(result.current.timeLeft).toBe(60)
      expect(result.current.isRunning).toBe(false)
    })

    it("decrements time when started", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 60 }),
      )
      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(1000))
      expect(result.current.timeLeft).toBe(59)
      expect(result.current.isRunning).toBe(true)
    })

    it("stops at zero", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 3 }),
      )
      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(5000))
      expect(result.current.timeLeft).toBe(0)
      expect(result.current.isExpired).toBe(true)
      expect(result.current.isRunning).toBe(false)
    })

    it("reports pressure phase", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 12 }),
      )
      act(() => result.current.start())

      // At 12s: no pressure
      expect(result.current.pressurePhase).toBe("none")

      act(() => vi.advanceTimersByTime(2000))
      // At 10s: low pressure
      expect(result.current.pressurePhase).toBe("low")

      act(() => vi.advanceTimersByTime(5000))
      // At 5s: medium pressure
      expect(result.current.pressurePhase).toBe("medium")

      act(() => vi.advanceTimersByTime(3000))
      // At 2s: high pressure
      expect(result.current.pressurePhase).toBe("high")
    })

    it("can be paused and resumed", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 60 }),
      )
      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(3000))
      expect(result.current.timeLeft).toBe(57)

      act(() => result.current.pause())
      act(() => vi.advanceTimersByTime(5000))
      expect(result.current.timeLeft).toBe(57)

      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(2000))
      expect(result.current.timeLeft).toBe(55)
    })

    it("can be reset", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 60 }),
      )
      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(10000))
      act(() => result.current.reset())
      expect(result.current.timeLeft).toBe(60)
      expect(result.current.isRunning).toBe(false)
      expect(result.current.isExpired).toBe(false)
    })
  })

  describe("unlimited mode", () => {
    it("counts up from zero", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "unlimited", seconds: 0 }),
      )
      expect(result.current.elapsed).toBe(0)
    })

    it("increments elapsed when started", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "unlimited", seconds: 0 }),
      )
      act(() => result.current.start())
      act(() => vi.advanceTimersByTime(5000))
      expect(result.current.elapsed).toBe(5)
      expect(result.current.pressurePhase).toBe("none")
    })
  })

  describe("formatTime", () => {
    it("formats seconds as M:SS", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 95 }),
      )
      expect(result.current.displayTime).toBe("1:35")
    })

    it("formats zero as 0:00", () => {
      const { result } = renderHook(() =>
        useTimer({ mode: "countdown", seconds: 0 }),
      )
      expect(result.current.displayTime).toBe("0:00")
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- src/hooks/__tests__/use-timer.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement useTimer hook**

Create `src/hooks/use-timer.ts`:

```typescript
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

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (isExpired) return
    setIsRunning(true)
  }, [isExpired])

  const pause = useCallback(() => {
    setIsRunning(false)
    clearTimer()
  }, [clearTimer])

  const reset = useCallback(() => {
    clearTimer()
    setTimeLeft(seconds)
    setElapsed(0)
    setIsRunning(false)
    setIsExpired(false)
  }, [seconds, clearTimer])

  useEffect(() => {
    if (!isRunning) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      if (mode === "countdown") {
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
  }, [isRunning, mode, clearTimer])

  const displaySeconds = mode === "countdown" ? timeLeft : elapsed
  const displayTime = formatTime(displaySeconds)
  const pressurePhase = getPressurePhase(timeLeft, mode)

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

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- src/hooks/__tests__/use-timer.test.ts
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useTimer hook with countdown, unlimited, and pressure phases"
```

---

## Task 7: Shared Game Components

**Files:**
- Create: `src/components/game/category-grid.tsx`, `src/components/game/scoreboard.tsx`, `src/components/game/confetti.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add custom animations to globals.css**

Append to `src/app/globals.css` (after existing content):

```css
@keyframes bounce-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse-pressure {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pulse-pressure-fast {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes confetti-fall {
  0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.animate-pulse-slow {
  animation: pulse-pressure 1s ease-in-out infinite;
}

.animate-pulse-fast {
  animation: pulse-pressure-fast 0.5s ease-in-out infinite;
}
```

- [ ] **Step 2: Create CategoryGrid component**

Create `src/components/game/category-grid.tsx`:

```tsx
"use client"

import { categories } from "@/data/categories"
import type { CategoryId } from "@/data/types"
import { useTranslations } from "next-intl"
import {
  BookOpen,
  Briefcase,
  Clapperboard,
  PawPrint,
  Users,
  Zap,
} from "lucide-react"

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
```

- [ ] **Step 3: Create Scoreboard component**

Create `src/components/game/scoreboard.tsx`:

```tsx
"use client"

import type { Team, TeamStats } from "@/data/types"
import { useTranslations } from "next-intl"

interface ScoreboardProps {
  teams: Team[]
  stats: Record<string, TeamStats>
  highlightTeamId?: string
  compact?: boolean
}

export function Scoreboard({ teams, stats, highlightTeamId, compact }: ScoreboardProps) {
  const t = useTranslations("ranking")

  const sorted = [...teams]
    .filter((team) => stats[team.id])
    .sort((a, b) => (stats[b.id]?.correct ?? 0) - (stats[a.id]?.correct ?? 0))

  return (
    <div className="space-y-2">
      {sorted.map((team, index) => {
        const s = stats[team.id]
        if (!s) return null
        const isHighlight = team.id === highlightTeamId
        return (
          <div
            key={team.id}
            className={`flex items-center gap-3 rounded-xl p-3 ${
              isHighlight ? "bg-white/80 ring-2 ring-indigo-300" : "bg-white/50"
            }`}
          >
            <span className="text-lg font-bold text-gray-400 w-6 text-center">
              {index + 1}
            </span>
            <div
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
            <span className="font-semibold text-gray-800 flex-1 truncate">
              {team.name}
            </span>
            <span className="text-lg font-bold text-indigo-600">
              {s.correct}
            </span>
            {!compact && (
              <div className="flex gap-2 text-xs text-gray-500">
                <span>{s.wrong}E</span>
                <span>{s.skipped}P</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create Confetti component**

Create `src/components/game/confetti.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#ec4899"]
const PARTICLE_COUNT = 30

interface Particle {
  id: number
  left: number
  color: string
  delay: number
  duration: number
  size: number
}

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const items: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 6,
    }))
    setParticles(items)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/game/ src/app/globals.css
git commit -m "feat: add shared game components (CategoryGrid, Scoreboard, Confetti)"
```

---

## Task 8: Home Page

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Step 1: Implement Home page**

Replace `src/app/page.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useGameStore } from "@/stores/game-store"
import { Gamepad2, Trophy, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function HomePage() {
  const t = useTranslations()
  const router = useRouter()
  const gameStatus = useGameStore((s) => s.status)
  const resetGame = useGameStore((s) => s.resetGame)
  const [showConfirm, setShowConfirm] = useState(false)

  const hasActiveGame = gameStatus === "playing" || gameStatus === "paused"

  function handleGameButton() {
    if (hasActiveGame) {
      router.push("/game/turn")
    } else {
      router.push("/game/setup")
    }
  }

  function handleNewGameWhileActive() {
    setShowConfirm(true)
  }

  function confirmNewGame() {
    resetGame()
    setShowConfirm(false)
    router.push("/game/setup")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-indigo-900">
          {t("app.name")}
        </h1>
        <p className="mt-2 text-lg text-indigo-600/70">{t("app.description")}</p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <Button
          size="lg"
          className="h-16 text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
          onClick={handleGameButton}
        >
          <Gamepad2 className="mr-2 h-6 w-6" />
          {hasActiveGame ? t("home.continueGame") : t("home.newGame")}
        </Button>

        {hasActiveGame && (
          <Button
            size="lg"
            variant="outline"
            className="h-14 text-base font-semibold"
            onClick={handleNewGameWhileActive}
          >
            <Gamepad2 className="mr-2 h-5 w-5" />
            {t("home.newGame")}
          </Button>
        )}

        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base font-semibold"
          onClick={() => router.push("/teams")}
        >
          <Users className="mr-2 h-5 w-5" />
          {t("home.teams")}
        </Button>

        {hasActiveGame && (
          <Button
            size="lg"
            variant="outline"
            className="h-14 text-base font-semibold"
            onClick={() => router.push("/ranking")}
          >
            <Trophy className="mr-2 h-5 w-5" />
            {t("home.ranking")}
          </Button>
        )}
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("home.newGame")}</DialogTitle>
            <DialogDescription>{t("setup.confirmNewGame")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmNewGame}>{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Verify page renders**

```bash
pnpm dev
```

Open http://localhost:3000 — should see the hub with "Novo Jogo" and "Times" buttons.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home page with hub navigation"
```

---

## Task 9: Teams Page

**Files:**
- Create: `src/app/teams/page.tsx`, `src/components/teams/team-list.tsx`, `src/components/teams/team-form.tsx`, `src/components/teams/color-picker.tsx`

- [ ] **Step 1: Create ColorPicker component**

Create `src/components/teams/color-picker.tsx`:

```tsx
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
```

- [ ] **Step 2: Create TeamForm component**

Create `src/components/teams/team-form.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Team } from "@/data/types"
import { teamColors } from "@/data/colors"
import { useTeamStore } from "@/stores/team-store"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { ColorPicker } from "./color-picker"

interface TeamFormProps {
  open: boolean
  onClose: () => void
  team?: Team | null
}

export function TeamForm({ open, onClose, team }: TeamFormProps) {
  const t = useTranslations("teams")
  const { addTeam, updateTeam, getUsedColors } = useTeamStore()
  const [name, setName] = useState("")
  const [color, setColor] = useState(teamColors[0].hex)

  const usedColors = getUsedColors()

  useEffect(() => {
    if (team) {
      setName(team.name)
      setColor(team.color)
    } else {
      setName("")
      const firstAvailable = teamColors.find((c) => !usedColors.includes(c.hex))
      setColor(firstAvailable?.hex ?? teamColors[0].hex)
    }
  }, [team, open, usedColors])

  function handleSave() {
    if (!name.trim()) return
    if (team) {
      updateTeam(team.id, name.trim(), color)
    } else {
      addTeam(name.trim(), color)
    }
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{team ? t("editTeam") : t("addTeam")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t("teamName")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("teamNamePlaceholder")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              maxLength={20}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t("color")}</label>
            <div className="mt-2">
              <ColorPicker selected={color} usedColors={usedColors} onChange={setColor} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={!name.trim()}>
              {t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 3: Create TeamList component**

Create `src/components/teams/team-list.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import type { Team } from "@/data/types"
import { Pencil, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface TeamListProps {
  teams: Team[]
  onEdit: (team: Team) => void
  onDelete: (id: string) => void
}

export function TeamList({ teams, onEdit, onDelete }: TeamListProps) {
  const t = useTranslations("teams")

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">{t("noTeams")}</p>
        <p className="text-sm mt-1">{t("minTeams")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
        >
          <div
            className="h-5 w-5 rounded-full shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <span className="flex-1 font-semibold text-gray-800 truncate">
            {team.name}
          </span>
          <Button variant="ghost" size="icon" onClick={() => onEdit(team)}>
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(team.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create Teams page**

Create `src/app/teams/page.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TeamForm } from "@/components/teams/team-form"
import { TeamList } from "@/components/teams/team-list"
import type { Team } from "@/data/types"
import { useTeamStore } from "@/stores/team-store"
import { ArrowLeft, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function TeamsPage() {
  const t = useTranslations("teams")
  const tc = useTranslations("common")
  const router = useRouter()
  const { teams, removeTeam } = useTeamStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function handleEdit(team: Team) {
    setEditingTeam(team)
    setFormOpen(true)
  }

  function handleAdd() {
    setEditingTeam(null)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingTeam(null)
  }

  function confirmDelete() {
    if (deleteId) {
      removeTeam(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <div className="flex-1" />
        <Button
          size="icon"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleAdd}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <TeamList teams={teams} onEdit={handleEdit} onDelete={setDeleteId} />

      <TeamForm open={formOpen} onClose={handleCloseForm} team={editingTeam} />

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 5: Verify Teams page works**

```bash
pnpm dev
```

Navigate to http://localhost:3000/teams — should be able to add, edit, and delete teams with color picker.

- [ ] **Step 6: Commit**

```bash
git add src/app/teams/ src/components/teams/
git commit -m "feat: add teams page with CRUD, color picker, and delete confirmation"
```

---

## Task 10: Game Setup Page

**Files:**
- Create: `src/app/game/setup/page.tsx`

- [ ] **Step 1: Implement Game Setup page**

Create `src/app/game/setup/page.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { CategoryGrid } from "@/components/game/category-grid"
import { allCategoryIds } from "@/data/categories"
import type { CategoryId, Difficulty, TimerMode } from "@/data/types"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"
import { ArrowLeft, Play } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

const TIMER_OPTIONS = [30, 60, 90]

export default function GameSetupPage() {
  const t = useTranslations("setup")
  const tc = useTranslations("common")
  const router = useRouter()
  const teams = useTeamStore((s) => s.teams)
  const startGame = useGameStore((s) => s.startGame)

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([...allCategoryIds])
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [timerMode, setTimerMode] = useState<TimerMode>("countdown")
  const [timerSeconds, setTimerSeconds] = useState(60)

  function toggleTeam(id: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  function handleStart() {
    if (selectedTeamIds.length < 2) return
    if (selectedCategories.length < 1) return
    startGame({
      selectedTeamIds,
      selectedCategories,
      difficulty,
      timerMode,
      timerSeconds,
    })
    router.push("/game/turn")
  }

  const canStart = selectedTeamIds.length >= 2 && selectedCategories.length >= 1

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {/* Teams */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t("selectTeams")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {teams.map((team) => {
            const isSelected = selectedTeamIds.includes(team.id)
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => toggleTeam(team.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isSelected
                    ? "text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
                style={isSelected ? { backgroundColor: team.color } : undefined}
              >
                {!isSelected && (
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                )}
                {team.name}
              </button>
            )
          })}
        </div>
        {selectedTeamIds.length < 2 && (
          <p className="text-xs text-red-500 mt-2">{t("minTeams")}</p>
        )}
      </section>

      {/* Categories */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t("selectCategories")}
        </h2>
        <CategoryGrid selected={selectedCategories} onChange={setSelectedCategories} />
      </section>

      {/* Difficulty */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t("difficulty")}
        </h2>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                difficulty === d
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {t(d)}
            </button>
          ))}
        </div>
      </section>

      {/* Timer */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t("timer")}
        </h2>
        <div className="flex gap-2 mb-3">
          {(["countdown", "unlimited"] as TimerMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTimerMode(m)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all ${
                timerMode === m
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {t(m)}
            </button>
          ))}
        </div>
        {timerMode === "countdown" && (
          <div className="flex gap-2">
            {TIMER_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTimerSeconds(s)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
                  timerSeconds === s
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {t("seconds", { seconds: s })}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Start Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/80 to-transparent">
        <div className="mx-auto max-w-[430px]">
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
            disabled={!canStart}
            onClick={handleStart}
          >
            <Play className="mr-2 h-5 w-5" />
            {t("startGame")}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify setup page works**

```bash
pnpm dev
```

Navigate to http://localhost:3000/game/setup — should see team selection, categories, difficulty, timer options, and start button.

- [ ] **Step 3: Commit**

```bash
git add src/app/game/setup/
git commit -m "feat: add game setup page with team, category, difficulty, and timer selection"
```

---

## Task 11: Game Turn Page

**Files:**
- Create: `src/app/game/turn/page.tsx`

- [ ] **Step 1: Implement Game Turn page**

Create `src/app/game/turn/page.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CategoryGrid } from "@/components/game/category-grid"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"
import { ArrowLeft, Settings } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function GameTurnPage() {
  const t = useTranslations("turn")
  const tc = useTranslations("common")
  const router = useRouter()

  const getCurrentTeamId = useGameStore((s) => s.getCurrentTeamId)
  const selectedCategories = useGameStore((s) => s.settings.selectedCategories)
  const updateCategories = useGameStore((s) => s.updateCategories)
  const drawWord = useGameStore((s) => s.drawWord)
  const getTeamById = useTeamStore((s) => s.getTeamById)

  const [settingsOpen, setSettingsOpen] = useState(false)

  const teamId = getCurrentTeamId()
  const team = getTeamById(teamId)

  function handleStart() {
    drawWord()
    router.push("/game/play")
  }

  if (!team) {
    router.push("/")
    return null
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 relative"
      style={{
        background: `linear-gradient(135deg, ${team.color}33, ${team.color}66)`,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 left-4"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-4"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="h-5 w-5" />
      </Button>

      <div className="text-center space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
          {t("teamTurn")}
        </p>
        <div
          className="h-20 w-20 rounded-full mx-auto shadow-lg"
          style={{ backgroundColor: team.color }}
        />
        <h1 className="text-4xl font-extrabold text-gray-900">{team.name}</h1>
        <p className="text-gray-600">{t("passDevice")}</p>
      </div>

      <Button
        size="lg"
        className="mt-12 h-16 w-full text-xl font-bold bg-white text-gray-900 hover:bg-gray-50 shadow-lg"
        onClick={handleStart}
      >
        {t("start")}
      </Button>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("editCategories")}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <CategoryGrid
              selected={selectedCategories}
              onChange={updateCategories}
            />
          </div>
          <Button className="w-full mt-4" onClick={() => setSettingsOpen(false)}>
            {tc("confirm")}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

- [ ] **Step 2: Verify turn page works**

```bash
pnpm dev
```

Start a game and verify the turn page shows team name, color, and settings gear.

- [ ] **Step 3: Commit**

```bash
git add src/app/game/turn/
git commit -m "feat: add game turn page with team display and category editing"
```

---

## Task 12: Game Play Page

**Files:**
- Create: `src/app/game/play/page.tsx`, `src/components/game/timer-display.tsx`, `src/components/game/word-display.tsx`, `src/components/game/action-buttons.tsx`

- [ ] **Step 1: Create TimerDisplay component**

Create `src/components/game/timer-display.tsx`:

```tsx
"use client"

import type { PressurePhase } from "@/hooks/use-timer"

interface TimerDisplayProps {
  displayTime: string
  pressurePhase: PressurePhase
  isExpired: boolean
}

export function TimerDisplay({ displayTime, pressurePhase, isExpired }: TimerDisplayProps) {
  const phaseStyles: Record<PressurePhase, string> = {
    none: "bg-gray-100 text-gray-800",
    low: "bg-red-100 text-red-700 animate-pulse-slow",
    medium: "bg-red-200 text-red-800 animate-pulse-fast",
    high: "bg-red-500 text-white animate-pulse-fast",
  }

  return (
    <div
      className={`rounded-2xl px-6 py-3 text-center transition-all ${
        isExpired ? "bg-red-500 text-white" : phaseStyles[pressurePhase]
      }`}
    >
      <span className="text-4xl font-bold tabular-nums">
        {isExpired ? "Tempo!" : displayTime}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create WordDisplay component**

Create `src/components/game/word-display.tsx`:

```tsx
"use client"

import type { CategoryId, Difficulty } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface WordDisplayProps {
  word: string
  category: CategoryId
  difficulty: Difficulty
}

const difficultyColors: Record<Difficulty, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
}

export function WordDisplay({ word, category, difficulty }: WordDisplayProps) {
  const t = useTranslations()
  const [hidden, setHidden] = useState(false)

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {t(`categories.${category}`)}
        </Badge>
        <Badge variant="secondary" className={`text-xs ${difficultyColors[difficulty]}`}>
          {t(`setup.${difficulty}`)}
        </Badge>
      </div>

      <div className="relative">
        <h1 className="text-4xl font-extrabold text-gray-900 min-h-[48px]">
          {hidden ? "* * * * *" : word}
        </h1>
        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          className="mt-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {hidden ? (
            <>
              <Eye className="h-4 w-4" />
              {t("play.showWord")}
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              {t("play.hideWord")}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ActionButtons component**

Create `src/components/game/action-buttons.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import type { PlayResult } from "@/data/types"
import { ArrowRight, Check, X } from "lucide-react"
import { useTranslations } from "next-intl"

interface ActionButtonsProps {
  onAction: (result: PlayResult) => void
}

export function ActionButtons({ onAction }: ActionButtonsProps) {
  const t = useTranslations("play")

  return (
    <div className="flex gap-3">
      <Button
        size="lg"
        className="flex-1 h-14 bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
        onClick={() => onAction("skipped")}
      >
        <ArrowRight className="mr-1 h-5 w-5" />
        {t("skip")}
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

- [ ] **Step 4: Create Game Play page**

Create `src/app/game/play/page.tsx`:

```tsx
"use client"

import { ActionButtons } from "@/components/game/action-buttons"
import { TimerDisplay } from "@/components/game/timer-display"
import { WordDisplay } from "@/components/game/word-display"
import type { PlayResult } from "@/data/types"
import { useTimer } from "@/hooks/use-timer"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"
import { Volume2, VolumeX } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function GamePlayPage() {
  const t = useTranslations("play")
  const router = useRouter()

  const currentWord = useGameStore((s) => s.currentWord)
  const settings = useGameStore((s) => s.settings)
  const getCurrentTeamId = useGameStore((s) => s.getCurrentTeamId)
  const getRoundNumber = useGameStore((s) => s.getRoundNumber)
  const submitResult = useGameStore((s) => s.submitResult)
  const getTeamById = useTeamStore((s) => s.getTeamById)

  const [muted, setMuted] = useState(false)

  const team = getTeamById(getCurrentTeamId())
  const roundNumber = getRoundNumber()

  const timer = useTimer({
    mode: settings.timerMode,
    seconds: settings.timerSeconds,
  })

  useEffect(() => {
    timer.start()
    return () => timer.pause()
  }, [])

  function handleAction(result: PlayResult) {
    timer.pause()
    submitResult(result)
    router.push("/game/result")
  }

  if (!currentWord || !team) {
    router.push("/game/turn")
    return null
  }

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
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <span className="font-semibold text-gray-700">{team.name}</span>
        </div>
        <span className="text-sm text-gray-500">
          {t("round", { round: roundNumber })}
        </span>
        <button type="button" onClick={() => setMuted(!muted)} className="text-gray-500">
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Timer */}
      <div className="mb-8 relative z-20">
        <TimerDisplay
          displayTime={timer.displayTime}
          pressurePhase={timer.pressurePhase}
          isExpired={timer.isExpired}
        />
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
        <ActionButtons onAction={handleAction} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify play page works**

```bash
pnpm dev
```

Create teams, set up a game, and verify the play screen shows word, timer, and action buttons.

- [ ] **Step 6: Commit**

```bash
git add src/app/game/play/ src/components/game/timer-display.tsx src/components/game/word-display.tsx src/components/game/action-buttons.tsx
git commit -m "feat: add game play page with timer, word display, and action buttons"
```

---

## Task 13: Game Result Page

**Files:**
- Create: `src/app/game/result/page.tsx`

- [ ] **Step 1: Implement Game Result page**

Create `src/app/game/result/page.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Confetti } from "@/components/game/confetti"
import { Scoreboard } from "@/components/game/scoreboard"
import type { PlayResult } from "@/data/types"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"
import { ArrowRight, Check, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

const resultConfig: Record<PlayResult, {
  gradient: string
  icon: React.ComponentType<{ className?: string }>
  labelKey: string
}> = {
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
  skipped: {
    gradient: "from-yellow-400 to-amber-500",
    icon: ArrowRight,
    labelKey: "result.skipped",
  },
}

export default function GameResultPage() {
  const t = useTranslations()
  const router = useRouter()

  const lastResult = useGameStore((s) => s.lastResult)
  const lastWord = useGameStore((s) => s.lastWord)
  const teamStats = useGameStore((s) => s.teamStats)
  const getCurrentTeamId = useGameStore((s) => s.getCurrentTeamId)
  const getTeamById = useTeamStore((s) => s.getTeamById)
  const teams = useTeamStore((s) => s.teams)

  const nextTeam = getTeamById(getCurrentTeamId())

  if (!lastResult || !lastWord) {
    router.push("/game/turn")
    return null
  }

  const config = resultConfig[lastResult]
  const Icon = config.icon

  const gameTeams = teams.filter((team) => teamStats[team.id])

  return (
    <div
      className={`flex flex-col items-center min-h-screen px-6 py-12 bg-gradient-to-br ${config.gradient}`}
    >
      {lastResult === "correct" && <Confetti />}

      <div className="animate-bounce-in mb-4">
        <div className="h-24 w-24 rounded-full bg-white/30 flex items-center justify-center">
          <Icon className="h-14 w-14 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-2">
        {t(config.labelKey)}
      </h1>
      <p className="text-xl text-white/80 font-semibold mb-8">{lastWord.text}</p>

      <div className="w-full bg-white/20 rounded-2xl p-4 backdrop-blur-sm mb-8">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3 text-center">
          {t("result.score")}
        </h2>
        <Scoreboard teams={gameTeams} stats={teamStats} compact />
      </div>

      <Button
        size="lg"
        className="w-full h-14 text-lg font-bold bg-white text-gray-900 hover:bg-gray-50 shadow-lg"
        onClick={() => router.push("/game/turn")}
      >
        {t("result.next", { team: nextTeam?.name ?? "" })}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify result page works**

```bash
pnpm dev
```

Play through a word and verify the result page shows correct feedback, confetti on correct, and scoreboard.

- [ ] **Step 3: Commit**

```bash
git add src/app/game/result/
git commit -m "feat: add game result page with animated feedback, confetti, and scoreboard"
```

---

## Task 14: Ranking Page

**Files:**
- Create: `src/app/ranking/page.tsx`

- [ ] **Step 1: Implement Ranking page**

Create `src/app/ranking/page.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TeamStats } from "@/data/types"
import { useGameStore } from "@/stores/game-store"
import { useTeamStore } from "@/stores/team-store"
import { ArrowLeft, Crown, XCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"

function getAccuracy(stats: TeamStats): number {
  const total = stats.correct + stats.wrong + stats.skipped
  if (total === 0) return 0
  return Math.round((stats.correct / total) * 100)
}

export default function RankingPage() {
  const t = useTranslations("ranking")
  const tc = useTranslations("common")
  const router = useRouter()

  const teamStats = useGameStore((s) => s.teamStats)
  const status = useGameStore((s) => s.status)
  const resetGame = useGameStore((s) => s.resetGame)
  const teams = useTeamStore((s) => s.teams)

  const [showEndConfirm, setShowEndConfirm] = useState(false)

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="text-gray-500 text-lg">{t("noGame")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          {tc("back")}
        </Button>
      </div>
    )
  }

  const gameTeams = teams
    .filter((team) => teamStats[team.id])
    .sort((a, b) => (teamStats[b.id]?.correct ?? 0) - (teamStats[a.id]?.correct ?? 0))

  function handleEndGame() {
    resetGame()
    setShowEndConfirm(false)
    router.push("/")
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[32px_1fr_48px_48px_48px_48px] gap-2 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
        <span>{t("position")}</span>
        <span>{t("team")}</span>
        <span className="text-center">{t("points")}</span>
        <span className="text-center">{t("wrong")}</span>
        <span className="text-center">{t("skipped")}</span>
        <span className="text-center">{t("accuracy")}</span>
      </div>

      {/* Team rows */}
      <div className="space-y-2">
        {gameTeams.map((team, index) => {
          const stats = teamStats[team.id]
          if (!stats) return null
          const isFirst = index === 0 && stats.correct > 0

          return (
            <div
              key={team.id}
              className={`grid grid-cols-[32px_1fr_48px_48px_48px_48px] gap-2 items-center rounded-xl p-3 ${
                isFirst
                  ? "bg-gradient-to-r from-yellow-50 to-amber-50 ring-2 ring-yellow-300"
                  : "bg-white shadow-sm"
              }`}
            >
              <span className="text-center font-bold text-gray-400 flex items-center justify-center">
                {isFirst ? <Crown className="h-5 w-5 text-yellow-500" /> : index + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-semibold text-gray-800 truncate">{team.name}</span>
              </div>
              <span className="text-center font-bold text-indigo-600">{stats.correct}</span>
              <span className="text-center text-sm text-red-500">{stats.wrong}</span>
              <span className="text-center text-sm text-yellow-600">{stats.skipped}</span>
              <span className="text-center text-sm text-gray-600">{getAccuracy(stats)}%</span>
            </div>
          )
        })}
      </div>

      <div className="mt-auto pt-8">
        <Button
          variant="outline"
          className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowEndConfirm(true)}
        >
          <XCircle className="mr-2 h-5 w-5" />
          {t("endGame")}
        </Button>
      </div>

      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("endGame")}</DialogTitle>
            <DialogDescription>{t("endGameConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndConfirm(false)}>
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleEndGame}>
              {tc("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Verify ranking page works**

```bash
pnpm dev
```

Play a few rounds and verify ranking shows stats, crown for 1st place, and end game confirmation.

- [ ] **Step 3: Commit**

```bash
git add src/app/ranking/
git commit -m "feat: add ranking page with detailed stats and end game confirmation"
```

---

## Task 15: Audio, Vibration & Pressure Effects

**Files:**
- Create: `src/hooks/use-audio.ts`, `src/hooks/use-vibration.ts`, `src/hooks/use-pressure.ts`
- Create: `public/sounds/tick.mp3`, `public/sounds/beep.mp3`
- Modify: `src/app/game/play/page.tsx`

- [ ] **Step 1: Create useAudio hook**

Create `src/hooks/use-audio.ts`:

```typescript
"use client"

import { useCallback, useEffect, useRef } from "react"

interface UseAudioReturn {
  playTick: () => void
  playBeep: () => void
}

export function useAudio(muted: boolean): UseAudioReturn {
  const tickRef = useRef<HTMLAudioElement | null>(null)
  const beepRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    tickRef.current = new Audio("/sounds/tick.mp3")
    beepRef.current = new Audio("/sounds/beep.mp3")
    tickRef.current.preload = "auto"
    beepRef.current.preload = "auto"
  }, [])

  const playTick = useCallback(() => {
    if (muted || !tickRef.current) return
    tickRef.current.currentTime = 0
    tickRef.current.play().catch(() => {})
  }, [muted])

  const playBeep = useCallback(() => {
    if (muted || !beepRef.current) return
    beepRef.current.currentTime = 0
    beepRef.current.play().catch(() => {})
  }, [muted])

  return { playTick, playBeep }
}
```

- [ ] **Step 2: Create useVibration hook**

Create `src/hooks/use-vibration.ts`:

```typescript
"use client"

import { useCallback } from "react"
import type { PressurePhase } from "./use-timer"

export function useVibration() {
  const vibrate = useCallback((phase: PressurePhase) => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return

    switch (phase) {
      case "low":
        navigator.vibrate(100)
        break
      case "medium":
        navigator.vibrate([100, 50, 100])
        break
      case "high":
        navigator.vibrate([200])
        break
    }
  }, [])

  return { vibrate }
}
```

- [ ] **Step 3: Create usePressure hook**

Create `src/hooks/use-pressure.ts`:

```typescript
"use client"

import { useEffect, useRef } from "react"
import type { PressurePhase } from "./use-timer"
import { useAudio } from "./use-audio"
import { useVibration } from "./use-vibration"

interface UsePressureOptions {
  pressurePhase: PressurePhase
  isRunning: boolean
  muted: boolean
}

export function usePressure({ pressurePhase, isRunning, muted }: UsePressureOptions) {
  const { playTick, playBeep } = useAudio(muted)
  const { vibrate } = useVibration()
  const prevPhaseRef = useRef<PressurePhase>("none")

  useEffect(() => {
    if (!isRunning || pressurePhase === "none") {
      prevPhaseRef.current = pressurePhase
      return
    }

    // Only trigger on phase transitions or tick intervals
    if (pressurePhase !== prevPhaseRef.current) {
      prevPhaseRef.current = pressurePhase
    }

    if (pressurePhase === "high") {
      playBeep()
    } else {
      playTick()
    }

    vibrate(pressurePhase)
  }, [pressurePhase, isRunning, playTick, playBeep, vibrate])
}
```

- [ ] **Step 4: Generate placeholder audio files**

For now, create minimal valid MP3 files. Replace with real sounds later.

```bash
# Create sounds directory
mkdir -p C:/Users/Datamob/projects/personal/charades/public/sounds
```

Note: The engineer should source or create short tick.mp3 and beep.mp3 sound files (~0.1-0.3s each). Free options: use `ffmpeg` to generate tones, or download from freesound.org. Place them in `public/sounds/`.

Generate simple tones with ffmpeg if available:

```bash
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.1" -ar 44100 -ac 1 public/sounds/tick.mp3 2>/dev/null || echo "Install ffmpeg or add sound files manually"
ffmpeg -f lavfi -i "sine=frequency=1200:duration=0.2" -ar 44100 -ac 1 public/sounds/beep.mp3 2>/dev/null || echo "Install ffmpeg or add sound files manually"
```

- [ ] **Step 5: Integrate pressure effects into Game Play page**

Modify `src/app/game/play/page.tsx` — add the pressure hook. Add these imports at the top:

```typescript
import { usePressure } from "@/hooks/use-pressure"
```

Add inside the component, after the `timer` hook:

```typescript
usePressure({
  pressurePhase: timer.pressurePhase,
  isRunning: timer.isRunning,
  muted,
})
```

- [ ] **Step 6: Verify pressure effects work**

```bash
pnpm dev
```

Start a game with 15s countdown. Verify timer turns red in last 10s, pulses faster, and plays sounds (if audio files exist).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/use-audio.ts src/hooks/use-vibration.ts src/hooks/use-pressure.ts public/sounds/ src/app/game/play/page.tsx
git commit -m "feat: add audio, vibration, and pressure effects for timer countdown"
```

---

## Task 16: PWA & SEO

**Files:**
- Create: `public/manifest.json`, `public/robots.txt`, `src/app/sitemap.ts`
- Modify: `next.config.ts`, `src/app/layout.tsx`

- [ ] **Step 1: Install PWA dependency**

```bash
pnpm add @ducanh2912/next-pwa
```

- [ ] **Step 2: Create PWA manifest**

Create `public/manifest.json`:

```json
{
  "name": "Mimica - Jogo de Mimica",
  "short_name": "Mimica",
  "description": "Jogo de mimica para grupos. Divirta-se com seus amigos!",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#eef2ff",
  "theme_color": "#4f46e5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Note: The engineer should create `public/icons/icon-192.png` and `public/icons/icon-512.png`. Use a simple game-related icon. A placeholder can be generated with any image tool.

- [ ] **Step 3: Update next.config.ts for PWA**

Replace `next.config.ts`:

```typescript
import createNextIntlPlugin from "next-intl/plugin"
import withPWAInit from "@ducanh2912/next-pwa"
import type { NextConfig } from "next"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {}

export default withPWA(withNextIntl(nextConfig))
```

- [ ] **Step 4: Create robots.txt**

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://mimica.app/sitemap.xml
```

- [ ] **Step 5: Create sitemap**

Create `src/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://mimica.app",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
```

- [ ] **Step 6: Update layout with PWA meta tags**

In `src/app/layout.tsx`, update the metadata export:

```typescript
export const metadata: Metadata = {
  title: "Mimica - Jogo de Mimica",
  description: "Jogo de mimica para grupos. Divirta-se com seus amigos!",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  openGraph: {
    title: "Mimica - Jogo de Mimica",
    description: "Jogo de mimica para grupos. Divirta-se com seus amigos!",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mimica",
  },
}
```

- [ ] **Step 7: Add .gitignore entries for PWA**

Append to `.gitignore`:

```
# PWA
public/sw.js
public/workbox-*.js
public/swe-worker-*.js

# Superpowers
.superpowers/
```

- [ ] **Step 8: Verify build succeeds**

```bash
pnpm build
```

Expected: Build succeeds. PWA files generated in public/ (in production mode).

- [ ] **Step 9: Commit**

```bash
git add public/manifest.json public/robots.txt src/app/sitemap.ts next.config.ts src/app/layout.tsx .gitignore
git commit -m "feat: add PWA manifest, service worker, SEO metadata, and sitemap"
```

---

## Task 17: Final Integration & Polish

**Files:**
- Modify: `src/app/game/play/page.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Add word pool exhaustion toast**

Modify `src/stores/game-store.ts` — the `drawWord` function should return a boolean indicating pool reset. Instead, use a flag in state.

Add to `GameState` in `src/data/types.ts`:

```typescript
export interface GameState {
  // ... existing fields
  poolWasReset: boolean
}
```

Add `poolWasReset: false` to initialState in `game-store.ts` and set it to `true` when pool resets in `drawWord`:

In the `drawWord` function, change the pool exhaustion block to:

```typescript
if (available.length === 0) {
  available = getAvailableWords(
    settings.selectedCategories,
    settings.difficulty,
    [],
  )
  set({ usedWordIds: [], poolWasReset: true })
}
```

Add a `clearPoolResetFlag` action:

```typescript
clearPoolResetFlag: () => set({ poolWasReset: false }),
```

In `src/app/game/play/page.tsx`, add toast on pool reset:

```typescript
import { toast } from "sonner"

// Inside the component, after drawWord is called (in useEffect or on mount):
const poolWasReset = useGameStore((s) => s.poolWasReset)
const clearPoolResetFlag = useGameStore((s) => s.clearPoolResetFlag)

useEffect(() => {
  if (poolWasReset) {
    toast(t("toast.wordsReset"))
    clearPoolResetFlag()
  }
}, [poolWasReset, clearPoolResetFlag])
```

Note: The `t` here should use `useTranslations("toast")` or `useTranslations()` with the full key path.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass.

- [ ] **Step 3: Run linter**

```bash
pnpm lint
```

Fix any Biome warnings.

- [ ] **Step 4: Run production build**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Manual E2E test**

```bash
pnpm dev
```

Test the full flow:
1. Open http://localhost:3000
2. Create 2+ teams with different colors
3. Start a new game with selected categories/difficulty/timer
4. Play through several words — verify turn/play/result cycle works
5. Check ranking page shows accurate stats
6. Edit categories mid-game from turn screen
7. End game and verify reset
8. Test responsive layout at different screen widths

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add pool reset toast and final integration polish"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All sections covered — game rules, pages, data model, categories, UI screens, timer/pressure, i18n, PWA, SEO, future considerations
- [x] **Placeholder scan:** No TBD/TODO items. Sound files require manual creation (documented).
- [x] **Type consistency:** `PlayResult`, `PressurePhase`, `GameState`, `TeamStats` used consistently across all tasks. `drawWord`, `submitResult`, `getCurrentTeamId`, `getNextTeamId`, `getRoundNumber` match between store definition (Task 5) and page usage (Tasks 11-13).
- [x] PWA icons noted as manual creation step
- [x] Sound files noted as manual creation step (with ffmpeg fallback)
