# Diário de Coleção Elementais Constitution

## Princípios Fundamentais

### I. Sem Backend

A aplicação é 100% cliente: single-page app em Svelte/SvelteKit com TypeScript, pré-renderizada como site estático pelo Vite e distribuída via CDN (Netlify ou Vercel). É PROIBIDO introduzir qualquer código de servidor, API própria ou banco de dados externo; nenhuma funcionalidade pode depender de serviço remoto em tempo de execução. Toda feature deve operar apenas com os assets estáticos do build e as APIs nativas do navegador. Escalabilidade e disponibilidade (meta de 99.9%) são delegadas ao provedor de hosting estático.

Rationale: o catálogo é imutável e não se beneficia de backend; eliminar o servidor remove latência de API, custo de infraestrutura e toda a classe de problemas de disponibilidade e gestão de sessão (PRD — Decisões e trade-offs; HLD-01 — Arquitetura geral).

### II. Sem Autenticação

Nenhum fluxo de login, conta, cadastro ou coleta de dado pessoal pode existir na aplicação: a meta é ZERO etapas de autenticação para usar qualquer funcionalidade. É proibido adicionar credenciais, sessões, tokens, cookies de rastreamento ou qualquer mecanismo de identificação do usuário, nesta ou em futuras iterações, sem emenda desta constituição.

Rationale: decisão de produto para eliminar a fricção de acesso em um caso de uso pessoal e local (PRD — Objetivos e métricas; Decisão "Funcionar sem autenticação, com armazenamento apenas local"; HLD-01 — Segurança: "Autenticação — Não se aplica").

### III. Performance

Metas NON-NEGOTIABLE: carregamento do catálogo abaixo de 200 ms com cache estático/CDN; bundle JavaScript inicial abaixo de 150 KB gzip; cold start abaixo de 2 segundos em conexão 4G em dispositivos móveis. Técnicas obrigatórias: pré-renderização de todas as rotas, code splitting por rota, assets versionados por hash de build com invalidação a cada deploy, compressão gzip/brotli pelo provedor e imagens WebP com lazy loading. O peso do bundle e o tempo de carregamento do catálogo são medidos no pipeline de CI; regressões bloqueiam a publicação.

Rationale: a experiência em dispositivos móveis e a fricção zero de acesso dependem dessas metas (PRD — Requisitos não funcionais, Performance; HLD-01 — Considerações de escalabilidade e disponibilidade).

### IV. TDD nas Regras de Negócio (NON-NEGOTIABLE)

Testes primeiro, obrigatoriamente, na lógica das Svelte Stores (adição, remoção e derivação da coleção) e no módulo de catálogo (carga, validação e consultas por raridade, tipo e ID): o teste é escrito antes da implementação, deve falhar, e só então o código é produzido (red-green-refactor). Stack obrigatória: Jest + `@testing-library/svelte` nos testes unitários e `fake-indexeddb` nos testes de integração da persistência (gravação, leitura e remoção de IDs). O fluxo crítico end-to-end (abrir a home → marcar itens → recarregar → abrir a coleção → remover um item em modo de edição) deve ser automatizado com Playwright.

Rationale: as Stores e o módulo de catálogo concentram as regras de negócio; TDD nesses pontos protege exatamente onde um defeito corromperia a coleção do usuário (PRD — Testes e validação, Estratégia de validação; HLD-01 — Tecnologias principais).

### V. Sem Falha Silenciosa

Todo erro de leitura ou escrita no IndexedDB DEVE gerar feedback visível e acionável ao usuário e restaurar o estado anterior:

- Falha de escrita no toggle: o estado visual NÃO é alterado e o usuário é informado de que a seleção não foi salva.
- Falha de remoção em modo de edição: o item permanece na lista e a falha é comunicada.
- Falha de leitura: a coleção é tratada como vazia, com aviso explícito de que os dados não puderam ser carregados.
- IndexedDB indisponível (ex.: modo privado restrito): detectar na inicialização e degradar graciosamente — catálogo utilizável, marcação de posse desabilitada e aviso claro ao usuário.

O console deve permanecer livre de erros em produção: erros de storage são capturados pelo adaptador de persistência e convertidos em mensagens amigáveis. Falha silenciosa é defeito bloqueante de release.

Rationale: sem backend não há como recuperar estado perdido; o usuário precisa saber sempre se sua coleção foi ou não persistida (PRD — FR-003, FR-004, FR-005; Riscos e mitigação; HLD-01 — Adaptador de persistência: "tratamento de erro sem falha silenciosa").

### VI. Catálogo Imutável em Runtime

O seed `src/data/catalog.json` é a fonte de verdade do catálogo e é READ-ONLY em tempo de execução: carregado uma única vez a partir do JSON embutido no build e nunca modificado pela aplicação ou pelo usuário. O schema do seed é validado no pipeline de build; seed inválido DEVE falhar o build e bloquear a publicação. O módulo de catálogo atua como repositório read-only, expondo apenas consultas por raridade, tipo e ID. O seed deve cobrir 100% do catálogo-fonte (117 itens, 25 tipos), mantido consistente com a tabela de referência em `docs/elementals.md`; qualquer atualização do conjunto de elementais exige alterar o seed e publicar um novo deploy.

