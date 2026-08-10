# OpenCode Instructions

- **Write Guardrails**: Agents may only write to paths inside the repository root tree (`./`, `./src`, etc.). Any attempt to write outside these directories should be aborted.

The repository is a SvelteKit static web application (`diario-colecao-elementais`). Use npm to run the available commands:

- `npm ci` — install dependencies from the lockfile
- `npm run dev` — start the Vite dev server
- `npm run build` — build the static site into `build/`
- `npm run preview` — preview the production build locally
- `npm run check` — run Svelte diagnostics (`svelte-check`)
- `npm run test:unit` — run Jest unit/component tests
- `npm run test:integration` — run Jest integration tests with fake-indexeddb
- `npm run test:e2e` — run Playwright end-to-end tests
- `npm run test` — run unit + integration tests
- `npm run validate:seed` — validate `src/data/catalog.json`
- `npm run measure:budgets` — measure bundle/performance budgets

- **Document Repository**: The `docs/` directory serves as a central location for documents that agents can consult on demand. All artifacts are written in English.
