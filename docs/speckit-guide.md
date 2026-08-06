# Guia SpecKit — Diário de Coleção Elementais

Versão: 1.0
Data: 2026-08-06
Responsável: Alcir Junior

Guia de ponta a ponta para desenvolver o **Diário de Coleção Elementais** com o fluxo Spec-Driven Development do [SpecKit](https://github.com/github/spec-kit), usando os documentos de `docs/` como fonte da verdade. Cobre desde a preparação do ambiente até o fim da codificação.

> **Nota:** o comando `/speckit.implement` **não** é usado neste projeto. A codificação é executada diretamente a partir das tasks geradas (ver Fase 8).

---

## Mapa dos documentos de referência

| Arquivo | Papel no fluxo SpecKit |
|---|---|
| `docs/app-idea.md` | Visão inicial do produto e stack selecionada (Svelte/SvelteKit, Vite, TypeScript, `idb-keyval`) |
| `docs/PRD-diario-colecao-elementais.md` | Requisitos funcionais (FR-001 a FR-006), não funcionais, métricas e critérios de aceitação |
| `docs/HLD-01-diario-colecao-elementais.md` | Arquitetura geral, componentes, padrões adotados e decisões técnicas |
| `docs/FDD-01-persistencia-colecao.md` | Design da Store da coleção + adaptador IndexedDB (fundação) |
| `docs/FDD-02-listagem-catalogo.md` | Design da página inicial (listagem agrupada por raridade/tipo) |
| `docs/FDD-03-tela-individual-elemental.md` | Design da tela individual com navegação circular e toggle |
| `docs/FDD-04-colecao-pessoal.md` | Design da coleção pessoal com modo de edição |
| `docs/FDD-05-pipeline-build-deploy.md` | Design do pipeline: validação do seed, build e deploy estático |
| `docs/DIAGRAMS-01` a `DIAGRAMS-05` | Diagramas Mermaid de apoio a cada FDD |
| `docs/elementals.md` | Tabela-fonte do catálogo: 117 itens, 25 tipos, variações e raridades |
| `AGENTS.md` | Guardrails de escrita do repositório |

---

## Visão geral das fases

| Fase | Comando | Artefato gerado |
|---|---|---|
| 0. Setup do ambiente | `uv tool install` + `specify init` | `.specify/`, templates e comandos do agente |
| 1. Constituição | `/speckit.constitution` | `.specify/memory/constitution.md` |
| 2. Especificação | `/speckit.specify` | `specs/NNN-<feature>/spec.md` |
| 3. Clarificação | `/speckit.clarify` | `spec.md` atualizado (seção Clarifications) |
| 4. Plano técnico | `/speckit.plan` | `plan.md`, `research.md`, `data-model.md`, `contracts/` |
| 5. Checklist de qualidade (opcional) | `/speckit.checklist` | `specs/NNN-<feature>/checklists/` |
| 6. Geração de tasks | `/speckit.tasks` | `specs/NNN-<feature>/tasks.md` |
| 7. Análise de consistência | `/speckit.analyze` | Relatório de cobertura e divergências |
| 8. Codificação | baseada em `tasks.md` (sem `/speckit.implement`) | Código-fonte do app |

---

## Fase 0 — Setup do ambiente

### 0.1 Pré-requisitos

- **Python 3.11+**
- **uv** (gerenciador de pacotes Python usado pelo SpecKit)
- **Git**
- Agente de IA com suporte ao SpecKit (este projeto usa **opencode**)

```bash
# Instalar uv (macOS)
brew install uv
# ou: curl -LsSf https://astral.sh/uv/install.sh | sh

# Verificar
uv --version
python3 --version
git --version
```

### 0.2 Instalar o Specify CLI

```bash
# Instalação persistente (recomendada)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Verificar ferramentas disponíveis no ambiente
specify check
```

> Alternativa sem instalação (uso único): trocar `specify` por `uvx --from git+https://github.com/github/spec-kit.git specify` nos comandos.

### 0.3 Inicializar o SpecKit no repositório

O repositório já contém `docs/` e `AGENTS.md`, então a inicialização é feita **no diretório atual**:

```bash
# Garantir que o diretório é um repositório git (o SpecKit trabalha sobre git)
git init

# Inicializar o SpecKit no diretório corrente com suporte ao opencode
specify init --here --ai opencode --script sh
```

> Se o CLI pedir confirmação por o diretório não estar vazio, confirme — os arquivos existentes (`docs/`, `AGENTS.md`) são preservados. Para pular a confirmação, use `--force`.

### 0.4 Verificar a estrutura criada

```bash
ls -la
# Esperado, além dos arquivos existentes:
#   .specify/            -> templates, scripts e memória (constituição)
#   .opencode/command/   -> comandos slash /speckit.* disponíveis no agente
```

---

## Fase 1 — Constituição do projeto

**Comando:** `/speckit.constitution`

**O que faz:** define os princípios invioláveis do projeto. Todos os artefatos seguintes (spec, plan, tasks) são validados contra ela. Deriva diretamente dos requisitos não funcionais do PRD e das decisões do HLD.

**Prompt:**

```
/speckit.constitution Crie a constituição do projeto "Diário de Coleção Elementais" usando como base docs/PRD-diario-colecao-elementais.md (seções "Requisitos não funcionais", "Decisões e trade-offs" e "Testes e validação"), docs/HLD-01-diario-colecao-elementais.md (seção "Padrões adotados") e AGENTS.md (guardrails de escrita).

Princípios obrigatórios:
1. SEM BACKEND: aplicação 100% cliente, site estático pré-renderizado; nenhum código de servidor, API própria ou banco de dados externo.
2. SEM AUTENTICAÇÃO: nenhum fluxo de login, conta ou coleta de dado pessoal; zero etapas de autenticação.
3. PERFORMANCE: carregamento do catálogo < 200 ms via cache estático/CDN e bundle JavaScript inicial < 150 KB gzip.
4. TDD NAS REGRAS DE NEGÓCIO: testes primeiro (Jest + @testing-library/svelte + fake-indexeddb) na lógica de Stores e no módulo de catálogo.
5. SEM FALHA SILENCIOSA: todo erro de leitura/escrita no IndexedDB gera feedback visível ao usuário e restaura o estado anterior.
6. CATÁLOGO IMUTÁVEL EM RUNTIME: o seed src/data/catalog.json é read-only e validado por schema no build; seed inválido bloqueia a publicação.
7. PRIVACIDADE LOCAL: a coleção (apenas IDs) vive exclusivamente no IndexedDB do navegador; nenhum tráfego de dados do usuário para fora do dispositivo.
```

**Artefato gerado:** `.specify/memory/constitution.md`

---

## Fase 2 — Especificação (spec)

**Comando:** `/speckit.specify`

**O que faz:** transforma a visão de produto em uma especificação estruturada de **O QUÊ** e **POR QUÊ** (histórias de usuário priorizadas e critérios de aceitação), sem stack técnica — essa entra só no plano. O PRD já tem o conteúdo; o comando o converte ao formato SpecKit.

**Prompt:**

```
/speckit.specify Leia docs/app-idea.md, docs/PRD-diario-colecao-elementais.md (requisitos funcionais FR-001 a FR-006 e critérios de aceitação) e docs/elementals.md (tabela-fonte com os 117 itens e 25 tipos).

Gere a especificação da feature "Diário de Coleção Elementais": aplicação web sem login que (1) lista o catálogo completo de elementais agrupado por raridade e tipo, (2) permite abrir a tela individual de cada elemental com navegação circular anterior/próximo, (3) marca e desmarca posse com um clique, persistindo apenas IDs localmente, e (4) exibe a coleção pessoal com modo de edição.

Foque em O QUÊ e POR QUÊ (não mencione stack técnica). Derive as histórias de usuário priorizadas dos fluxos principais de cada FR e converta a seção "Critérios de aceitação" do PRD em critérios objetivos e testáveis da spec. Mantenha explicitamente fora de escopo: autenticação, busca/filtragem avançada, estatísticas, backend, sincronização entre dispositivos e imagens finais (são placeholders).
```

**Artefato gerado:** `specs/NNN-diario-colecao-elementais/spec.md` (em branch própria criada pelo comando)

---

## Fase 3 — Clarificação

**Comando:** `/speckit.clarify`

**O que faz:** varre a spec em busca de ambiguidades e faz perguntas pontuais antes do planejamento. Como PRD + FDDs já respondem quase tudo, o prompt abaixo direciona o cruzamento para reduzir rodadas de perguntas.

**Prompt:**

```
/speckit.clarify Revise a spec gerada confrontando-a com docs/PRD-diario-colecao-elementais.md e com os FDDs docs/FDD-01-persistencia-colecao.md, docs/FDD-02-listagem-catalogo.md, docs/FDD-03-tela-individual-elemental.md e docs/FDD-04-colecao-pessoal.md.

Resolva preferencialmente com base nesses documentos (sem me perguntar, a menos que haja conflito real):
- Comportamento quando o IndexedDB está indisponível ou bloqueado (modo degradado: catálogo continua visível, marcação de posse indisponível com aviso).
- Descarte silencioso de IDs órfãos (salvos no storage mas inexistentes no seed atual) na leitura da coleção.
- Aviso permanente na página inicial sobre perda da coleção ao limpar os dados do navegador.
- Ordenação determinística do catálogo usada pela navegação circular (primeiro item -> anterior -> último; último -> próximo -> primeiro).
- Coleção vazia: mensagem orientando a explorar o catálogo.
Pergunte apenas o que não estiver respondido em nenhum dos documentos.
```

**Artefato gerado:** `spec.md` atualizado com a seção de clarificações.

---

## Fase 4 — Plano técnico

**Comando:** `/speckit.plan`

**O que faz:** define **COMO** construir: stack, estrutura de código, modelo de dados e contratos. O HLD e os FDDs já contêm as decisões — o plano as consolida no formato SpecKit e as valida contra a constituição.

**Prompt:**

```
/speckit.plan Use docs/HLD-01-diario-colecao-elementais.md como arquitetura de referência e detalhe cada unidade com docs/FDD-01-persistencia-colecao.md, docs/FDD-02-listagem-catalogo.md, docs/FDD-03-tela-individual-elemental.md, docs/FDD-04-colecao-pessoal.md e docs/FDD-05-pipeline-build-deploy.md. Consulte também os diagramas docs/DIAGRAMS-01 a docs/DIAGRAMS-05 para os fluxos.

Contexto técnico obrigatório:
- Stack: Svelte + SvelteKit com TypeScript 4+, build via Vite com pré-renderização estática de todas as rotas.
- Estado: Svelte Stores (writable/derived); componentes como consumidores puros.
- Persistência: IndexedDB via idb-keyval, apenas IDs dos itens colecionados, atrás de um adaptador de persistência isolado (simulável em testes); solicitar navigator.storage.persist() na inicialização.
- Catálogo: seed read-only em src/data/catalog.json (117 itens, 25 tipos, conforme docs/elementals.md), embutido no build, com módulo de catálogo expondo consultas por raridade, tipo e ID, e validação de schema no pipeline.
- Imagens: placeholders WebP em assets/elementals/<tipo>/.
- Testes: Jest + @testing-library/svelte (unitários), fake-indexeddb (integração da persistência), Playwright (e2e do fluxo crítico).
- Deploy: site estático em Netlify ou Vercel, com deploy automático a partir do repositório.
- Metas: catálogo < 200 ms com cache; bundle inicial < 150 KB gzip; zero login; zero backend.
Gere data-model.md (Elemental, Catálogo, Coleção como conjunto de IDs), contracts/ (interfaces do módulo de catálogo, do adaptador de persistência e da Store da coleção) e a estrutura de diretórios do src/.
```

**Artefatos gerados:** `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

---

## Fase 5 — Checklist de qualidade (opcional, recomendado)

**Comando:** `/speckit.checklist`

**O que faz:** gera um checklist de "testes de qualidade para os requisitos" — valida se spec e plano cobrem as metas antes de gerar as tasks.

**Prompt:**

```
/speckit.checklist Gere um checklist de qualidade de release para a feature, validando a cobertura de:
- Metas do PRD (docs/PRD-diario-colecao-elementais.md, seção "Objetivos e métricas"): catálogo < 200 ms, bundle < 150 KB gzip, 100% das seleções preservadas entre sessões, 0 etapas de autenticação, cobertura do seed de 117 itens e 25 tipos.
- Fluxos de erro sem falha silenciosa: IndexedDB indisponível, falha de escrita, falha de leitura, IDs órfãos, seed inválido no build.
- Critérios de aceitação do PRD, item a item, incluindo o aviso permanente sobre limpeza dos dados do navegador.
- Navegação circular da tela individual (wrap-around nos dois extremos).
- Responsividade desktop/mobile e navegação por teclado nos botões e no toggle.
```

**Artefato gerado:** `specs/NNN-<feature>/checklists/release.md`

---

## Fase 6 — Geração de tasks

**Comando:** `/speckit.tasks`

**O que faz:** quebra spec + plano em uma lista numerada de tasks executáveis (T001, T002, ...), organizadas por história de usuário, com dependências e marcação `[P]` de paralelismo. **Este é o artefato que dirige a codificação** (Fase 8).

**Prompt:**

```
/speckit.tasks Gere as tasks da feature seguindo a ordem de dependência dos FDDs: FDD-01 (adaptador de persistência + Store da coleção — fundação) -> FDD-02 (módulo de catálogo + listagem agrupada na página inicial) -> FDD-03 (tela individual com navegação circular e toggle) -> FDD-04 (página da coleção pessoal com modo de edição) -> FDD-05 (validação de schema do seed, pipeline de build e deploy).

Regras:
- TDD: em cada história de usuário, liste primeiro as tasks de teste (Jest + @testing-library/svelte; fake-indexeddb na persistência) e só depois as de implementação, conforme a seção "Testes e validação" de docs/PRD-diario-colecao-elementais.md.
- Organize por história de usuário com checkpoints de validação independente ao fim de cada uma.
- Marque com [P] as tasks paralelizáveis (arquivos distintos, sem dependência).
- Inclua tasks explícitas para: geração do seed src/data/catalog.json a partir de docs/elementals.md, assets placeholder em assets/elementals/<tipo>/, aviso permanente de persistência local na home, e teste e2e Playwright do fluxo crítico (abrir home -> marcar itens -> recarregar -> abrir coleção -> remover item em modo de edição).
- Inclua o caminho exato de cada arquivo em cada task.
```

**Artefato gerado:** `specs/NNN-<feature>/tasks.md`

---

## Fase 7 — Análise de consistência

**Comando:** `/speckit.analyze`

**O que faz:** análise cruzada read-only de `spec.md`, `plan.md`, `tasks.md` e constituição, apontando duplicações, ambiguidades e requisitos sem cobertura. **Rodar antes de codificar** e corrigir qualquer achado crítico.

**Prompt:**

```
/speckit.analyze Verifique a consistência entre constitution.md, spec.md, plan.md e tasks.md, e a cobertura de todos os requisitos FR-001 a FR-006 de docs/PRD-diario-colecao-elementais.md nas tasks. Aponte: requisitos sem task correspondente, tasks sem requisito de origem, violações da constituição (ex.: qualquer dependência de backend ou login) e divergências com docs/HLD-01-diario-colecao-elementais.md e os FDDs. Corrija os achados críticos editando os artefatos antes da codificação.
```

---

## Fase 8 — Codificação (baseada nas tasks)

> O comando `/speckit.implement` **não é usado**. A codificação é conduzida task a task diretamente sobre `specs/NNN-<feature>/tasks.md`, respeitando a ordem de dependências e os checkpoints por história de usuário.

**Como conduzir:**

1. Abra `tasks.md` e execute em ordem, uma task (ou um grupo `[P]`) por vez:

```
Execute a task T001 de specs/NNN-<feature>/tasks.md exatamente como descrita. Ao concluir, rode os testes relacionados e marque a task como [X] no arquivo. Não inicie a próxima task sem minha confirmação.
```

2. Nos checkpoints de fim de história de usuário, valide de forma independente antes de seguir:

```
Checkpoint da história de usuário <N>: rode a suíte de testes completa e valide manualmente o fluxo no dev server, conforme o checkpoint descrito em tasks.md. Reporte o resultado antes de avançarmos.
```

3. Encerradas todas as tasks, faça a validação final contra o checklist e os critérios de aceitação:

```
Valide a implementação completa contra specs/NNN-<feature>/checklists/release.md e contra a seção "Critérios de aceitação" de docs/PRD-diario-colecao-elementais.md. Execute a suíte completa (unitários, integração com fake-indexeddb e e2e Playwright do fluxo crítico), meça o bundle gzip e o tempo de carregamento do catálogo, e reporte item a item (OK / pendência).
```

4. Feche a codificação com o build de produção e o deploy (tasks da FDD-05):

```bash
npm run build   # valida o schema do seed e gera o bundle estático
# deploy automático no Netlify/Vercel a partir do push na branch principal
```

---

## Regras do fluxo

- **Ordem importa:** constitution -> specify -> clarify -> plan -> (checklist) -> tasks -> analyze -> codificação. Não pule fases.
- **Um comando por vez**, revisando o artefato gerado antes de avançar.
- **A constituição manda:** qualquer proposta de backend, login ou telemetria deve ser rejeitada na hora.
- **`docs/` é a fonte da verdade:** em caso de conflito entre a spec gerada e os documentos de `docs/`, prevalecem PRD/HLD/FDDs — ajuste o artefato, não o documento.
- **Commits por história de usuário:** ao fim de cada checkpoint da Fase 8, commite o fatiamento funcional correspondente.
