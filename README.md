# Diário de Coleção Elementais

Aplicação web estática que permite aos jogadores de Fortnite **registrar quais colecionáveis elementais possuem**. O catálogo completo é carregado a partir de um JSON estático e as escolhas do usuário são persistidas localmente no navegador via IndexedDB — sem backend, sem login.

## Funcionalidades

- **Listagem do catálogo** — página inicial exibe todos os 117 elementais agrupados por raridade (*Raro*, *Especial*, *Épico*, *Lendário*, *Mítico*) e variação (Normal, Dourado, Gelatinoso, etc.).
- **Tela individual do elemental** — cabeçalho com nome, raridade e variação, imagem em destaque, navegação anterior/próximo e um toggle central para adicionar/remover da coleção.
- **Coleção pessoal** (`/colecao`) — lista apenas os elementais marcados pelo usuário, com miniatura, nome, raridade, variação e indicador de posse.
- **Persistência local** — as seleções são salvas em IndexedDB (via `idb-keyval`) e permanecem entre sessões; limpar os dados do navegador apaga a coleção.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Svelte 5 + SvelteKit 2 (adapter-static) |
| Bundler / dev server | Vite |
| Linguagem | TypeScript |
| Persistência | IndexedDB via `idb-keyval` |
| Estado | Svelte Stores |
| Testes | Jest + Testing Library (unit/integração), Playwright (E2E) |
| Validação de dados | Zod |
| Deploy | Netlify ou Vercel (site estático em `build/`) |

## Pré-requisitos

- **Node.js 20+** (desenvolvimento local testado também em versões mais recentes; o deploy no Netlify usa Node 20)
- **npm** (incluído com o Node.js)
- Para os testes E2E: navegadores do Playwright (`npx playwright install`)

## Instalação

```bash
npm ci
```

Instala as dependências exatamente como definidas no `package-lock.json`.

## Executando o projeto

### Desenvolvimento

```bash
npm run dev
```

Inicia o servidor de desenvolvimento do Vite com hot-reload (por padrão em `http://localhost:5173`).

### Build de produção

```bash
npm run build
```

Gera o site estático pré-renderizado no diretório `build/`.

### Preview do build

```bash
npm run preview
```

Serve localmente o conteúdo de `build/` (por padrão em `http://localhost:4173`) para validar o resultado de produção.

## Testes e verificações

| Comando | Descrição |
|---------|-----------|
| `npm run check` | Diagnósticos de tipos e Svelte (`svelte-check`) |
| `npm run test:unit` | Testes unitários/de componente (Jest + jsdom) |
| `npm run test:integration` | Testes de integração (Jest + fake-indexeddb) |
| `npm run test` | Executa unit + integration |
| `npm run test:e2e` | Testes end-to-end (Playwright; faz build + preview automaticamente) |
| `npm run validate:seed` | Valida a integridade de `src/data/catalog.json` (IDs únicos, enums, imagens existentes, cardinalidade de 117 itens) |
| `npm run measure:budgets` | Mede as metas de engenharia sobre o build: bundle JS inicial < 150 KB gzip, catálogo renderizado < 200 ms e cold start < 2 s em 4G (requer `npm run build` antes) |

## Estrutura do projeto

```
├── src/
│   ├── data/catalog.json        # Seed estático com os 117 elementais
│   ├── lib/
│   │   ├── catalog/             # Carregamento do catálogo
│   │   ├── components/          # Componentes Svelte (catalog, collection, elemental, common)
│   │   ├── domain/              # Tipos e regras de domínio
│   │   ├── persistence/         # Adaptadores IndexedDB (idb-keyval)
│   │   └── stores/              # Svelte stores (coleção, itens coletados)
│   └── routes/
│       ├── +page.svelte         # Home — catálogo agrupado por raridade
│       ├── elemental/[id]/      # Tela individual do elemental
│       └── colecao/             # Coleção pessoal do usuário
├── static/assets/               # Imagens dos elementais
├── scripts/                     # validate-seed e measure-budgets
├── tests/
│   ├── unit/                    # Testes unitários (Jest)
│   ├── integration/             # Testes de integração (fake-indexeddb)
│   └── e2e/                     # Testes E2E (Playwright)
└── docs/                        # PRD, HLD, FDDs e diagramas do projeto
```

## Deploy

O projeto é um site estático (SvelteKit `adapter-static`) publicado a partir do diretório `build/`. Já existem configurações prontas no repositório:

- **Netlify** — `netlify.toml` (`npm run build`, publish `build/`, Node 20, redirect SPA para `/index.html`)
- **Vercel** — `vercel.json` (framework `sveltekit`, `npm ci` + `npm run build`, output `build/`)

Basta conectar o repositório a um desses serviços; o deploy é automático a cada push.

## Documentação

Documentos de apoio em `docs/`: ideia do app (`app-idea.md`), PRD, HLD, FDDs por funcionalidade e diagramas Mermaid correspondentes.
