# Configurar e sair do jogo na tela `/play`

**Data:** 2026-04-19
**Status:** design aprovado, aguardando plano de implementação

## Problema

A tela `/play` é a experiência ativa de jogo (palavra + cronômetro + ações). Hoje, para alterar qualquer regra da partida em andamento (categorias, dificuldade, tempo) ou sair do jogo, o usuário precisa completar a rodada atual e navegar até outra tela (`/turn` para categorias, `/ranking` para encerrar). Isso interrompe o fluxo quando o grupo quer ajustar dificuldade "em tempo real" ou quando alguém precisa pausar/encerrar.

## Objetivo

Adicionar, no próprio `/play`:
1. **Menu de configuração** que permite alterar categorias, dificuldade e cronômetro sem perder o placar.
2. **Duas ações de saída**: voltar para home preservando o jogo (retomável) **ou** encerrar o jogo (zera estado).

O cronômetro pausa enquanto o menu estiver aberto e retoma ao fechar.

## Escopo

**Incluído:**
- Botão `⋮` no header da `/play` abrindo um `Sheet`.
- Edição ao vivo de `selectedCategories`, `difficulty`, `timerMode`, `timerSeconds`.
- Re-sorteio automático da palavra atual quando ela deixa de encaixar nos novos filtros (sem contar como `skipped`).
- Trava do cronômetro corrente: mudanças em `timerMode`/`timerSeconds` só valem a partir da próxima rodada.
- Ação "Voltar para home" (preserva estado persistido).
- Ação "Encerrar jogo" com confirmação (chama `resetGame()`).

**Fora de escopo (YAGNI):**
- Editar times ou jogadores mid-game.
- Histórico de configurações.
- Atalho de teclado / gestos.
- Animações customizadas do sheet além do padrão do componente.
- Testes de UI (o projeto não tem harness para isso).

## Arquitetura

### Entrada na UI

Novo botão `⋮` (lucide `EllipsisVertical`) no header da `/play`, à direita do botão de mudo. Ao clicar, abre um `Sheet` (`src/components/ui/sheet.tsx`, já existente). O sheet se ancora por baixo no mobile e lateral à direita no desktop — comportamento padrão do componente.

Layout do header passa a ser:

```
[• Nome do time]        [Rodada N]        [🔊] [⋮]
```

### Conteúdo do sheet (`PlayMenuSheet`)

Componente novo: `src/components/game/play-menu-sheet.tsx`.

Props:
```ts
{
  open: boolean
  onOpenChange: (open: boolean) => void
  onExitHome: () => void
  onEndGame: () => void
}
```

Estrutura (top → bottom):

**Bloco "Configurar"** — reaproveita controles da `/setup`:
- `CategoryGrid` (múltipla escolha)
- Botões de dificuldade (`easy` / `medium` / `hard`)
- Botões de modo de cronômetro (`countdown` / `unlimited`) + segundos (30/60/90) quando `countdown`

Cada controle lê do `game-store` via `settings` e escreve via a nova action `updateSettings(partial)`. Edição é direta (sem botão "Salvar").

**Divisor**

**Bloco "Sair"** — dois botões empilhados:
- `Voltar para home` (`variant="outline"`) → chama `onExitHome`.
- `Encerrar jogo` (`variant="destructive"`) → abre um `Dialog` interno ao `PlayMenuSheet` de confirmação reaproveitando a chave i18n `ranking.endGameConfirm`. Se confirmado, chama `onEndGame`.

### Lógica de aplicação imediata

Nova action `updateSettings(partial: Partial<GameSettings>)` no `game-store`:

1. Merge de `partial` em `settings`.
2. Validação: se a mudança resultaria em `selectedCategories.length === 0`, ignora o update (mantém o estado anterior).
3. Se `selectedCategories` **ou** `difficulty` mudaram e `currentWord` não encaixa mais nos novos filtros (`!newCategories.includes(currentWord.category) || newDifficulty !== currentWord.difficulty`):
   - Sorteia uma nova palavra usando a mesma lógica de `drawWord` (mesmo fluxo de pool reset com `poolWasReset: true` quando aplicável).
   - **Não** incrementa `skipped` do time atual.
