# Implementation Plan: Diário de Coleção Elementais

**Branch**: `001-diario-colecao-elementais` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-diario-colecao-elementais/spec.md`

## Summary

Aplicação web 100% cliente (SPA estática) que renderiza o catálogo completo de 117 elementais (25 tipos) agrupado por raridade e tipo, oferece tela individual por item com navegação circular determinística, registra posse com um clique persistindo apenas IDs no IndexedDB e exibe a coleção pessoal com modo de edição. A abordagem técnica consolidada a partir do HLD-01 e dos FDD-01 a FDD-05: Svelte + SvelteKit + TypeScript compilado pelo Vite com pré-renderização de todas as rotas (`@sveltejs/adapter-static`), estado reativo em Svelte Stores com componentes consumidores puros, catálogo como seed JSON read-only embutido no bundle (`src/data/catalog.json`, validado por schema no pipeline), persistência atrás de um adaptador isolado sobre `idb-keyval` (registro versionado, apenas IDs, sem falha silenciosa) e publicação automática como site estático em Netlify ou Vercel com gates de pipeline para schema do seed, suíte de testes e metas de engenharia (bundle < 150 KB gzip, catálogo < 200 ms).

## Technical Context

**Language/Version**: TypeScript 5.4+ (superconjunto do requisito mínimo "TypeScript 4+"), Svelte 5, SvelteKit 2, Node.js 20 LTS (pipeline e scripts)

**Primary Dependencies**: `@sveltejs/adapter-static` (pré-renderização de todas as rotas, artefato portável), `idb-keyval` 6.2 (wrapper IndexedDB), `zod` 3.23 (validação de schema do seed no pipeline, devDependency — não entra no bundle)

**Storage**: IndexedDB do navegador via `idb-keyval` — registro único versionado na chave `collection` contendo apenas IDs (≤ 117, payload < 4 KB). Catálogo: seed estático `src/data/catalog.json` (117 itens, 25 tipos, conforme `docs/elementals.md`) embutido no build, read-only em runtime

**Testing**: Jest 29.7 + `@testing-library/svelte` 5 + `svelte-jester`/`ts-jest` + `jest-environment-jsdom` (unitários e componentes); `fake-indexeddb` 6 (integração do adaptador de persistência e da Store); Playwright 1.44 (e2e do fluxo crítico)

**Target Platform**: navegadores correntes e penúltima de Chrome, Firefox, Safari e Edge, desktop e mobile, com IndexedDB e ES modules; entrega como site estático via CDN (Netlify ou Vercel), HTTPS obrigatório

**Project Type**: web application 100% cliente (SPA pré-renderizada estaticamente, zero backend, zero login)

**Performance Goals**: carregamento do catálogo < 200 ms com cache de CDN; bundle JS inicial < 150 KB gzip; cold start < 2 s em 4G; escrita no IndexedDB p95 < 50 ms; hidratação da coleção ≤ 100 ms; consultas do catálogo < 5 ms em memória; navegação client-side da tela individual ≤ 100 ms

**Constraints**: pré-renderização estática de todas as rotas (sem SSR em runtime); nenhuma chamada de rede a backend em runtime (FR-012); nenhum dado do usuário sai do dispositivo (sem telemetria/analytics); catálogo imutável em runtime e validado no build (seed inválido bloqueia publicação); sem busca, filtragem avançada ou estatísticas (FR-015); sem service worker nesta entrega; console livre de erros em produção

**Scale/Scope**: 117 elementais, 25 tipos, 8 variações, 5 raridades; 3 rotas (`/`, `/elemental/[id]` × 117 páginas pré-renderizadas, `/colecao`) + página de erro; coleção ≤ 117 IDs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Veredito | Evidência no design |
|---|---|---|
| I. Sem Backend | ✅ PASS | Site estático via `@sveltejs/adapter-static`; nenhum endpoint, servidor ou banco externo; única "interface externa" é o CDN (HLD-01; FDD-02/FDD-05) |
| II. Sem Autenticação | ✅ PASS | Nenhum fluxo de login, conta, token ou cookie em nenhum artefato; FR-013 da spec |
| III. Performance | ✅ PASS | Pré-renderização de todas as rotas, code splitting por rota, assets com hash, imagens WebP com lazy loading, catálogo embutido no bundle; metas 200 ms / 150 KB / 2 s medidas em CI e bloqueantes (FDD-05) |
| IV. TDD nas Regras de Negócio | ✅ PASS | Stack obrigatória presente (Jest + `@testing-library/svelte` + `fake-indexeddb` + Playwright); regras de negócio concentradas na Store da coleção e no módulo de catálogo, ambos com contratos testáveis em `contracts/` |
| V. Sem Falha Silenciosa | ✅ PASS | Adaptador converte erros em tipos (`StorageWriteError` etc.); toggle com rollback e mensagem; falha de leitura = coleção vazia com aviso distinto; IndexedDB indisponível = modo degradado detectado na inicialização (FDD-01) |
| VI. Catálogo Imutável em Runtime | ✅ PASS | Seed `src/data/catalog.json` read-only, embutido no build; validação de schema com `zod` no pipeline (`npm run validate:seed`, exit 1 bloqueia deploy); módulo de catálogo expõe apenas consultas (FDD-02/FDD-05) |
| VII. Privacidade Local | ✅ PASS | Apenas IDs no IndexedDB; `navigator.storage.persist()` na inicialização; aviso permanente na home; zero telemetria; HTTPS via CDN (FDD-01/FDD-02) |

**Resultado (pré-Fase 0)**: PASS — sem violações; nenhuma entrada necessária em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-diario-colecao-elementais/
├── plan.md              # Este arquivo (/speckit.plan)
├── research.md          # Fase 0 — decisões técnicas consolidadas
├── data-model.md        # Fase 1 — Elemental, Catálogo, Coleção, grupos e registros
├── contracts/           # Fase 1 — contratos TypeScript dos módulos internos
│   ├── catalog-module.ts
│   ├── persistence-adapter.ts
│   └── collection-store.ts
├── quickstart.md        # Fase 1 — guia de validação ponta a ponta
└── tasks.md             # Fase 2 (/speckit.tasks — NÃO criado por este comando)
```

