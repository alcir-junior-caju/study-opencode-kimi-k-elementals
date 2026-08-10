# Tasks: Diário de Coleção Elementais

**Input**: Design documents from `/specs/001-diario-colecao-elementais/`

**Prerequisites**: plan.md (tech stack, estrutura), spec.md (histórias de usuário P1–P5), research.md (decisões R1–R13), data-model.md (entidades e ordenação canônica), contracts/ (catalog-module.ts, persistence-adapter.ts, collection-store.ts), quickstart.md (cenários de validação)

**Tests**: INCLUÍDOS — TDD é obrigatório conforme a seção "Testes e validação" de `docs/PRD-diario-colecao-elementais.md` (Jest 29.7 + `@testing-library/svelte` 5 para unitários/componentes; `fake-indexeddb` 6 na persistência; Playwright 1.44 para e2e). Em cada fase, as tasks de teste vêm ANTES das de implementação e devem FALHAR antes do código existir.

**Organization**: fases por história de usuário, seguindo a ordem de dependência dos FDDs: FDD-01 (persistência — fundação) → FDD-02 (catálogo + home, US1) → toggle de posse (US2) → FDD-03 (tela individual, US3) → FDD-04 (coleção pessoal, US4; modo de edição, US5) → FDD-05 (pipeline e deploy).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos distintos, sem dependência de tasks incompletas)
- **[Story]**: história de usuário da fase (US1–US5; fases Setup/Foundational/Polish não levam label)
- Toda task declara o caminho exato do arquivo

## Path Conventions

