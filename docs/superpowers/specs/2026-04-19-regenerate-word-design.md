# Regenerar Palavra — Design

**Data:** 2026-04-19
**Escopo:** Substituir a ação "Pular" na tela de jogada por uma ação de "Trocar palavra" que re-sorteia sem encerrar a jogada.

## Contexto

Hoje a tela `/game/play` exibe três botões:

- **Pular** (amarelo) — registra resultado `"skipped"`, passa para o próximo time, vai para `/game/result`.
- **Errou** (vermelho) — registra `"wrong"`, mesmo fluxo.
- **Acertou** (verde) — registra `"correct"`, mesmo fluxo.

Usuários reportaram que, quando a pessoa que mima acha que a palavra atual é inadequada (muito difícil, já tentou mimar antes, etc.), não existe uma forma de pedir outra palavra sem consumir a vez do time. O botão "Pular" cumpre esse papel hoje, mas com efeito colateral indesejado: encerra a jogada.

## Objetivo

Transformar o botão "Pular" em uma ação de **regenerar a palavra atual** dentro da jogada em andamento, sem penalização e sem mudança de time.

## Decisões

1. **Ilimitado e grátis.** Sem limite de regenerações por jogada. Timer continua correndo — a pressão de tempo é o único custo.
2. **Palavra descartada volta ao pool.** Pode ser sorteada de novo em jogadas futuras da mesma partida.
3. **Contador visível.** Cada regeneração incrementa `TeamStats.skipped` do time atual. A UI passa a exibir esse número como **"Trocadas"** (ranking, resultado, scoreboard).

## Mudanças

### Tipos (`src/data/types.ts`)

- `PlayResult` passa de `"correct" | "wrong" | "skipped"` para `"correct" | "wrong"`. O resultado "skipped" deixa de existir — regenerar não é um resultado de jogada, é uma ação intra-jogada.
- `TeamStats.skipped` permanece (semântica muda: agora é "palavras trocadas pelo time").

### Store (`src/stores/game-store.ts`)

- Nova ação `regenerateWord()`:
  1. Incrementa `teamStats[currentTeamId].skipped`.
  2. Sorteia uma palavra **diferente da atual** do pool disponível (filtro por categorias, dificuldade e `usedWordIds`, excluindo explicitamente `currentWord.id`).
  3. Se o pool filtrado ficar vazio (caso só reste a atual), reseta `usedWordIds = []` e marca `poolWasReset = true` (comportamento idêntico ao `drawWord`).
  4. Atualiza `currentWord` com a nova palavra. **Não** mexe em `usedWordIds` para a palavra descartada — ela volta ao pool. **Não** adiciona a nova palavra em `usedWordIds` (só é adicionada quando a jogada termina via `submitResult`).
- `submitResult` deixa de tratar o caso `"skipped"` (não é mais possível chamar com esse valor).
- `drawWord` segue inalterado — continua sendo responsável por adicionar a palavra em `usedWordIds` quando é sorteada no início de uma jogada.

**Nota sobre `usedWordIds`:** Hoje `drawWord` adiciona a palavra sorteada em `usedWordIds` na hora do sorteio. Para que a palavra descartada "volte ao pool", `regenerateWord` precisa remover a `currentWord.id` atual de `usedWordIds` antes (ou ao mesmo tempo em que) sorteia a nova, e adicionar a nova em `usedWordIds`. Na prática:

```
regenerateWord:
  usedWithoutCurrent = usedWordIds.filter(id => id !== currentWord.id)
  available = filter(categorias, dificuldade, usedWithoutCurrent) excluindo currentWord.id
  if vazio: usedWithoutCurrent = []; poolWasReset = true; re-filter
  nova = random(available)
  usedWordIds = [...usedWithoutCurrent, nova.id]
  currentWord = nova
  teamStats[currentTeamId].skipped += 1
```

Isso mantém o invariante de que `currentWord.id ∈ usedWordIds` enquanto a jogada está em andamento, e a palavra descartada sai de `usedWordIds` (volta ao pool).

### Componente de botões (`src/components/game/action-buttons.tsx`)

- Prop nova: `onRegenerate: () => void`.
- Botão amarelo passa a chamar `onRegenerate` no `onClick`.
- Ícone muda de `ArrowRight` para `RotateCw` (lucide-react).
- Label usa `t("regenerate")` no lugar de `t("skip")`.

### Página de jogada (`src/app/game/play/page.tsx`)

- Novo handler `handleRegenerate` que chama `useGameStore.regenerateWord()`. Não pausa o timer, não navega.
- Passa `onRegenerate={handleRegenerate}` ao `ActionButtons`.
- `handleAction` recebe apenas `"correct" | "wrong"` (tipo atualizado).

### Traduções (`src/messages/pt-BR.json`)

- `play.skip` removido, `play.regenerate` adicionado com texto **"Trocar"**.
- `stats.skipped` (ou chave equivalente usada no ranking/resultado/scoreboard) passa a exibir **"Trocadas"** em vez de **"Puladas"**.
- Outros textos que mencionem "pular" / "puladas" no contexto de estatísticas são revisados para "trocar" / "trocadas".

### Testes (`src/stores/__tests__/game-store.test.ts`)

- Remover/ajustar testes que chamam `submitResult("skipped")`.
- Adicionar testes para `regenerateWord`:
  - Incrementa `skipped` do time atual.
  - Não muda `currentTeamIndex`.
  - Nova palavra é diferente da atual.
  - Palavra descartada volta ao pool (pode ser sorteada de novo).
  - Pool esgotado (só a atual disponível) → reseta pool e sinaliza `poolWasReset = true`.

## Arquivos impactados

- `src/data/types.ts`
- `src/stores/game-store.ts`
- `src/stores/__tests__/game-store.test.ts`
- `src/components/game/action-buttons.tsx`
- `src/app/game/play/page.tsx`
- `src/messages/pt-BR.json`
- `src/components/game/ranking-table.tsx` (só labels, se houver texto hardcoded)
- `src/app/game/result/page.tsx` (só labels, se houver texto hardcoded)
- `src/app/ranking/page.tsx` (só labels, se houver texto hardcoded)

## Fora de escopo

- Animação/transição visual ao trocar palavra (pode ser adicionada depois).
- Limite de regenerações ou custo em tempo (decidido: sem limite).
- Telemetria/analytics de quantas vezes foi usado.
- Migração de partidas salvas em andamento — `PlayResult` muda, mas `TeamStats.skipped` persiste com semântica nova; partidas já concluídas continuam legíveis.
