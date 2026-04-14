# Charades Game — Design Spec

## Overview

App de jogo de mímica (charades) para grupos. Um jogador vê a palavra no celular e faz a mímica, enquanto os outros tentam adivinhar. Times se alternam a cada palavra. Jogo livre sem limite de rodadas — os jogadores decidem quando parar.

**Stack:** Next.js (App Router) + TypeScript + Biome + Tailwind CSS + Shadcn UI + Lucide + Zustand

## Game Rules

- **Alternância por palavra:** cada time joga uma palavra por vez, depois passa para o próximo time
- **Pontuação:** +1 por acerto, 0 por erro, 0 por pular
- **Times:** 2 ou mais, sem limite. Cada time tem nome e cor (paleta pré-definida de 8 cores)
- **Rodadas:** sem limite fixo — jogo livre com ranking acumulado
- **Jogo ativo:** apenas um jogo ativo por vez. O jogo persiste e pode ser retomado a qualquer momento
- **Categorias:** editáveis durante o jogo (adicionar/remover seleção). Times são fixos na partida

## Pages & Navigation

Hub central (Home) com botões grandes. Navegação por ação, sem menu fixo.

```
/                  → Home (Hub)
/teams             → CRUD de times
/game/setup        → Configuração do jogo (categorias, dificuldade, timer)
/game/play         → Tela de jogo (palavra, timer, ações)
/game/result       → Tela de transição (feedback acerto/erro/pular)
/game/turn         → Tela de preparação ("Vez do time X")
/ranking           → Ranking detalhado da partida ativa
```

### Flow

1. Home → "Novo Jogo" (ou "Continuar Jogo" se ativo), "Times", "Ranking" (se jogo ativo)
2. "Novo Jogo" → `/game/setup` → selecionar times (mínimo 2), categorias (mínimo 1), dificuldade, timer
3. Iniciar → `/game/turn` → "Vez do [Time X]" + botão "Começar"
4. "Começar" → `/game/play` → palavra + timer + botões (esconder, pular, acertar, errar)
5. Validar → `/game/result` → feedback com placar + botão "Próximo"
6. "Próximo" → `/game/turn` do próximo time → loop
7. Botão voltar ao Hub a qualquer momento. Jogo fica ativo, pode retomar.
8. "Continuar Jogo" na Home → `/game/turn` do time atual (nunca pula direto para `/game/play`).
9. "Novo Jogo" quando há jogo ativo → Dialog de confirmação: "Iniciar novo jogo vai encerrar o jogo atual. Continuar?"
10. Editar categorias durante o jogo: ícone de engrenagem na tela `/game/turn` abre sheet com grid de categorias (mesmo componente do setup). Mínimo 1 categoria deve permanecer selecionada.

## Data Model

```typescript
// Times
interface Team {
  id: string
  name: string
  color: string // hex da paleta pré-definida
}

// Palavras
interface Word {
  id: string
  text: string
  category: CategoryId
  difficulty: 'easy' | 'medium' | 'hard'
}

// Categorias
type CategoryId = 'animals' | 'professions' | 'bible' | 'movies' | 'actions' | 'characters'

interface Category {
  id: CategoryId
  label: string // i18n key
  icon: string  // Lucide icon name
}

// Configuração do Jogo
interface GameSettings {
  selectedTeamIds: string[]
  selectedCategories: CategoryId[]
  difficulty: 'easy' | 'medium' | 'hard'
  timerMode: 'countdown' | 'unlimited'
  timerSeconds: number // 30, 60, 90 (quando countdown)
}

// Estado do Jogo Ativo
interface GameState {
  status: 'idle' | 'setup' | 'playing' | 'paused'
  settings: GameSettings
  currentTeamIndex: number
  currentWord: Word | null
  usedWordIds: string[]
  teamStats: Record<string, TeamStats>
}

// Estatísticas por Time
interface TeamStats {
  correct: number
  wrong: number
  skipped: number
}

// Resultado de uma jogada
type PlayResult = 'correct' | 'wrong' | 'skipped'
```