- Projeto web único na raiz do repositório: `src/`, `static/`, `tests/`, `scripts/` (conforme plan.md §Project Structure)
- Testes fora de `src/`: `tests/unit/`, `tests/integration/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialização do projeto SvelteKit estático, stack de testes, seed e assets — base para todas as fases

- [x] T001 Inicializar o projeto SvelteKit 2 + Svelte 5 + TypeScript 5.4: criar `package.json` (dependência `idb-keyval@^6.2`; devDependencies `@sveltejs/kit@^2`, `@sveltejs/adapter-static`, `svelte@^5`, `vite@^5`, `typescript@^5.4`), `svelte.config.js` configurado com `@sveltejs/adapter-static`, `vite.config.ts`, `tsconfig.json`, `src/app.html` e `src/app.d.ts`; rodar `npm install` para gerar `package-lock.json`
- [x] T002 [P] Criar `src/routes/+layout.ts` com `export const prerender = true` (pré-renderização de todas as rotas, research R1) e o shell mínimo `src/routes/+layout.svelte`
- [x] T003 [P] Configurar a stack Jest: criar `jest.config.cjs` (svelte-jester + ts-jest + jest-environment-jsdom, raízes `tests/unit` e `tests/integration`), `tests/setup.ts` (importa `@testing-library/jest-dom`; `fake-indexeddb/auto` na suíte de integração) e os scripts `test:unit` e `test:integration` no `package.json` (jest 29.7, `@testing-library/svelte` 5, `fake-indexeddb` 6)
- [x] T004 [P] Configurar o Playwright 1.44: criar `playwright.config.ts` com webServer servindo o build pré-renderizado (`npm run build` + `vite preview`), o diretório `tests/e2e/` e o script `test:e2e` no `package.json`
- [x] T005 [P] Verificar o seed existente `src/data/catalog.json` contra a tabela de `docs/elementals.md` — o seed já existe e está íntegro (117 registros, 117 IDs únicos, 25 tipos, 0 imagens ausentes; research R4, plan.md §Project Structure): confirmar o objeto `{ "elementals": [...] }` com exatamente 117 registros `{ id, type, rarity, variation, imagePath }`, IDs no padrão `<typeSlug>_<variationSlug>` (sufixos `basic`, `gold`, `candy`, `galaxy`, `holofoil`, `cube`, `gem`, `quack`), raridade base do tipo para variação `Normal` e `Especial` para toda variação não-Normal, `imagePath` no padrão `assets/elementals/<pasta>/<arquivo>.webp`. Regenerar a partir da tabela-fonte SOMENTE se a verificação falhar — nunca sobrescrever o seed verificado
- [x] T006 [P] Verificar os 117 assets placeholder WebP já existentes — um arquivo para cada `imagePath` do seed `src/data/catalog.json` — sob `assets/elementals/<tipo>/` (25 pastas, seguindo os caminhos exatos do seed; ex.: pasta `grim/` para o tipo Ceifador, `burntpeanut/` para Amendoin Queimado) e mover a árvore para `static/assets/elementals/<tipo>/` para o SvelteKit servir na raiz (research R12; plan.md §Project Structure: o conteúdo de `assets/` é movido, não copiado, evitando duplicar os arquivos no repositório)

---

## Phase 2: Foundational — FDD-01 (Adaptador de persistência + Store da coleção)

**Purpose**: Fundação de estado e persistência consumida por TODAS as histórias (indicação de posse, toggle, coleção pessoal). Sem falha silenciosa: erros tipados, rollback e modo degradado.

**⚠️ CRITICAL**: Nenhuma história de usuário pode começar antes desta fase estar completa e verde

### Tests for Foundational (TDD — escrever primeiro e vê-los FALHAR) ⚠️

- [x] T007 [P] Escrever os testes de integração do adaptador de persistência em `tests/integration/persistence/idb-adapter.test.ts` com `fake-indexeddb/auto`: `loadCollection` resolve `[]` sem registro; roundtrip save→load; registro corrompido descartado ⇒ `[]`; validação estrutural `{ version: number, ids: string[] }`; timeout de 2 s por operação; 1 retry de leitura com backoff 200 ms + jitter; rejeições tipadas `StorageReadError`/`StorageWriteError`/`StorageUnavailableError`; `isStorageAvailable` resolve `false` quando bloqueado e nunca rejeita
- [x] T008 [P] Escrever os testes unitários da Store da coleção em `tests/unit/stores/collection.test.ts` com `PersistenceAdapter` e catálogo stubados: hydrate → `active` com storage disponível; hydrate → `degraded` com storage indisponível ou `StorageReadError`; descarte silencioso de IDs órfãos; `toggle` adiciona/remove e persiste; `toggle` rejeita sem gravar para ID fora do catálogo; `toggle` rejeita imediatamente em `degraded`; falha de escrita ⇒ rollback do conjunto + rejeição; toggles concorrentes serializados (uma gravação por vez); `navigator.storage.persist()` solicitado quando a API existe

### Implementation for Foundational

- [x] T009 [P] Criar os tipos de domínio em `src/lib/domain/elemental.ts` (tipos `Elemental`, `Rarity`, `ElementalType`, `Variation` e as ordens canônicas `RARITY_ORDER`, `TYPE_ORDER` com os 25 tipos na ordem de `docs/elementals.md`, `VARIATION_ORDER`) e em `src/lib/domain/catalog-group.ts` (tipos `CatalogGroup` e `Neighbors`)
- [x] T010 [P] Criar os erros tipados de storage em `src/lib/persistence/errors.ts`: `StorageError` (base abstrata com `code`), `StorageWriteError`, `StorageReadError`, `StorageUnavailableError`
- [x] T011 [P] Criar o contrato do adaptador em `src/lib/persistence/adapter.ts`: interface `PersistenceAdapter` (`isStorageAvailable`/`loadCollection`/`saveCollection`), tipo `CollectionRecord` (`{ version, ids }`), constantes `COLLECTION_KEY = 'collection'`, `COLLECTION_RECORD_VERSION = 1`, `STORAGE_OPERATION_TIMEOUT_MS = 2000`
- [x] T012 Implementar `src/lib/persistence/idb-adapter.ts` sobre `idb-keyval`: registro versionado na chave `collection`, timeout de 2 s via `Promise.race`, 1 retry de leitura com backoff exponencial de 200 ms + jitter, validação estrutural do registro na leitura (inválido ⇒ descarte e `[]`), erros tipados de `src/lib/persistence/errors.ts` (depende de T010, T011)
- [x] T013 Implementar a fábrica `createCollectionStore(adapter, catalog)` em `src/lib/stores/collection.ts`: `writable<Set<string>>` interno, `status: Readable<'hydrating' | 'active' | 'degraded'>`, `has(id)`, `toggle(id)` com validação do ID contra o catálogo, fila serializada de gravações (uma por vez) e rollback em falha, `hydrate()` com descarte de órfãos e `navigator.storage.persist()` não bloqueante. NÃO exportar o singleton ainda — a fiação real ocorre na US1 (T019), quando o módulo de catálogo existir (depende de T009, T012)

**Checkpoint**: `npm run test:unit` e `npm run test:integration` verdes com fake-indexeddb; fundação pronta — as histórias podem começar

---

## Phase 3: User Story 1 — Explorar o catálogo completo (Priority: P1) 🎯 MVP — FDD-02

**Goal**: Home com os 117 elementais agrupados por raridade (5 seções) e tipo (25), cada item com nome e placeholder, indicação de posse, aviso permanente de persistência local e erro explícito em falha de integridade do catálogo

**Independent Test**: abrir `/` e conferir 117 itens agrupados por raridade e tipo conforme `docs/elementals.md`, nome + placeholder visíveis em cada item, aviso permanente presente; adulterar uma cópia do seed e confirmar a mensagem de erro no lugar da lista

### Tests for User Story 1 (TDD — escrever primeiro e vê-los FALHAR) ⚠️

- [ ] T014 [P] [US1] Escrever os testes do módulo de catálogo em `tests/unit/catalog/catalog.test.ts`: `getAll` retorna os 117 itens na sequência canônica (o teste fixa a sequência esperada de 117 IDs para o seed vigente); `getById` resolve e retorna `undefined` para ID inexistente sem lançar; `getByRarity` e `getByType` na ordenação canônica; `groupedByRarityAndType` com as 5 raridades, grupos ordenados por raridade→tipo e itens por variação, união totalizando 117; checagem de integridade lança `CatalogIntegrityError` com seed adulterado
- [ ] T015 [P] [US1] Escrever os testes dos componentes da listagem em `tests/unit/components/home-listing.test.ts` com `@testing-library/svelte`: `RaritySection` renderiza o cabeçalho da raridade e seus tipos; `TypeGroup` renderiza o grupo de tipo; `ElementalCard` exibe nome derivado de type+variation, imagem placeholder com `loading="lazy"` e `alt`, indicação visual de posse quando a Store contém o ID e link para `/elemental/[id]`
- [ ] T016 [P] [US1] Escrever os testes dos avisos em `tests/unit/components/common-notices.test.ts`: `LocalStorageNotice` renderiza o aviso permanente de que a coleção é local e será perdida ao limpar os dados do navegador; `DegradedBanner` exibe o aviso de modo degradado quando `status = 'degraded'`
- [ ] T017 [P] [US1] Escrever o teste da página inicial em `tests/unit/routes/home-page.test.ts`: renderiza as 5 seções de raridade com seus grupos; exibe mensagem de erro (em vez de lista vazia silenciosa) quando o módulo lança `CatalogIntegrityError`; exibe `DegradedBanner` e omite a indicação de posse em modo degradado; `LocalStorageNotice` presente em todo carregamento

### Implementation for User Story 1

- [ ] T018 [US1] Implementar o módulo de catálogo em `src/lib/catalog/index.ts`: import estático de `src/data/catalog.json` (sem fetch), normalização memoizada na primeira consulta (`Map` por ID, sequência canônica pelo comparador raridade→tipo→variação de `src/lib/domain/elemental.ts`, `Map` de posições), consultas síncronas `getAll`/`getById`/`getByRarity`/`getByType`/`groupedByRarityAndType` sem exceções para parâmetros inexistentes, e checagem de integridade mínima na carga (117 itens, campos string não vazios, IDs únicos) lançando `CatalogIntegrityError` (depende de T005, T009)
- [ ] T019 [US1] Fiar o singleton da Store: exportar `collectionStore` em `src/lib/stores/collection.ts` (chamando `createCollectionStore` com `persistenceAdapter` de `src/lib/persistence/idb-adapter.ts` e `catalog` de `src/lib/catalog/index.ts`) e disparar `hydrate()` na inicialização do cliente em `src/routes/+layout.svelte` (depende de T013, T018)
- [ ] T020 [P] [US1] Criar `src/lib/components/common/ElementalImage.svelte`: `<img loading="lazy">` com `src` a partir de `imagePath`, `alt` com o nome do elemental e fallback para o placeholder do tipo/variação em erro de carga
- [ ] T021 [P] [US1] Criar `src/lib/components/common/LocalStorageNotice.svelte` com o aviso permanente de persistência local (a coleção é local e será perdida se os dados do navegador forem limpos), exibido em 100% dos carregamentos da home
- [ ] T022 [P] [US1] Criar `src/lib/components/common/DegradedBanner.svelte`: aviso de modo degradado (armazenamento indisponível, marcação desabilitada), visível quando `collectionStore.status = 'degraded'`
- [ ] T023 [P] [US1] Criar `src/lib/components/catalog/RaritySection.svelte`: seção de uma raridade (Raro, Especial, Épico, Lendário, Mítico) renderizando seus `TypeGroup`s
- [ ] T024 [P] [US1] Criar `src/lib/components/catalog/TypeGroup.svelte`: grupo de tipo dentro da raridade, renderizando os `ElementalCard`s do grupo
- [ ] T025 [P] [US1] Criar `src/lib/components/catalog/ElementalCard.svelte`: nome derivado de type+variation, `ElementalImage`, indicação visual de posse via `collectionStore.has(id)` (oculta em `degraded`) e link para `/elemental/[id]`
- [ ] T026 [US1] Implementar a home: `src/routes/+page.ts` carrega os grupos via `catalog.groupedByRarityAndType()` (capturando `CatalogIntegrityError` para o estado de erro) e `src/routes/+page.svelte` renderiza `LocalStorageNotice`, `DegradedBanner`, as `RaritySection`s — ou a mensagem de erro de integridade (depende de T018–T025)

**Checkpoint**: US1 funcional e testável de forma independente — `npm run test:unit` verde; `npm run dev` mostra os 117 itens agrupados, aviso permanente e indicação de posse (MVP entregável)

---

## Phase 4: User Story 2 — Registrar posse com um clique (Priority: P2)

**Goal**: Marcar/desmarcar posse com um clique na listagem, gravando apenas IDs no IndexedDB, com preservação total entre recargas/sessões, rollback e mensagem acionável em falha de escrita, e marcação desabilitada com aviso em modo degradado

**Independent Test**: marcar itens na listagem, recarregar a página e confirmar que as marcações permanecem; simular falha de escrita e confirmar estado visual inalterado + mensagem

### Tests for User Story 2 (TDD — escrever primeiro e vê-los FALHAR) ⚠️

- [ ] T027 [P] [US2] Escrever o teste do controle de posse em `tests/unit/components/collection-toggle.test.ts`: um clique dispara `collectionStore.toggle(id)`; o estado visual reflete a posse confirmada; clique em item colecionado desmarca; controle desabilitado em `degraded`; rejeição do toggle ⇒ estado visual inalterado + mensagem acionável informando que a seleção não foi salva
- [ ] T028 [P] [US2] Escrever o teste de integração do fluxo de marcação em `tests/integration/collection-toggle-flow.test.ts` com `fake-indexeddb/auto`: marcar itens via Store grava o registro versionado com os IDs; nova instância da Store hidratada do mesmo banco recupera 100% das marcações (simula recarregar a página); falha de escrita simulada ⇒ rollback e rejeição, sem registro parcial

### Implementation for User Story 2

- [ ] T029 [US2] Implementar `src/lib/components/elemental/CollectionToggle.svelte`: controle de posse de um clique consumindo `collectionStore.has(id)`/`toggle(id)`, desabilitado com aviso em `degraded`, com região `aria-live` para a mensagem de falha de gravação sem alterar o estado visual
- [ ] T030 [US2] Integrar o `CollectionToggle` ao card em `src/lib/components/catalog/ElementalCard.svelte`, mantendo a indicação de posse reativa em tempo real na listagem (depende de T025, T029)

**Checkpoint**: US2 testável de forma independente — marcar, recarregar e confirmar persistência; falha simulada gera mensagem sem mudança visual; US1 segue intacta

---

## Phase 5: User Story 3 — Ver a tela individual com navegação circular (Priority: P3) — FDD-03

**Goal**: Tela `/elemental/[id]` com cabeçalho (nome, raridade, variação), imagem em destaque, rodapé com anterior/próximo circular na sequência canônica (wrap-around nos dois extremos) e toggle central de posse; ID inválido redireciona para a home sem tela em branco

**Independent Test**: a partir da listagem, abrir um elemental, percorrer anterior/próximo cruzando os dois extremos do catálogo (primeiro ↔ último) e alternar a posse pelo controle central; acessar ID inexistente e confirmar redirecionamento

### Tests for User Story 3 (TDD — escrever primeiro e vê-los FALHAR) ⚠️

- [ ] T031 [P] [US3] Escrever os testes de navegação circular em `tests/unit/catalog/neighbors.test.ts`: `getNeighbors(id)` retorna `previousId`/`nextId`/`position`/`total` conforme a sequência canônica; primeiro item ⇒ `previousId` é o último; último item ⇒ `nextId` é o primeiro; ID inexistente ⇒ `undefined`
- [ ] T032 [P] [US3] Escrever os testes dos componentes da tela individual em `tests/unit/components/elemental-detail.test.ts`: `ElementalDetail` exibe cabeçalho com nome, raridade e variação e imagem em destaque com fallback de placeholder; `CircularNav` renderiza anterior/próximo com os IDs vizinhos e o toggle central; toggle desabilitado em `degraded`
- [ ] T033 [P] [US3] Escrever os testes da rota individual em `tests/unit/routes/elemental-page.test.ts`: `entries()` retorna exatamente os 117 IDs do seed; `load(id)` válido retorna elemental + neighbors; `load` com ID inexistente dispara `redirect(307, '/')`

### Implementation for User Story 3

- [ ] T034 [US3] Adicionar `getNeighbors(id)` ao módulo de catálogo em `src/lib/catalog/index.ts`: resolução O(1) via `Map` de posições com wrap-around aritmético (`(pos ± 1 + total) % total`), retornando `undefined` para ID inválido (depende de T018)
- [ ] T035 [P] [US3] Criar `src/lib/components/elemental/ElementalDetail.svelte`: cabeçalho com nome, raridade e variação + `ElementalImage` em destaque centralizado
- [ ] T036 [P] [US3] Criar `src/lib/components/elemental/CircularNav.svelte`: rodapé com links anterior/próximo (`/elemental/[previousId|nextId]`, com `data-sveltekit-preload-data`) e `CollectionToggle` ao centro
- [ ] T037 [US3] Implementar a rota individual: `src/routes/elemental/[id]/+page.ts` com `entries()` retornando os 117 IDs e `load()` resolvendo `getById`/`getNeighbors` (ID inválido ⇒ `redirect(307, '/')`), e `src/routes/elemental/[id]/+page.svelte` compondo `ElementalDetail` + `CircularNav` (depende de T034–T036)
- [ ] T038 [P] [US3] Criar `src/routes/+error.svelte`: página 404 amigável com orientação de retorno ao catálogo (servida em acesso direto a `/elemental/<id>` inexistente)

**Checkpoint**: US3 testável de forma independente — navegação circular completa pelos 117 itens, toggle persistindo, redirect suave para ID inválido; US1/US2 intactas

---

## Phase 6: User Story 4 — Ver a coleção pessoal (Priority: P4) — FDD-04 (visualização)

**Goal**: Página `/colecao` listando apenas os itens marcados — miniatura, nome, raridade, variação e check verde — na ordenação canônica do catálogo, com descarte silencioso de órfãos, estado vazio orientando a explorar o catálogo e estado degradado com mensagem distinta (sem lista parcial)

**Independent Test**: marcar um conjunto de itens, abrir `/colecao` e verificar que somente eles aparecem, com todos os atributos e o check verde; abrir com coleção vazia e com storage bloqueado para conferir as duas mensagens distintas

### Tests for User Story 4 (TDD — escrever primeiro e vê-los FALHAR) ⚠️

- [ ] T039 [P] [US4] Escrever os testes da Store derivada em `tests/unit/stores/collected-items.test.ts`: `collectedItems` resolve os IDs contra o catálogo, descarta órfãos silenciosamente e segue a ordenação canônica; emite apenas em mudanças confirmadas do conjunto; lista vazia quando a coleção está vazia
- [ ] T040 [P] [US4] Escrever os testes da página da coleção em `tests/unit/components/collection-page.test.ts`: cada linha exibe miniatura, nome, raridade, variação e check verde; coleção vazia ⇒ `EmptyCollection` com orientação de explorar o catálogo; modo degradado ⇒ aviso de que a coleção não pôde ser carregada (mensagem distinta da de coleção vazia, sem lista parcial)

### Implementation for User Story 4

- [ ] T041 [US4] Implementar `src/lib/stores/collected-items.ts`: `collectedItems` derivado de `collectionStore.collection` × módulo de catálogo (resolve IDs, descarta órfãos, ordena pela sequência canônica) (depende de T019)
- [ ] T042 [P] [US4] Criar `src/lib/components/collection/CollectionListItem.svelte`: linha com miniatura (`ElementalImage`), nome, raridade, variação e check verde de posse
- [ ] T043 [P] [US4] Criar `src/lib/components/collection/EmptyCollection.svelte`: estado vazio com mensagem orientando o usuário a explorar o catálogo e link para a home
- [ ] T044 [US4] Implementar a página da coleção: `src/routes/colecao/+page.ts` e `src/routes/colecao/+page.svelte` renderizando a lista de `collectedItemsStore.collectedItems`, o estado vazio (`EmptyCollection`) e o estado degradado com mensagem distinta, sem lista parcial (depende de T041–T043)

**Checkpoint**: US4 testável de forma independente — apenas os itens marcados, na ordem do catálogo, sem órfãos; estados vazio e degradado distintos; US1–US3 intactas

---

## Phase 7: User Story 5 — Editar a coleção pessoal (Priority: P5) — FDD-04 (modo de edição)

**Goal**: Botão **Editar coleção** ativa o modo de edição com remoção item a item de efeito imediato; falha de gravação mantém o item e informa o usuário; remover todos exibe o estado vazio; sair da edição reflete o estado final

**Independent Test**: com itens na coleção, entrar em modo de edição, remover um item e confirmar a atualização imediata; remover todos e confirmar a mensagem de coleção vazia; simular falha de gravação e confirmar item mantido + mensagem

### Tests for User Story 5 (TDD — escrever primeiro e vê-los FALHAR) ⚠️

- [ ] T045 [P] [US5] Escrever os testes do modo de edição da Store em `tests/unit/stores/collection-edit.test.ts`: `isEditing` alterna o modo; `remove(id)` delega ao toggle e resolve após gravação confirmada; falha de escrita ⇒ rejeita e o item permanece na lista; remover o último item ⇒ lista vazia
- [ ] T046 [P] [US5] Escrever os testes do modo de edição da página em `tests/unit/components/collection-edit-mode.test.ts`: botão **Editar coleção** ativa o modo com ação de remoção por item; remoção confirmada ⇒ item some imediatamente; remover todos ⇒ estado vazio; falha de gravação ⇒ item permanece + mensagem explícita; encerrar edição ⇒ lista reflete o estado final

### Implementation for User Story 5

- [ ] T047 [US5] Adicionar `isEditing` (`Writable<boolean>`) e `remove(id)` (delegando a `collectionStore.toggle`) em `src/lib/stores/collected-items.ts` (depende de T041)
- [ ] T048 [US5] Criar `src/lib/components/collection/EditCollectionBar.svelte`: botão **Editar coleção** / encerrar edição alternando `collectedItemsStore.isEditing`
- [ ] T049 [US5] Integrar o modo de edição: ação de remoção por item em `src/lib/components/collection/CollectionListItem.svelte` (visível quando `isEditing`) e `EditCollectionBar` + exibição da mensagem de falha de remoção em `src/routes/colecao/+page.svelte` (depende de T044, T047, T048)

**Checkpoint**: US5 testável de forma independente — edição, remoção imediata, estado vazio ao remover todos, falha sem perda visual; US1–US4 intactas

---

## Phase 8: FDD-05 (Pipeline de build, validação do seed e deploy) + Polish

**Purpose**: Gates de qualidade bloqueantes (schema do seed, suíte de testes, metas de 150 KB gzip / 200 ms / cold start 2 s), e2e do fluxo crítico, deploy automático como site estático portável (Netlify ou Vercel) e QA pré-release obrigatório (matriz de navegadores + dispositivo móvel real, conforme os Quality Gates da constituição)

- [ ] T050 [P] Criar o validador do seed em `scripts/validate-seed.mjs` com `zod` 3.23 e o script `validate:seed` no `package.json`: estrutura dos 5 campos, unicidade de IDs, enums (5 raridades, 8 variações, 25 tipos), padrão do ID `<typeSlug>_<variationSlug>` consistente com type/variation, regra variação não-Normal ⇒ `Especial`, cardinalidade 117 itens/25 tipos e existência de cada `imagePath` em disco; exit 0 ou exit 1 com relatório JSON item a item no stderr (verificar contra cópias adulteradas: ID duplicado, raridade fora do enum, imagem ausente) (depende de T005, T006)
- [ ] T051 [P] Criar o medidor de metas em `scripts/measure-budgets.mjs` e o script `measure:budgets` no `package.json`: soma gzip dos chunks iniciais da rota `/` a partir do manifest do Vite (< 150 KB), tempo de carregamento do catálogo medido com Playwright contra o build pré-renderizado (< 200 ms) e cold start da home com emulação de rede 4G (< 2 s, SC-011; FDD-02 §6 "meta de cold start monitorada em CI"); exit 1 com os valores medidos ao violar qualquer meta
- [ ] T052 [P] Criar o teste e2e do fluxo crítico em `tests/e2e/critical-flow.spec.ts` (Playwright contra o build pré-renderizado): abrir a home → marcar itens no toggle → recarregar a página → confirmar marcações preservadas → abrir `/colecao` → entrar em modo de edição → remover um item → confirmar a remoção refletida na lista (depende de T026, T030, T049)
- [ ] T053 Criar o workflow de CI/CD em `.github/workflows/ci.yml`: gatilhos `push`/`pull_request` na branch principal, concorrência cancelando execuções obsoletas, timeout de 15 min por job, stages `install` (npm ci com lockfile imutável) → `validate_seed` → `tests` (unit + integration + e2e) → `build` → `measure` → `deploy` no provedor com até 3 tentativas e backoff de 30 s + jitter; token de deploy apenas no cofre de segredos (depende de T050–T052)
- [ ] T054 [P] Criar a configuração mínima do provedor em `netlify.toml` e `vercel.json` publicando o diretório `build/` (artefato portável entre os dois, sem mudança de código)
- [ ] T055 Executar a validação completa do quickstart (`specs/001-diario-colecao-elementais/quickstart.md`): `npm run validate:seed`, `test:unit`, `test:integration`, `build`, `test:e2e` e `measure:budgets` verdes, e conferir os 8 cenários manuais (catálogo completo, posse, navegação circular, coleção, edição, modo degradado, sem falha silenciosa, zero login/busca) (depende de T050–T054)
- [ ] T056 Executar o QA pré-release obrigatório da constituição (§Fluxo de Desenvolvimento e Quality Gates) e do PRD (§Testes e validação): QA por script na matriz de navegadores (versões correntes e penúltima de Chrome, Firefox, Safari e Edge) validando IndexedDB, layout responsivo, navegação e navegação por teclado nos botões e no toggle, e validação manual exploratória em dispositivo móvel real focada em tempo de carregamento e responsividade; registrar os resultados em `specs/001-diario-colecao-elementais/checklists/release.md` (depende de T052)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — começa imediatamente
- **Foundational (Phase 2, FDD-01)**: depende do Setup — **BLOQUEIA** todas as histórias
- **User Stories (Phases 3–7)**: todas dependem da Foundational; ordem segue a cadeia de dependência dos FDDs (FDD-02 → toggle → FDD-03 → FDD-04)
- **FDD-05 + Polish (Phase 8)**: depende de todas as histórias (o e2e cruza o fluxo inteiro)

### User Story Dependencies

- **US1 (P1, FDD-02)**: começa após Foundational — sem dependência de outras histórias
- **US2 (P2)**: depende de US1 (o toggle é hospedado nos cards da listagem)
- **US3 (P3, FDD-03)**: depende de US1 (módulo de catálogo + `ElementalImage`) e de US2 (`CollectionToggle` no centro do rodapé)
- **US4 (P4, FDD-04)**: depende de Foundational (Store base) e de US1 (módulo de catálogo para resolução de IDs)
- **US5 (P5, FDD-04)**: depende de US4 (a página da coleção hospeda o modo de edição)

### Within Each User Story

- Testes SEMPRE primeiro, e devem FALHAR antes da implementação (TDD)
- Tipos/contratos antes de implementações; Stores antes de componentes; componentes antes das rotas
- Checkpoint ao fim de cada fase: história validada de forma independente antes de seguir

### Parallel Opportunities

- Setup: T003, T004, T005, T006 em paralelo após T001–T002
- Foundational: T007 ∥ T008 (testes); T009 ∥ T010 ∥ T011 (implementação)
- US1: T014 ∥ T015 ∥ T016 ∥ T017 (testes); T020 ∥ T021 ∥ T022 ∥ T023 ∥ T024 ∥ T025 (componentes)
- US2: T027 ∥ T028 (testes)
- US3: T031 ∥ T032 ∥ T033 (testes); T035 ∥ T036 ∥ T038 (implementação)
- US4: T039 ∥ T040 (testes); T042 ∥ T043 (implementação)
- US5: T045 ∥ T046 (testes)
- FDD-05: T050 ∥ T051 ∥ T052 ∥ T054; T056 é manual e sequencial, após o e2e (T052)

---

## Parallel Example: User Story 1

```bash
# Lançar todos os testes da US1 juntos (falham antes da implementação):
Task: "Escrever os testes do módulo de catálogo em tests/unit/catalog/catalog.test.ts"
Task: "Escrever os testes dos componentes da listagem em tests/unit/components/home-listing.test.ts"
Task: "Escrever os testes dos avisos em tests/unit/components/common-notices.test.ts"
Task: "Escrever o teste da página inicial em tests/unit/routes/home-page.test.ts"