### Source Code (repository root)

Aplicação web única (frontend-only, sem backend), em camadas no cliente com dependências sempre apontando da apresentação para o estado e dos dados para o estado (HLD-01 — Padrões adotados):

```text
src/
├── app.html                          # template HTML base do SvelteKit
├── app.d.ts                          # tipos globais (App namespace)
├── data/
│   └── catalog.json                  # seed read-only: 117 itens, 25 tipos (já existe; fonte: docs/elementals.md)
├── lib/
│   ├── domain/
│   │   ├── elemental.ts              # tipos Elemental, Rarity, Variation, ElementalType + ordens canônicas (ranks)
│   │   └── catalog-group.ts          # tipos CatalogGroup e Neighbors
│   ├── catalog/
│   │   └── index.ts                  # Módulo de catálogo (repositório read-only): carga do JSON embutido,
│   │                                 # normalização por ID, ordenação canônica, getAll/getById/getByRarity/
│   │                                 # getByType/groupedByRarityAndType/getNeighbors + checagem de integridade
│   ├── persistence/
│   │   ├── adapter.ts                # interface PersistenceAdapter (loadCollection/saveCollection/isStorageAvailable)
│   │   ├── idb-adapter.ts            # implementação sobre idb-keyval: chave `collection`, registro versionado,
│   │                                 # timeout 2 s, 1 retry de leitura com backoff (200 ms + jitter)
│   │   └── errors.ts                 # StorageWriteError, StorageReadError, StorageUnavailableError
│   ├── stores/
│   │   ├── collection.ts             # Store da coleção: collection, has(id), toggle(id), status, hydrate();
│   │                                 # toggle serializado (1 gravação por vez) com rollback; storage.persist()
│   │   └── collected-items.ts        # Store derivada: collectedItems (resolve IDs × catálogo, descarta órfãos,
│   │                                 # ordem canônica), isEditing, remove(id)
│   └── components/                   # componentes como consumidores puros das Stores
│       ├── common/
│       │   ├── ElementalImage.svelte         # <img> WebP com lazy loading e fallback de placeholder por tipo/variação
│       │   ├── LocalStorageNotice.svelte     # aviso permanente de persistência local (home, 100% dos carregamentos)
│       │   └── DegradedBanner.svelte         # aviso de modo degradado (storage indisponível)
│       ├── catalog/
│       │   ├── RaritySection.svelte          # seção de raridade (Raro, Especial, Épico, Lendário, Mítico)
│       │   ├── TypeGroup.svelte              # grupo de tipo dentro da raridade
│       │   └── ElementalCard.svelte          # item: nome, placeholder, indicação de posse, link p/ tela individual
│       ├── elemental/
│       │   ├── ElementalDetail.svelte        # cabeçalho (nome, raridade, variação) + imagem em destaque
│       │   ├── CircularNav.svelte            # rodapé com anterior/próximo (wrap-around) e toggle central
│       │   └── CollectionToggle.svelte       # controle de posse de um clique (compartilhado com a listagem)
│       └── collection/
│           ├── CollectionListItem.svelte     # linha: miniatura, nome, raridade, variação, check verde
│           ├── EditCollectionBar.svelte      # botão "Editar coleção" / encerrar edição
│           └── EmptyCollection.svelte        # estado vazio com orientação de retorno ao catálogo
└── routes/
    ├── +layout.ts                    # export const prerender = true (todas as rotas estáticas)
    ├── +layout.svelte                # shell comum; dispara hydrate() da Store na inicialização do cliente
    ├── +page.svelte                  # GET / — listagem agrupada por raridade/tipo + aviso permanente
    ├── +page.ts                      # dados da home via módulo de catálogo (agrupamento canônico)
    ├── +error.svelte                 # 404 amigável com orientação de retorno ao catálogo
    ├── elemental/
    │   └── [id]/
    │       ├── +page.ts              # entries(): 117 IDs para pré-render; load: ID inválido → redirect('/')
    │       └── +page.svelte          # tela individual: detalhe, navegação circular, toggle de posse
    └── colecao/
        ├── +page.ts
        └── +page.svelte              # coleção pessoal: lista resolvida, modo de edição, estado vazio/degradado

static/
└── assets/elementals/<tipo>/         # placeholders WebP servidos na raiz (conteúdo do assets/ do repositório
                                      # é movido para cá na implementação; imagePath do seed permanece válido)

tests/
├── unit/                             # Jest + @testing-library/svelte: módulo de catálogo, Stores, componentes
├── integration/                      # fake-indexeddb: adaptador (CRUD, registro corrompido, timeout) e Store
│                                     # (hidratação, toggle com rollback, órfãos, modo degradado)
└── e2e/                              # Playwright: fluxo crítico home → marcar → recarregar → coleção → editar/remover

scripts/
├── validate-seed.mjs                 # npm run validate:seed — zod: estrutura, IDs únicos, enums, imagens no disco;
│                                     # exit 0/1 + relatório JSON por item (stderr + artefato de build)
└── measure-budgets.mjs               # CI: soma gzip dos chunks iniciais (< 150 KB) e mede carregamento do
                                      # catálogo (< 200 ms) via Playwright contra o build pré-renderizado

.github/workflows/ci.yml              # pipeline: install (lockfile imutável) → validate_seed → tests → build →
                                      # measure → deploy; gatilhos push/pull_request na branch principal
netlify.toml / vercel.json            # configuração mínima do provedor escolhido (artefato build/ portável)
```

