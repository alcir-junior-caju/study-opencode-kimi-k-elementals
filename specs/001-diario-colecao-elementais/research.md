# Research: Diário de Coleção Elementais

**Fase 0 do plano** | Data: 2026-08-06 | Feature: `001-diario-colecao-elementais`

O contexto técnico obrigatório fornecido no comando `/speckit.plan` já resolve a stack, a persistência, o catálogo, os testes, o deploy e as metas — não restou nenhum `NEEDS CLARIFICATION`. Esta fase consolida as decisões de implementação derivadas do HLD-01, dos FDD-01 a FDD-05, dos DIAGRAMS-01 a 05 e da inspeção do repositório (seed `src/data/catalog.json` e assets já existentes).

---

## R1. Adaptador SvelteKit para site 100% estático

- **Decision**: `@sveltejs/adapter-static` com `export const prerender = true` no `+layout.ts` raiz. Todas as rotas são pré-renderizadas em build: `/`, `/colecao` e `/elemental/[id]` para os 117 IDs via `entries()`. O artefato (`build/`) é HTML/CSS/JS puro, publicável em Netlify **ou** Vercel sem mudança de código.
- **Rationale**: a constituição (I) proíbe servidor em runtime; o HLD-01 exige artefato portável entre provedores e deixa a escolha Netlify × Vercel pendente. O adapter-static remove o provedor da equação — a decisão pendente vira mera configuração de deploy, sem impacto no código.
- **Alternatives considered**: `adapter-netlify`/`adapter-vercel` específicos (rejeitados: acoplam o artefato ao provedor sem ganho, já que não há funções serverless); SPA fallback único com roteamento só no cliente (rejeitado: perde pré-renderização por rota, prejudicando a meta de cold start e o 404 semântico de IDs inválidos).

## R2. Carga do catálogo sem fetch (embutido no bundle)

- **Decision**: o módulo de catálogo importa `src/data/catalog.json` estaticamente (`import catalog from '$data/catalog.json'` via alias, ou caminho relativo `../../data/catalog.json`). O Vite serializa o JSON no chunk da rota; nenhuma requisição de rede ocorre em runtime. A normalização (índice por ID, sequência canônica, grupos) acontece uma única vez na inicialização do módulo, em memoização lazy.
- **Rationale**: FR-012 exige zero chamada de rede para o catálogo; ~22 KB de JSON têm custo irrisório no bundle e eliminam latência e estados de carregamento do catálogo, sustentando a meta de 200 ms (constituição III).
- **Alternatives considered**: fetch de `/catalog.json` servido de `static/` (rejeitado: adiciona round-trip, estado de loading e ponto de falha sem benefício para 117 itens); geração de TS a partir do JSON em build (rejeitado: etapa extra de codegen sem ganho sobre o import nativo de JSON do Vite).

## R3. Ordenação canônica por chave de rank (não pela ordem do JSON)

- **Decision**: a sequência estável do catálogo é derivada de ranks explícitos definidos em `lib/domain/elemental.ts`: `RARITY_ORDER` (Raro → Especial → Épico → Lendário → Mítico), `TYPE_ORDER` (os 25 tipos na ordem das linhas de `docs/elementals.md`) e `VARIATION_ORDER` (Normal, Dourado, Gelatinoso, Galático, Metalizado, Cubo, Gema, Quack). O comparador ordena por `(rarityRank, typeRank, variationRank)`. A sequência resultante (117 posições) rege `groupedByRarityAndType`, `getNeighbors` e a lista da coleção. Um teste unitário fixa a sequência esperada para o seed atual (mitigação do risco de ordem instável, FDD-03 §10).
- **Rationale**: inspeção do seed real mostrou que a ordem de inserção do JSON **não** coincide com a ordenação canônica (ex.: itens Lendários aparecem antes de Épicos no arquivo). O FDD-03 §4/DIAGRAMS-03 determinam chave de ordenação estável, nunca ordem de inserção.
- **Alternatives considered**: reordenar o arquivo `catalog.json` fisicamente (rejeitado: frágil — qualquer reimportação do conjunto do jogo poderia quebrar a ordem silenciosamente; a chave de rank é explícita e testável); ordenar alfabeticamente por nome (rejeitado: não corresponde à tabela-fonte, exigida pela spec FR-005).