### Team Color Palette (8 colors)

| Name | Hex | Tailwind Reference |
|---|---|---|
| Vermelho | `#ef4444` | red-500 |
| Azul | `#3b82f6` | blue-500 |
| Verde | `#22c55e` | green-500 |
| Roxo | `#8b5cf6` | violet-500 |
| Laranja | `#f97316` | orange-500 |
| Rosa | `#ec4899` | pink-500 |
| Ciano | `#06b6d4` | cyan-500 |
| Amarelo | `#eab308` | yellow-500 |

Cores já usadas por outros times ficam desabilitadas no seletor.

### Zustand Stores

- `useTeamStore` — CRUD de times (persiste no localStorage)
- `useGameStore` — estado do jogo ativo, settings, stats (persiste no localStorage)

## Categories & Words

### Pre-registered Categories

| ID | Label | Icon (Lucide) |
|---|---|---|
| `animals` | Animais | `PawPrint` |
| `professions` | Profissões | `Briefcase` |
| `bible` | Bíblia | `BookOpen` |
| `movies` | Filmes/Séries | `Clapperboard` |
| `actions` | Ações | `Zap` |
| `characters` | Personagens | `Users` |

### Word Data

- Stored in `data/words.ts` as typed arrays
- ~20-30 words per category, distributed across 3 difficulties
- Total: ~150+ words for initial release

**Difficulty criteria:**
- **Easy** — common words, easy to mime (Gato, Nadar, Batman)
- **Medium** — requires more creativity (Advogado, Titanic, Moisés)
- **Hard** — abstract concepts or lesser-known references (Ornitorrinco, Interestelar, Sansão)

### Word Selection Algorithm

1. Filter by selected categories + chosen difficulty
2. Remove already used words (`usedWordIds`)
3. Random selection from remaining pool
4. If all used, reset pool and show toast: "Todas as palavras foram usadas! Reiniciando o baralho."

## UI Components & Screens

### Visual Style: Soft Gradient

- Background with soft gradients (indigo/violet spectrum)
- White cards with light shadows
- Vibrant pastel colors for accents
- Modern bold typography
- Generous border-radius
- Max-width ~430px centered (mobile first, looks good on desktop)
- No fixed header — each screen has its own visual context

### Home (`/`)

- App logo/name at top
- 3 large stacked buttons: "Novo Jogo" (or "Continuar Jogo" if active), "Times", "Ranking"
- Ranking button only visible if active game exists
- Soft gradient background

### Teams (`/teams`)

- Team list with name and color dot
- "+" button to add team
- Swipe or button to edit/delete
- Modal/Sheet for create/edit: name field + visual color selector (palette)
- Colors already used by other teams are disabled

### Game Setup (`/game/setup`)

- Section "Times": chips of registered teams, select minimum 2
- Section "Categorias": grid of cards with icon + name, toggle to select (minimum 1)
- Section "Dificuldade": 3 buttons (Fácil, Médio, Difícil)
- Section "Timer": toggle Cronômetro/Ilimitado + time selector (30s, 60s, 90s)
- "Iniciar Jogo" button pinned to footer

### Game Turn (`/game/turn`)

- Background in current team's color
- Large centered team name
- Instruction: "Passe o celular para o mímico"
- Large "Começar" button
- Settings icon (gear) — opens sheet to edit category selection mid-game

### Game Play (`/game/play`)

- Top: team info (name, color) + round counter
- Center: large word (with eye icon to hide/show)
- Category badge + difficulty badge
- Large timer (turns red + pulses in last 10s)
- Footer: 3 action buttons — Pular (yellow), Errou (red), Acertou (green)
- Large, spaced buttons for easy touch
- Mute button in top corner

### Game Result (`/game/result`)

