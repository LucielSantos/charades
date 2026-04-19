# Desktop UI Refinement — Design

**Date:** 2026-04-19
**Status:** Approved (brainstorming phase)

## Goal

Improve the desktop (viewport ≥ `md`) experience of the charades app. Mobile remains untouched. The target cenário is a notebook/TV in a party setting — elegant refinement, not a "telão" redesign.

## Guiding constraints (from brainstorm)

1. **Mobile is final** — no changes to mobile layout, sizing, or components.
2. **Consistent central column** across all screens — no screen gets a reflowed desktop layout.
3. **Keep the column exactly 430px wide** — all improvement must come from the surroundings.
4. **Palco + contextual mix** — the column becomes a framed central "stage" card, and during gameplay the surrounding ambient tints reflect current team color and category mood.

## Architecture

### Three layers

A single new component, `DesktopStage`, wraps `{children}` in `src/app/layout.tsx`. It introduces three stacked layers on desktop only (hidden on mobile):

**Layer 0 — Ambient background**
- `fixed inset-0 -z-10 hidden md:block`
- Rich gradient base (replaces the current body gradient, which moves out of `body` into this layer).
- Three blurred gradient blobs (`absolute blur-3xl opacity-40`) positioned left, right, and top-center.
- Slow "breathing" animation (`animate-pulse`-style scale/opacity oscillation ~8s) — non-distracting.

**Layer 1 — Stage card (the existing column)**
- The current `<main className="mx-auto max-w-[430px] min-h-screen">` gets desktop-only classes:
  - `md:rounded-3xl md:shadow-2xl md:my-8 md:min-h-[calc(100vh-4rem)]`
  - `md:bg-white/80 md:backdrop-blur-sm md:border md:border-white/40`
  - Dark-mode equivalents via existing theme tokens.
- Body gets a neutral solid color (the ambient gradient now lives in Layer 0, so `body` can be plain).

**Layer 2 — Contextual tint**
- A new client component `<AmbientTint />` rendered inside `DesktopStage`.
- Reads the game store (Zustand) for: current team color, current category, current route.
- Adjusts CSS custom properties (`--ambient-team`, `--ambient-category`) on the Layer 0 blobs via a style tag on a container div.
- Only active on `/game/turn` and `/game/play`. On every other route, the ambient uses the neutral palette.

### Category → mood color map

| Categoria    | Cor             | Hex/Tailwind                  |
| ------------ | --------------- | ----------------------------- |
| Filmes/Séries | vermelho vinho  | `#7f1d1d` (red-900)           |
| Esportes     | verde esmeralda | `#047857` (emerald-700)       |
| Música       | roxo/púrpura    | `#6b21a8` (purple-800)        |
| Lugares      | azul oceano     | `#075985` (sky-800)           |
| Animais      | âmbar terroso   | `#92400e` (amber-800)         |
| Comida       | laranja quente  | `#c2410c` (orange-700)        |
| Fallback     | índigo neutro   | `#3730a3` (indigo-800)        |

The exact category keys must be read from `src/data/` at implementation time — adjust mappings to match actual category identifiers.

### Neutral palette (non-gameplay routes)

- Blob 1: `indigo-300`
- Blob 2: `violet-300`
- Blob 3: `pink-200`
- Base gradient: `from-indigo-50 via-purple-50 to-violet-100`

### Transitions

- Blobs use `transition-[background-color,opacity] duration-700` so team/category changes fade smoothly.

## Side effects and required adjustments

**Fixed bottom buttons** — several pages use `fixed bottom-0` for CTAs and action buttons. On desktop these anchor to the viewport and would escape the stage card. Audit + change these to `sticky bottom-0` (inside the column flow) so they stay within the card on desktop while keeping the same visual behavior on mobile.

Known files to audit:
- `src/components/game/action-buttons.tsx`
- `src/app/game/setup/page.tsx` (bottom CTA)
- Any other page with `fixed bottom-0` — grep at implementation time.

**Body gradient removal** — the current global body gradient (set in `src/app/layout.tsx` or `globals.css`) moves into Layer 0. The body itself becomes a neutral solid.

**Result screen** (`/game/result`) — already renders a fullscreen green/red gradient above everything. Layer 0 sits behind it and is effectively invisible. No special handling needed beyond ensuring `z-index` layering is correct.

## Components to add

| Path                                                   | Purpose                                                |
| ------------------------------------------------------ | ------------------------------------------------------ |
| `src/components/layout/desktop-stage.tsx`              | Wraps children; renders Layer 0 and Layer 2            |
| `src/components/layout/ambient-tint.tsx`               | Client component reading store; sets CSS vars for tint |

## Components to modify

| Path                                             | Change                                                        |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `src/app/layout.tsx`                             | Wrap `{children}` in `<DesktopStage>`; add desktop card classes to `<main>`; remove body gradient |
| `src/app/globals.css` (if applicable)            | Drop body gradient; add any needed CSS custom props           |
| `src/components/game/action-buttons.tsx`         | `fixed bottom-0` → `sticky bottom-0`                          |
| `src/app/game/setup/page.tsx`                    | Bottom CTA `fixed` → `sticky`                                 |
| Any other file with `fixed bottom-0`             | Same fix                                                      |

## Out of scope

- Any mobile visual change.
- Any layout reflow on desktop (multi-column grids, sidebars, persistent scoreboards, etc.).
- New theming system or dark-mode rework.
- Animations beyond slow ambient breathing and tint transitions.
- Decorative content inside the column (the column's internals stay as-is).

## Success criteria

- On viewports ≥ 768px: the 430px column is visibly framed as a central card over a rich, breathing ambient background.
- On `/game/turn` and `/game/play`: the ambient tint shifts when the current team changes and when the category/word changes, with a visible but subtle transition.
- On viewports < 768px: zero visual change compared to current master.
- Fixed-bottom CTAs still sit at the bottom of the column on both mobile and desktop (not escaping to the viewport edge on desktop).
- No regression in existing tests; no new layout shift or hydration warnings.

## Testing approach

- Manual: run `pnpm dev`, resize viewport across mobile/tablet/desktop breakpoints, run the full game flow (home → setup → turn → play → result → ranking) on desktop and confirm ambient/tint behavior.
- Unit: if any pure logic is introduced (e.g., category-to-color mapping), cover it with a vitest test.
- No new E2E tests required.