4. Mudanças em `timerMode` / `timerSeconds` só atualizam `settings` — não afetam a palavra nem o cronômetro em execução.

A action `updateCategories` existente é substituída por `updateSettings`. O chamador em `/turn` passa a usar `updateSettings({ selectedCategories })`.

### Cronômetro travado por rodada

`useTimer` deve garantir que mudanças em `seconds`/`mode` **durante** uma execução não reiniciem nem recalculem o tempo restante. A implementação captura os valores correntes em um `useRef` no momento do `start()`; props subsequentes são ignoradas até o próximo `start()`. Como cada rodada re-monta a `/play` (ao voltar de `/result`), o valor fresco é lido naturalmente no início da próxima rodada.

### Pausa/retomada do cronômetro

Na `/play`:
- `useEffect` observa `menuOpen`.
- Ao abrir: salva `wasRunning = timer.isRunning` em uma ref e chama `timer.pause()`.
- Ao fechar: se `wasRunning`, chama `timer.start()` (ou resume equivalente do hook).
- Se o usuário clicou "Voltar para home" ou "Encerrar jogo", o unmount já pausa via o efeito de cleanup existente.

### Ações de saída

- **`onExitHome`** → `router.push("/")`. Estado do `game-store` já persiste em localStorage (chave `charades-game`), então o fluxo existente de "Continuar Jogo" na home (`src/app/page.tsx` — `home.continueGame`) retoma o jogo de onde parou. Se necessário, ajustar o botão "Continuar Jogo" da home para redirecionar a `/game/play` quando houver `currentWord` e time ativo — verificar no código atual.
- **`onEndGame`** (após confirmação) → `resetGame()` → `router.push("/")`.

## Arquivos

### Novos
- `src/components/game/play-menu-sheet.tsx`

### Modificados
- `src/app/game/play/page.tsx` — botão `⋮`, estado `menuOpen`, efeito de pausa/retoma, handlers.
- `src/stores/game-store.ts` — substitui `updateCategories` por `updateSettings`.
- `src/app/game/turn/page.tsx` — migra chamada de `updateCategories` para `updateSettings`.
- `src/hooks/use-timer.ts` — verificar e, se necessário, travar `seconds`/`mode` em ref no `start()` para que props mutáveis não reiniciem o tempo restante em execução.
- `src/messages/pt-BR.json` — novas chaves em `play`: `menu`, `configure`, `exitHome`, `endGame`, `endGameConfirm`. Reaproveita de `ranking` quando textos coincidem.

## Testes (Vitest)

### `src/stores/__tests__/game-store.test.ts`
- `updateSettings` mantém `currentWord` quando a palavra ainda encaixa.
- `updateSettings` re-sorteia `currentWord` quando a categoria da palavra é removida; `teamStats[*].skipped` não aumenta.
- `updateSettings` re-sorteia `currentWord` quando a dificuldade muda; `teamStats[*].skipped` não aumenta.
- `updateSettings` dispara `poolWasReset` quando nenhum filtro novo tem palavras disponíveis.
- `updateSettings` com `selectedCategories: []` é ignorado (estado anterior preservado).
- `updateSettings` alterando apenas `timerSeconds` ou `timerMode` não muda `currentWord`.

### `src/hooks/__tests__/use-timer.test.ts`
- Mudar o prop `seconds` durante `isRunning === true` não reinicia o tempo restante.
- Novo valor de `seconds` é aplicado no próximo `start()`.

## Riscos e considerações

- **Pool reset silencioso:** se o usuário aperta os filtros a ponto de esvaziar o pool, o sistema já exibe o toast `wordsReset` — comportamento herdado de `drawWord`, consistente com a UX atual.
- **Mudança repetida de categoria:** cada toggle pode disparar re-sorteio. Se o fluxo ficar barulhento visualmente, podemos adicionar debounce depois — mas a probabilidade é baixa (o usuário escolhe e fecha o sheet).
- **Texto de confirmação de `Encerrar jogo`:** reuso de `ranking.endGameConfirm` mantém consistência. Se depois for preciso distinguir os dois pontos de entrada, adiciona-se uma chave nova.