## R4. Formato do seed e schema de validação

- **Decision**: manter o formato já existente do seed — `{ "elementals": [ { id, type, rarity, variation, imagePath } ] }` — com valores de exibição em pt-BR (`type: "Água"`, `rarity: "Raro"`, `variation: "Normal"`) e IDs no padrão `<slug-do-tipo>_<slug-da-variação>` (ex.: `water_basic`, `water_gold`; sufixos: `basic`, `gold`, `candy`, `galaxy`, `holofoil`, `cube`, `gem`, `quack`). O schema `zod` em `scripts/validate-seed.mjs` valida: estrutura de cada item, unicidade de IDs, pertencimento aos enums (5 raridades, 8 variações, 25 tipos), padrão do ID, regra de negócio "variação não-Normal ⇒ raridade Especial" (nota de `docs/elementals.md`), cardinalidade total (117) e existência de cada `imagePath` em disco.
- **Rationale**: o seed já existe e está íntegro (117 itens, 0 IDs duplicados, 0 imagens ausentes — verificado por inspeção). Manter o formato evita migração desnecessária; a validação de regras cruzadas (variação × raridade, contagem) cobre a classe de erros que a tabela-fonte poderia introduzir em reimportações.
- **Alternatives considered**: normalizar `type` para slug em inglês e derivar o nome de exibição (rejeitado: mudança de schema sem requisito; o seed é a fonte da verdade e os nomes pt-BR são os exibidos); incluir `zod` no runtime para revalidar o seed a cada carga (rejeitado: inflaria o bundle — meta de 150 KB — para validar um dado já garantido pelo build; em runtime o módulo faz apenas uma checagem de integridade estrutural mínima, ver R5).

## R5. Checagem de integridade do catálogo em runtime (defesa em profundidade)

- **Decision**: na carga, o módulo de catálogo executa uma verificação estrutural mínima e síncrona (array presente, 117 itens, campos obrigatórios string não vazios, IDs únicos). Em falha, lança `CatalogIntegrityError`; a página inicial captura e exibe mensagem de erro no lugar da listagem. A validação profunda (enums, regras cruzadas, imagens) permanece exclusiva do pipeline.
- **Rationale**: cenário de aceitação 5 da HU1 (spec) exige mensagem de erro em vez de lista vazia silenciosa em falha de integridade; o FDD-02 §6 proíbe lista silenciosa. Como o build já bloqueia seed inválido, a checagem de runtime é barata (uma passada O(n)) e cobre corrupção de artefato/CDN.
- **Alternatives considered**: confiar apenas na validação do pipeline (rejeitado: não atende ao cenário de aceitação em caso de artefato corrompido pós-build); validação completa com `zod` no cliente (rejeitada em R4 pelo custo de bundle).

## R6. Adaptador de persistência e formato do registro

- **Decision**: `idb-keyval` com uma única chave `collection` contendo `CollectionRecord = { version: 1, ids: string[] }`. O adaptador (`lib/persistence/idb-adapter.ts`) implementa `loadCollection()`, `saveCollection(ids)`, `isStorageAvailable()` conforme contrato do FDD-01, com: timeout de 2 s por operação (Promise race), 1 retry automático de leitura com backoff exponencial de 200 ms + jitter, validação estrutural do registro na leitura (objeto com `version` numérico e `ids` como lista de strings; inválido ⇒ descarte e coleção vazia) e erros tipados (`StorageWriteError`, `StorageReadError`, `StorageUnavailableError`). `loadCollection` nunca rejeita por registro ausente (retorna `[]`). `navigator.storage.persist()` é solicitado na inicialização quando a API existe, sem bloquear a hidratação.
- **Rationale**: é exatamente o contrato do FDD-01 §5 e a invariante "sem falha silenciosa" da constituição V; o registro versionado permite migração futura sem quebra (FDD-01 §8).
- **Alternatives considered**: uma chave por ID colecionado no idb-keyval (rejeitado: 117 operações de leitura na hidratação em vez de 1; mais superfície de falha); `localStorage` (rejeitado: API síncrona bloqueante, limites menores e contrário à decisão do HLD/ADR 002).