- Contextual gradient background (green correct, red wrong, yellow skipped)
- Large animated icon (check, X, arrow) — scale 0→1 with bounce
- Word that was played
- Updated scoreboard of all teams
- Confetti animation on correct answer (CSS particles, no external lib)
- "Próximo: Time [name]" button

### Ranking (`/ranking`)

- Ordered list by score
- Each team: position, name, color, correct, wrong, skipped, accuracy rate (%)
- Visual highlight for 1st place
- "Encerrar Jogo" button with confirmation dialog: "Tem certeza? O placar será apagado." (resets active game)

### Shadcn UI Components Used

Button, Card, Dialog/Sheet, Badge, Toggle, Separator, Sonner (toasts)

## Timer & Pressure Effects

### Countdown Mode

- Counts down from configured time (30s, 60s, 90s) to 0
- Displayed in large format `0:42`
- When reaches 0: timer stops, displays "Tempo!" — players still decide result manually

### Unlimited Mode

- Counts up (0:00 → ...) for reference only
- No pressure effects
- Same action buttons available

### Pressure Effect (Last 10 Seconds, Countdown Only)

| Seconds | Visual | Sound | Vibration |
|---|---|---|---|
| 10-6 | Timer turns red, slow pulse (~1x/s) | Soft tick each second | Short vibration (100ms) each second |
| 5-3 | Faster pulse (~2x/s), light red overlay on screen | Louder, faster tick | Double vibration (100ms-pause-100ms) |
| 2-0 | Intense pulse, stronger red overlay | Accelerating continuous beep | Continuous vibration |

### Technical Implementation

- `useTimer` custom hook with `setInterval` at 100ms for precision
- Vibration API (`navigator.vibrate()`) — works on most Android, Safari ignores silently
- Audio via Web Audio API or `<audio>` with short pre-loaded files (tick.mp3, beep.mp3)
- Sound files in `public/sounds/`
- Global mute button accessible on game screen

## i18n

- Library: `next-intl` — native integration with Next.js App Router
- Structure: `messages/pt-BR.json` (single language for now)
- All UI strings come from message files, none hardcoded
- Game words stay separate in `data/words.ts` (not i18n'd — each language would have its own word set in the future)
- Default locale: `pt-BR`, no language selector for now

## PWA

- `@ducanh2912/next-pwa` for service worker generation
- `manifest.json` with name, icons, colors, `display: standalone`
- Works offline after first load (all words are local)
- "Add to Home Screen" icon on mobile
- Custom splash screen

## SEO

- Metadata via Next.js `generateMetadata`
- Title, description, Open Graph tags on home
- Basic `robots.txt` and `sitemap.xml`
- SEO relevant only for landing page (home) since app is client-side

## Future Considerations

These are NOT in scope for the initial build, but the architecture should not prevent them:

- **Database migration:** all persistence goes through Zustand stores. To migrate: swap localStorage persist middleware for API calls. Data structures use unique IDs (ready for relational DB).
- **New categories/words:** add entry in `categories` + words in array. Future: admin panel or API.
- **New languages:** add `messages/<locale>.json` + word sets per language.
- **No premature abstractions** — just keep data access centralized in stores.

## Project Structure

```
src/
  app/
    page.tsx              # Home (Hub)
    layout.tsx            # Root layout
    teams/page.tsx        # CRUD times
    game/
      setup/page.tsx      # Configuration
      play/page.tsx       # Game screen
      result/page.tsx     # Feedback
      turn/page.tsx       # Team preparation
    ranking/page.tsx      # Ranking
  components/
    ui/                   # Shadcn UI components
    game/                 # Game-specific components
    teams/                # Team components
  stores/
    team-store.ts
    game-store.ts
  data/
    words.ts
    categories.ts
  hooks/
    use-timer.ts
  lib/
    utils.ts
  messages/
    pt-BR.json
public/
  sounds/
    tick.mp3
    beep.mp3
```
