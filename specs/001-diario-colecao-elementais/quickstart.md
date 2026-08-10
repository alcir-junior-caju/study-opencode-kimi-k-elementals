# Quickstart: Diário de Coleção Elementais

**Fase 1 do plano** | Data: 2026-08-06 | Feature: `001-diario-colecao-elementais`

Guia de validação ponta a ponta: como subir o ambiente, rodar as camadas de teste e verificar os cenários que provam que a feature funciona. Detalhes de implementação ficam em `tasks.md` e na fase de codificação. Contratos referenciados: [contracts/catalog-module.ts](./contracts/catalog-module.ts), [contracts/persistence-adapter.ts](./contracts/persistence-adapter.ts), [contracts/collection-store.ts](./contracts/collection-store.ts); modelo de dados: [data-model.md](./data-model.md).

---

## 1. Pré-requisitos

- Node.js 20 LTS e npm (lockfile imutável no CI)
- Navegadores para o Playwright: `npx playwright install chromium` (mínimo para o e2e local)

## 2. Setup

```bash
npm ci                 # instala dependências conforme package-lock.json
npm run validate:seed  # valida src/data/catalog.json (exit 0 = 117 itens válidos)
npm run dev            # dev server do SvelteKit para exploração manual
```

**Resultado esperado do setup**: `validate:seed` sai com código 0 e imprime resumo (117 itens, 25 tipos, 0 erros); `npm run dev` sobe a aplicação em `http://localhost:5173`.

## 3. Comandos de verificação por camada

| Camada | Comando | Resultado esperado |
|---|---|---|
| Validação do seed (pipeline) | `npm run validate:seed` | exit 0; com seed adulterado (ID duplicado, raridade fora do enum, imagem ausente) exit 1 + relatório JSON item a item no stderr |
| Unitários (catálogo, Stores, componentes) | `npm run test:unit` | Jest verde; inclui o teste que fixa a sequência canônica de 117 IDs (data-model.md §3) e os testes red-green das Stores |
| Integração da persistência | `npm run test:integration` | Jest + fake-indexeddb verde: hidratação, toggle com confirmação, rollback em falha de escrita, registro corrompido, órfãos, modo degradado |
| E2E do fluxo crítico | `npm run build && npm run test:e2e` | Playwright contra o build pré-renderizado: home → marcar itens → recarregar → coleção → modo de edição → remover item |
| Build estático | `npm run build` | pré-renderiza `/`, `/colecao` e as 117 páginas `/elemental/[id]` em `build/` |
| Metas de engenharia (CI) | `npm run measure:budgets` | bundle inicial < 150 KB gzip, carregamento do catálogo < 200 ms e cold start < 2 s com emulação 4G (SC-011); falha (exit 1) ao violar qualquer meta |
| Pipeline completo | push/PR na branch principal | stages `validate_seed → tests → build → measure → deploy` verdes; artefato publicado e CDN invalidado |

## 4. Cenários de validação manual (mapeados aos critérios de sucesso da spec)

1. **Catálogo completo (SC-001/002/008)** — Abrir `/`: 117 itens em 5 seções de raridade, agrupados por tipo, cada item com nome e placeholder; aviso permanente de que a coleção é local e será perdida ao limpar os dados do navegador.
2. **Posse com um clique (SC-004)** — Marcar itens na listagem (indicação imediata), recarregar a página e fechar/reabrir o navegador: 100% das marcações preservadas. Desmarcar reverte na hora.
3. **Tela individual e navegação circular (SC-003)** — Abrir um item: cabeçalho com nome/raridade/variação, imagem em destaque, rodapé anterior/próximo com toggle central. No primeiro item, "anterior" abre o último; no último, "próximo" abre o primeiro. Acessar `/elemental/id-inexistente`: redireciona para a home (client-side) ou 404 amigável (acesso direto).
4. **Coleção pessoal (SC-005)** — Abrir `/colecao`: somente os itens marcados, com miniatura, nome, raridade, variação e check verde, na ordem do catálogo. Com a coleção vazia: mensagem orientando a explorar o catálogo.
5. **Modo de edição (SC-005)** — Em `/colecao`, clicar **Editar coleção**, remover um item (some imediatamente), remover todos (estado vazio aparece), sair da edição (lista reflete o estado final).
6. **Modo degradado (SC-012)** — DevTools → Application → Storage → bloquear IndexedDB (ou modo privado restrito) e recarregar: catálogo completo consultável, marcação desabilitada com aviso de modo degradado; `/colecao` informa que a coleção não pôde ser carregada (mensagem distinta de coleção vazia, sem lista parcial).
7. **Sem falha silenciosa (SC-010)** — DevTools → simular `QuotaExceededError` na gravação: o estado visual do toggle não muda e aparece mensagem acionável; console sem erros não tratados em todo o fluxo.
8. **Zero autenticação / zero busca (SC-006/009)** — Nenhuma tela pede login ou conta; nenhuma tela contém busca, filtro avançado ou estatística.

## 5. Onde olhar quando algo falha

- **Erro de seed no build** → relatório do `validate:seed` (stderr/artefato) indica item e campo; comparar com `docs/elementals.md` e corrigir `src/data/catalog.json` (a fonte da verdade tabular é a tabela de referência).
- **Ordem de navegação inesperada** → o teste que fixa a sequência canônica (`tests/unit`) aponta o primeiro ID divergente; revisar os ranks em `src/lib/domain/elemental.ts` (data-model.md §3).
- **Coleção "some" após atualizar o seed** → comportamento esperado para IDs removidos do seed: são órfãos, descartados na leitura (data-model.md §6); verificar se o ID deveria existir no seed.
- **Toggle sem efeito** → verificar aviso de modo degradado (IndexedDB bloqueado?) e o console: erros de storage aparecem como mensagens amigáveis na UI, nunca silenciosos.