# Lançar os componentes da US1 juntos (arquivos distintos):
Task: "Criar src/lib/components/common/ElementalImage.svelte"
Task: "Criar src/lib/components/common/LocalStorageNotice.svelte"
Task: "Criar src/lib/components/common/DegradedBanner.svelte"
Task: "Criar src/lib/components/catalog/RaritySection.svelte"
Task: "Criar src/lib/components/catalog/TypeGroup.svelte"
Task: "Criar src/lib/components/catalog/ElementalCard.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (FDD-01 — CRÍTICA, bloqueia tudo)
3. Completar Phase 3: US1 (FDD-02 — catálogo navegável com aviso permanente e indicação de posse)
4. **STOP and VALIDATE**: testar US1 de forma independente (checkpoint da fase)
5. Deploy/demo se pronto — o catálogo consultável já entrega valor ao jogador

### Incremental Delivery

1. Setup + Foundational → fundação pronta (persistência com rollback e modo degradado testados)
2. + US1 → catálogo completo na home (**MVP!**)
3. + US2 → registro de posse persistente com um clique
4. + US3 → tela individual com navegação circular
5. + US4 → página da coleção pessoal
6. + US5 → modo de edição da coleção
7. + FDD-05 → pipeline com gates de schema/testes/metas e deploy automático
8. Cada incremento agrega valor sem quebrar os anteriores

### Sequential Strategy (ordem dos FDDs)

A cadeia de dependência real (US2 hospedado na listagem da US1; US3 consome catálogo + toggle; US5 dentro da página da US4) torna a execução sequencial na ordem P1 → P5 o caminho padrão; dentro de cada fase, maximizar as tasks [P].

---

## Notes

- [P] = arquivos distintos, sem dependência de tasks incompletas
- [USx] mapeia a task à história da spec.md para rastreabilidade
- Cada história é completável e testável de forma independente (checkpoints ao fim de cada fase)
- Verificar que os testes FALHAM antes de implementar (TDD obrigatório, PRD §Testes e validação)
- Commitar após cada task ou grupo lógico; parar em qualquer checkpoint para validar a história isoladamente
- Evitar: tasks vagas, conflitos de arquivo entre tasks [P], dependências cruzadas que quebrem a independência das histórias