**Structure Decision**: projeto web único (sem backend, por decisão de produto e constituição I/II). Dentro de `src/`, a divisão segue as três camadas internas do HLD-01: `lib/domain` + `lib/catalog` + `lib/persistence` (camada de dados), `lib/stores` (camada de estado reativo) e `routes` + `lib/components` (camada de apresentação). Componentes nunca acessam `lib/persistence` ou `lib/catalog` diretamente para mutação — consomem as Stores; as Stores consomem o módulo de catálogo e o adaptador. O seed vive em `src/data/catalog.json` (requisito obrigatório) e é importado estaticamente pelo módulo de catálogo, entrando no bundle sem fetch. Testes ficam fora de `src/` em `tests/`, espelhando as camadas (unit/integration/e2e), e os scripts de pipeline em `scripts/`.

## Complexity Tracking

> Nenhuma violação da constituição — tabela intencionalmente vazia.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

---

## Pós-Fase 1 — Reavaliação da Constituição

*Re-check após research.md, data-model.md, contracts/ e quickstart.md gerados.*

| Princípio | Veredito | Observação pós-design |
|---|---|---|
| I. Sem Backend | ✅ PASS | Contratos contêm apenas interfaces TypeScript internas e rotas estáticas; nenhum serviço remoto |
| II. Sem Autenticação | ✅ PASS | Nenhum artefato introduz identidade, credencial ou sessão |
| III. Performance | ✅ PASS | `quickstart.md` inclui verificação das metas; `contracts/catalog-module.ts` mantém consultas síncronas em memória; bundle livre de `zod` (validação só no pipeline) |
| IV. TDD nas Regras de Negócio | ✅ PASS | Contratos de `catalog-module`, `persistence-adapter` e `collection-store` definem a superfície exata para red-green-refactor; `quickstart.md` mapeia comandos de teste por camada |
| V. Sem Falha Silenciosa | ✅ PASS | Erros tipados e semântica de rejeição/rollback documentados nos contratos; estados `degraded`/`error` explícitos no modelo de dados |
| VI. Catálogo Imutável em Runtime | ✅ PASS | `data-model.md` fixa o schema do seed e as regras de validação executadas no build; runtime faz apenas checagem de integridade mínima (FR home, cenário 5) |
| VII. Privacidade Local | ✅ PASS | `CollectionRecord` contém somente IDs; nenhum campo pessoal em nenhum contrato |

**Resultado (pós-design)**: PASS — sem violações; Complexity Tracking permanece vazio.