## R7. Store da coleção: serialização de toggles e rollback

- **Decision**: `lib/stores/collection.ts` mantém um `writable<Set<string>>` interno e expõe `collection` (Readable), `has(id)` (Readable derivado por ID), `toggle(id): Promise<void>`, `status: Readable<'hydrating' | 'active' | 'degraded'>` e `hydrate(): Promise<void>`. O toggle: (1) valida o ID contra o catálogo (ID inexistente ⇒ rejeita sem gravar); (2) atualiza o conjunto em memória; (3) serializa a gravação numa fila interna (uma operação por vez — toggles concorrentes aguardam); (4) em `StorageWriteError`/timeout, reverte o conjunto ao estado anterior e rejeita, permitindo à UI exibir a mensagem sem alterar o estado visual. Órfãos lidos na hidratação são descartados silenciosamente e removidos do registro na próxima gravação válida. Em modo `degraded`, `toggle` rejeita imediatamente e a UI desabilita os controles.
- **Rationale**: invariantes do FDD-01 §6 ("estado visual nunca diverge do conteúdo confirmado") e do FDD-01 §5 ("uma gravação por vez, com serialização de toggles concorrentes"). A fila torna o comportamento determinístico e trivialmente testável com `fake-indexeddb`.
- **Alternatives considered**: escrita otimista sem rollback (rejeitado: viola a invariante central e a constituição V); `debounce` de gravações (rejeitado: adia a confirmação e complica o feedback imediato exigido por FR-006).

## R8. Store derivada da coleção pessoal

- **Decision**: `lib/stores/collected-items.ts` expõe `collectedItems: Readable<Elemental[]>` (deriva de `collection` × módulo de catálogo: resolve cada ID, descarta órfãos, ordena pela sequência canônica), `isEditing: Writable<boolean>` e `remove(id): Promise<void>` (delega a `toggle` da Store base — remoção só aparece na lista após gravação confirmada, pois a derivação lê o conjunto já confirmado).
- **Rationale**: contrato do FDD-04 §5; a proibição de remoção otimista sai de graça da arquitetura — o item sai da lista apenas quando o conjunto persistido muda.
- **Alternatives considered**: estado separado da lista na página (rejeitado: duplicaria a fonte de verdade e abriria espaço para divergência com o IndexedDB).

## R9. Rota dinâmica e tratamento de ID inválido

- **Decision**: `src/routes/elemental/[id]/+page.ts` exporta `entries()` retornando os 117 IDs do seed (pré-render completa) e `load()` que resolve o ID via módulo de catálogo: ID inválido em navegação client-side ⇒ `redirect(307, '/')` do SvelteKit; acesso direto a URL de ID inexistente ⇒ o provedor serve a página 404 pré-renderizada (`+error.svelte`) com orientação de retorno ao catálogo. `getNeighbors(id)` calcula vizinhos pela posição na sequência canônica com wrap-around aritmético (`(pos ± 1 + total) % total`).
- **Rationale**: FR-016 e FDD-03 §5/§6 exigem redirecionamento suave, nunca tela em branco; pré-renderizar os 117 IDs cobre o caso comum com resposta < 200 ms via CDN.
- **Alternatives considered**: fallback SPA para qualquer ID (rejeitado: perderia o 404 semântico monitorável no painel do provedor, métrica citada no FDD-03 §7).

## R10. Stack de testes com Svelte 5 + Jest