Rationale: a imutabilidade garante a integridade dos dados e permite servir o catálogo como asset estático com cache de CDN, sustentando a meta de 200 ms (PRD — FR-006; Requisitos não funcionais, Confiabilidade e integridade; HLD-01 — Padrões adotados: "Repositório read-only para o catálogo").

### VII. Privacidade Local

A coleção do usuário — apenas IDs de elementais — vive exclusivamente no IndexedDB do navegador, acessada via `idb-keyval`. É PROIBIDO trafegar qualquer dado do usuário para fora do dispositivo: sem telemetria, sem analytics, sem cookies de rastreamento, sem sincronização entre dispositivos. Os assets são entregues exclusivamente por HTTPS. A limitação de durabilidade (a coleção é apagada se os dados do navegador forem limpos) deve ser comunicada por aviso permanente na página inicial, e persistência elevada de storage via `navigator.storage.persist()` deve ser solicitada quando disponível.

Rationale: a coleção é um dado pessoal e local por decisão de produto; ausência de tráfego elimina toda a superfície de tratamento de dados pessoais (PRD — Requisitos não funcionais, Segurança e Observabilidade; Decisão "Persistência no IndexedDB via idb-keyval"; HLD-01 — Segurança, Proteção de dados).

## Restrições e Padrões Adicionais

Stack e arquitetura (HLD-01 — Padrões adotados):

- Svelte/SvelteKit + TypeScript, build via Vite; hosting estático em Netlify ou Vercel, com deploy automático a partir do repositório e artefato 100% portável entre os dois provedores.
- Static site generation com pré-renderização de todas as rotas.
- Estado reativo centralizado em Svelte Stores (`writable` e `derived`), com os componentes como consumidores puros.
- Adaptador de persistência isolando o IndexedDB do restante da aplicação, permitindo simulação em testes via `fake-indexeddb`.
- Arquitetura em camadas no cliente, com dependências sempre apontando da apresentação para o estado e dos dados para o estado.

Compatibilidade, acessibilidade e disponibilidade (PRD — Requisitos não funcionais):

- Navegadores: versões correntes e penúltima de Chrome, Firefox, Safari e Edge, com suporte a IndexedDB e ES modules; layout responsivo para desktop e mobile.
- Acessibilidade inspirada na WCAG 2.1 AA (navegação por teclado nos botões e no toggle, contraste adequado, textos alternativos nas imagens), sem exigência de conformidade formal.
- Sem service worker nesta entrega: o primeiro carregamento exige conexão, e a coleção permanece acessível enquanto a página estiver aberta.
- Gestão de segredos: nenhum segredo em runtime; o token de deploy vive apenas no cofre de segredos do CI/CD, fora do repositório.

## Fluxo de Desenvolvimento e Quality Gates

Testes e validação (PRD — Testes e validação):

- Testes unitários com Jest + `@testing-library/svelte` cobrindo as Stores e os componentes de listagem, tela individual e coleção.
- Testes de integração do fluxo de persistência com `fake-indexeddb` (gravação, leitura e remoção de IDs).
- Teste end-to-end do fluxo crítico com Playwright.
- QA por script na matriz de navegadores (versões correntes e penúltima de Chrome, Firefox, Safari e Edge), validando IndexedDB, layout responsivo e navegação, executado antes de cada release.
- Validação manual exploratória em dispositivo móvel real antes de cada publicação, focada em tempo de carregamento e responsividade.

Gates de pipeline (bloqueiam a publicação em caso de falha):

- Validação de schema do seed `src/data/catalog.json`.
- Medição do bundle JavaScript inicial (< 150 KB gzip) e do tempo de carregamento do catálogo (< 200 ms).
- Suite de testes (unitários, integração e end-to-end) verde.

Guardrails do repositório (AGENTS.md):

- Agentes só podem escrever em caminhos dentro da árvore raiz do repositório (`./`, `./src`, etc.); qualquer tentativa de escrita fora desses diretórios deve ser abortada.
- O diretório `docs/` é o repositório central de documentos que agentes consultam sob demanda.

## Governance

Esta constituição prevalece sobre qualquer outra prática, convenção ou preferência do projeto. Toda especificação, plano, tarefa e revisão de código — incluindo os artefatos gerados pelos comandos `/speckit.*` — deve verificar conformidade com os princípios acima; desvios exigem justificativa explícita e aprovação do responsável antes de prosseguir.

Emendas exigem: (1) documentação da motivação e do impacto; (2) aprovação do responsável pelo projeto; (3) atualização dos documentos dependentes (`docs/PRD-diario-colecao-elementais.md`, `docs/HLD-01-diario-colecao-elementais.md`, `AGENTS.md` e templates afetados); (4) versionamento semântico da constituição — MAJOR para remoção ou redefinição incompatível de princípio, MINOR para novo princípio ou seção, PATCH para esclarecimentos e correções.

Complexidade adicional só é aceita quando justificada por um requisito mensurável desta constituição (ex.: metas de performance). Use `AGENTS.md` como orientação operacional para desenvolvimento com agentes.

**Version**: 1.0.0 | **Ratified**: 2026-08-06 | **Last Amended**: 2026-08-06