- **Decision**: Jest 29.7 com `svelte-jester` (compilação de `.svelte`), `ts-jest` (TypeScript), `jest-environment-jsdom` e `@testing-library/svelte` 5 nos testes unitários/de componente (raízes `tests/unit`); `fake-indexeddb` 6 auto-injetado (`fake-indexeddb/auto`) nos testes de integração do adaptador e da Store (`tests/integration`); Playwright 1.44 contra o build pré-renderizado servido localmente (`vite preview` ou servidor estático da pasta `build/`) para o e2e do fluxo crítico (`tests/e2e`).
- **Rationale**: stack mandatória da constituição IV e do contexto técnico do comando; servir o artefato real no e2e valida também a pré-renderização (rotas e 404).
- **Alternatives considered**: Vitest (rejeitado: a constituição fixa Jest explicitamente); e2e contra `vite dev` (rejeitado: dev server não reflete o artefato de produção nem exercita as páginas pré-renderizadas).

## R11. Medição das metas de engenharia no CI

- **Decision**: `scripts/measure-budgets.mjs`, executado após o build no pipeline: (1) soma o tamanho gzip dos chunks JS/CSS da rota inicial (`/`) lidos do manifest do Vite — falha se ≥ 150 KB; (2) mede o tempo de carregamento do catálogo com Playwright (navegação com cache aquecido até a listagem estar renderizada) — falha se ≥ 200 ms no ambiente de CI. Ambos os valores são registrados no log do job (histórico de tendência, FDD-05 §7).
- **Rationale**: constituição III torna as metas bloqueantes; FDD-05 §5 define os gates e o formato do resultado por stage.
- **Alternatives considered**: Lighthouse CI (rejeitado: pesado e instável para um gate binário simples; a métrica exigida é específica — bytes gzip do bundle inicial e tempo até a listagem); bundlesize/size-limit genérico (rejeitado: script próprio é ~50 linhas, sem dependência extra, e mede exatamente o definido no FDD).

## R12. Assets de imagem sob `static/`

- **Decision**: mover o conteúdo de `assets/elementals/<tipo>/*.webp` (hoje na raiz do repositório) para `static/assets/elementals/<tipo>/`. O SvelteKit serve `static/` na raiz do site, então os valores de `imagePath` do seed (`assets/elementals/water/water_gold.webp`) continuam válidos sem alteração. Componentes de imagem usam `loading="lazy"`, `alt` com nome do elemental e fallback para o placeholder do tipo/variação em erro de carga.
- **Rationale**: convenção obrigatória do SvelteKit para assets estáticos; FR-014 exige placeholder por tipo e variação sem quebrar navegação/marcação; os caminhos padronizados permitem trocar placeholders pelos assets finais sem mudar código (HLD-01, risco "assets não entregues").
- **Alternatives considered**: importar imagens pelo Vite para hashing (rejeitado nesta entrega: exigiria rewrite dos `imagePath` ou glob imports; com placeholders temporários, servir de `static/` é mais simples e já atende lazy loading + cache de CDN); manter `assets/` na raiz fora de `static/` (rejeitado: não seria servido pelo SvelteKit).

## R13. Provedor de hosting e pipeline

- **Decision**: pipeline em GitHub Actions (`.github/workflows/ci.yml`) com stages `validate_seed → tests → build → measure → deploy`, gatilhos `push`/`pull_request` na branch principal, concorrência cancelando execuções obsoletas, timeout de 15 min por job e até 3 tentativas com backoff (30 s + jitter) na publicação. O deploy usa a integração nativa do provedor (Netlify ou Vercel) apontando para o diretório `build/`; o token vive apenas no cofre de segredos do CI. A escolha final do provedor permanece aberta (decisão pendente do HLD) e é irrelevante para o código graças ao R1.
- **Rationale**: FDD-05 §4/§5/§6 na íntegra; artefato portável satisfaz o plano de contingência de troca de provedor.
- **Alternatives considered**: deploy via CLI do provedor no GitHub Actions (aceito como detalhe de implementação equivalente — o essencial é o artefato portável e o segredo fora do repositório); Netlify/Vercel Git integration sem workflow próprio (rejeitado: os gates de schema, testes e metas precisam rodar antes e bloquear a publicação).

---

**Conclusão da Fase 0**: todas as decisões necessárias à Fase 1 estão tomadas e rastreadas aos documentos-fonte; nenhum ponto de `NEEDS CLARIFICATION` permanece.
