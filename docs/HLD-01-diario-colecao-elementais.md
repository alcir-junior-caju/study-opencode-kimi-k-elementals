### HLD-01: Diário de Coleção Elementais

Versão: 1.0
Data: 2026-08-06
Responsável: Alcir Junior

---

### Objetivo técnico

Entregar uma aplicação web 100 por cento cliente (single-page app) que renderiza um catálogo estático de 117 elementais (25 tipos, variações Normal e especiais) e gerencia a coleção do usuário persistida localmente no IndexedDB, sem nenhum componente de backend. Os problemas técnicos endereçados são: eliminar a necessidade de servidor de aplicação e banco de dados para um catálogo imutável, garantir carregamento do catálogo abaixo de 200 ms via cache de CDN, manter o bundle JavaScript inicial abaixo de 150 KB gzip para dispositivos móveis e persistir a coleção entre sessões sem exigir autenticação.

Dependências com outros sistemas

- Provedor de hosting estático (Netlify ou Vercel) com CDN global e deploy automático a partir do repositório.
- IndexedDB do navegador do usuário, acessado via wrapper `idb-keyval`.
- Repositório Git contendo o seed do catálogo (`src/data/catalog.json`) e os assets de imagem.
- Não há dependência de backend, API externa ou serviço de autenticação.

---

### Arquitetura geral

A solução é uma SPA construída com Svelte e SvelteKit em TypeScript, pré-renderizada como site estático pelo Vite e distribuída por CDN. A execução acontece inteiramente no navegador, organizada em três camadas internas: apresentação (páginas e componentes Svelte), estado reativo (Svelte Stores) e dados (módulo de catálogo read-only e adaptador de persistência sobre IndexedDB). A ausência de backend remove toda a classe de problemas de disponibilidade de servidor, latência de API e gestão de sessão.

Ambiente de implantação

- Cloud pública: site estático publicado em Netlify ou Vercel, servido por CDN multi-região com invalidação de cache por deploy.
- Execução no navegador do usuário, em desktop e dispositivos móveis, nas versões correntes e penúltima de Chrome, Firefox, Safari e Edge.

Tecnologias principais

- Svelte e SvelteKit: interface reativa compilada para JavaScript enxuto, favorecendo a meta de bundle.
- TypeScript: tipagem estática do catálogo, dos IDs e das Stores.
- Vite: build e empacotamento com code splitting por rota.
- `idb-keyval`: wrapper chave-valor sobre IndexedDB para persistência da coleção.
- Jest e `@testing-library/svelte` para testes unitários, `fake-indexeddb` para testes de integração da persistência e Playwright para o teste end-to-end do fluxo crítico.
- Netlify ou Vercel: hosting estático, CDN, TLS e deploy automático.

Padrões adotados

- Static site generation com pré-renderização de todas as rotas.
- Estado reativo centralizado em Svelte Stores (`writable` e `derived`), com os componentes como consumidores puros.
- Repositório read-only para o catálogo, expondo consultas por raridade, tipo e ID sobre o JSON embutido.
- Adaptador de persistência isolando o IndexedDB do restante da aplicação, permitindo simulação em testes.
- Arquitetura em camadas no cliente, com dependências sempre apontando da apresentação para o estado e dos dados para o estado.

---

### Componentes e responsabilidades

| Componente                    | Responsabilidades                                                                                                  | Dependências                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Página inicial                | Renderizar o catálogo agrupado por raridade e tipo, exibir indicação de posse e o aviso permanente sobre persistência local | Módulo de catálogo, Store da coleção                  |
| Tela individual do elemental  | Exibir nome, raridade, variação e imagem em destaque; navegação circular anterior e próximo; toggle de coleção     | Módulo de catálogo, Store da coleção, roteador        |
| Página da coleção pessoal     | Listar apenas os itens salvos (miniatura, nome, raridade, variação, check verde) e operar o modo de edição via botão Editar coleção | Store da coleção, Módulo de catálogo                  |
| Store da coleção              | Manter o conjunto reativo de IDs colecionados, derivar estado de posse e sincronizar cada alteração com a persistência | Adaptador de persistência, Módulo de catálogo         |
| Módulo de catálogo            | Carregar o JSON embutido no build, validar estrutura e expor consultas por raridade, tipo e ID                     | Seed `src/data/catalog.json`                          |
| Adaptador de persistência     | Ler e gravar o conjunto de IDs no IndexedDB de forma assíncrona, com tratamento de erro sem falha silenciosa        | IndexedDB do navegador via `idb-keyval`               |
| Pipeline de build e deploy    | Validar o schema do seed (bloqueando publicação inválida), gerar o bundle estático e publicar no provedor          | Vite, repositório Git, provedor de hosting            |

---

### Fluxo de requisições e de dados

**Fluxo de requisição**

- O navegador requisita a página e o CDN entrega HTML, CSS e JS estáticos, com cache de edge garantindo carregamento do catálogo abaixo de 200 ms.
- A aplicação inicializa e o módulo de catálogo carrega o JSON embutido no bundle, sem chamada de rede a backend.
- A Store da coleção solicita ao adaptador de persistência a leitura dos IDs salvos no IndexedDB.
- A interface deriva o estado de posse de cada item e renderiza a listagem agrupada, a tela individual ou a página da coleção conforme a rota.
- No toggle de coleção, a Store atualiza o conjunto de IDs em memória e comanda a gravação no IndexedDB; em caso de falha de escrita, o estado visual não é alterado e o usuário é informado.

**Fluxo de dados**

- Catálogo: origem no seed `src/data/catalog.json` versionado no repositório; validação de schema no pipeline de build; normalização em estruturas de consulta (por raridade, tipo e ID) na inicialização; destino na renderização da UI. O catálogo é imutável em tempo de execução.
- Coleção: origem nas ações do usuário na UI; transformação em conjunto de IDs na Store; destino no IndexedDB, que persiste apenas IDs. Na inicialização, o fluxo reverte: IDs lidos do IndexedDB são resolvidos contra o catálogo, e IDs que não existem mais no seed são ignorados.
- Não há replicação, sincronização externa ou tráfego de dados do usuário para fora do dispositivo.

---

### Modelo de dados (alto nível)

Entidades principais

- Elemental: `id` (string única, ex: `water_gold`), `type` (um dos 25 tipos), `rarity` (Raro, Especial, Épico, Lendário ou Mítico), `variation` (Normal, Dourado, Gelatinoso, Galático, Metalizado, Cubo, Gema ou Quack) e `imagePath` (caminho WebP em `assets/elementals/<tipo>/`).
- Coleção do usuário: conjunto de IDs de elementais, armazenado como estrutura chave-valor no IndexedDB.

Relações

- Elemental agrupa-se por `rarity` e, dentro dela, por `type`; os agrupamentos são derivações do catálogo, não entidades persistidas.
- Coleção referencia Elemental por `id`; referências órfãs (ID ausente no seed atual) são descartadas na leitura.

Fonte de verdade

- Catálogo: o arquivo `src/data/catalog.json` no repositório, mantido consistente com a tabela de referência em `docs/elementals.md` a cada importação do conjunto do jogo.
- Coleção: o IndexedDB do navegador de cada usuário, único local de persistência, sem sincronização e sujeito à limpeza dos dados do navegador.

---

### Interfaces públicas

| Nome                          | Tipo          | Protocolo      | Exposição           | SLAs/Limites                                                                  |
| ----------------------------- | ------------- | -------------- | ------------------- | ----------------------------------------------------------------------------- |
| Páginas estáticas da aplicação | Site estático | HTTPS          | Externa             | Carregamento do catálogo abaixo de 200 ms com cache; disponibilidade de 99.9 por cento delegada ao provedor |
| Store da coleção              | Storage local | IndexedDB API  | Interna ao navegador | Leitura e escrita assíncronas em milissegundos; durabilidade sujeita às políticas de evicção do navegador    |

A aplicação não expõe APIs de backend, filas, streams ou SDKs.

---

### Considerações de escalabilidade e disponibilidade

Abordagem geral

- A escalabilidade é delegada ao CDN: por ser um site estático sem estado no servidor, o tráfego escala horizontalmente na edge do provedor sem nenhuma mudança de arquitetura.
- No cliente, a eficiência vem de bundle pequeno, code splitting e carregamento local do catálogo, mantendo o cold start abaixo de 2 segundos em conexão 4G.

Técnicas aplicadas

- Cache de CDN com assets versionados por hash de build e invalidação a cada deploy.
- Code splitting por rota e pré-carregamento da rota seguinte pelo SvelteKit.
- Imagens WebP com lazy loading e placeholders até a entrega dos assets finais.
- Compressão gzip ou brotli aplicada pelo provedor de hosting.
- Solicitação de persistência elevada de storage via `navigator.storage.persist()` quando disponível.

Meta de disponibilidade

- 99.9 por cento de uptime mensal, delegada ao provedor de hosting estático; a aplicação não possui componentes próprios que possam ficar indisponíveis isoladamente.

---

### Segurança

Autenticação

- Não se aplica: aplicação pública e sem login, por decisão de produto. Não há credenciais, sessões ou tokens em runtime.

Autorização

- Não se aplica: todo o conteúdo do catálogo é público e a coleção pertence exclusivamente ao dispositivo do usuário.

Proteção de dados

- Nenhum dado pessoal é coletado, transmitido ou armazenado fora do dispositivo; não há cookies de rastreamento nem analytics nesta entrega.
- Entrega dos assets exclusivamente por HTTPS (TLS terminado no CDN do provedor).
- A coleção reside no IndexedDB do navegador, sem criptografia adicional, característica da plataforma web; o usuário é informado de que a limpeza dos dados do navegador apaga a coleção.

Gestão de segredos

- Nenhum segredo é necessário em tempo de execução. O único segredo do projeto é o token de deploy no provedor de hosting, mantido no cofre de segredos da própria plataforma de CI/CD, fora do repositório.

---

### Observabilidade

Logs

- Aplicação cliente sem logs remotos nesta entrega; a política é manter o console livre de erros em produção, com erros de storage capturados e convertidos em mensagens amigáveis ao usuário.

Métricas

- Métricas de plataforma fornecidas pelo provedor de hosting: requisições, banda, taxa de acerto de cache e códigos de status por deploy.
- Métricas de engenharia acompanhadas no pipeline: peso do bundle (meta abaixo de 150 KB gzip) e tempo de carregamento do catálogo (meta abaixo de 200 ms) medidos em CI.

Tracing

- Não se aplica distributed tracing, pois não há chamadas entre serviços; a navegação é client-side e o único recurso externo é o CDN.

Dashboards e alertas

- Painel do provedor de hosting para deploys, disponibilidade e consumo de banda.
- Alertas de falha de build e de validação de schema do seed no pipeline, bloqueando publicações inconsistentes.

---

### Riscos arquiteturais e mitigação

#### Perda da coleção por limpeza ou evicção do IndexedDB

- **Probabilidade:** media
- **Impacto:** perda total do histórico de coleta do usuário, sem possibilidade de recuperação.
- **Mitigação:**
  - Aviso permanente na página inicial informando que a coleção é local e será apagada com a limpeza dos dados do navegador.
  - Solicitação de persistência elevada de storage via `navigator.storage.persist()` quando disponível.
- **Plano de contingência:** em versão futura, oferecer exportação e importação da coleção em arquivo; nesta entrega, o usuário remarca os itens manualmente.

#### Seed do catálogo inválido ou desatualizado

- **Probabilidade:** media
- **Impacto:** catálogo inconsistente publicado ou novos elementais ausentes da aplicação.
- **Mitigação:**
  - Validação de schema do JSON no pipeline de build, com falha bloqueando o deploy.
  - Tabela de referência em `docs/elementals.md` como fonte da verdade para revisão a cada importação.
- **Plano de contingência:** correção do seed seguida de novo deploy, que chega aos usuários no próximo carregamento.

#### Navegador bloqueia o IndexedDB (modo restrito ou privado)

- **Probabilidade:** baixa
- **Impacto:** impossibilidade de persistir a coleção para o usuário afetado.
- **Mitigação:**
  - Detecção de indisponibilidade na inicialização e degradação graciosa: catálogo utilizável, marcação desabilitada, aviso claro ao usuário.
  - Tratamento de erros de leitura e escrita com feedback explícito, sem falhas silenciosas.
- **Plano de contingência:** a aplicação continua utilizável para consulta ao catálogo mesmo sem persistência.

#### Indisponibilidade do provedor de hosting

- **Probabilidade:** baixa
- **Impacto:** aplicação fora do ar para novos acessos; usuários com a página aberta não são afetados.
- **Mitigação:**
  - Uso do CDN multi-região do provedor, com cache de edge absorvendo parte das falhas de origem.
  - Artefato de build 100 por cento portável entre Netlify e Vercel.
- **Plano de contingência:** republicar o mesmo artefato estático no provedor alternativo e apontar o DNS, sem mudança de código.

#### Assets de imagem não entregues a tempo

- **Probabilidade:** media
- **Impacto:** experiência visual degradada, sem impacto funcional.
- **Mitigação:**
  - Placeholders consistentes por tipo e variação em todos os fluxos.
  - Caminhos de imagem padronizados (`assets/elementals/<tipo>/`) permitindo substituição direta dos arquivos, sem mudança de código.
- **Plano de contingência:** lançar com placeholders e adicionar os assets reais em iteração posterior, por meio de novo deploy estático.

---

### ADRs e próximos passos

ADRs associados

- ADR 001, aplicação sem autenticação e com armazenamento exclusivamente local (a formalizar).
- ADR 002, persistência da coleção no IndexedDB via `idb-keyval`, salvando apenas IDs (a formalizar).
- ADR 003, catálogo como JSON estático embutido no build, com validação de schema no pipeline (a formalizar).
- ADR 004, stack Svelte e SvelteKit com Vite e TypeScript para bundle mínimo (a formalizar).
- ADR 005, navegação circular na tela individual do elemental (a formalizar).

Decisões pendentes

- Escolha definitiva entre Netlify e Vercel, com critérios de custo, qualidade do pipeline de deploy e métricas de plataforma.
- Ferramenta de validação de schema do seed (ex: zod ou JSON Schema) e ponto de execução no pipeline.
- Cronograma de substituição dos placeholders pelos assets de imagem reais.

Próximos passos

- Formalizar os ADRs listados acima no repositório.
- Detalhar FDDs por fatia funcional: listagem do catálogo, tela individual, coleção pessoal com edição, camada de persistência e pipeline de build.
- Configurar o pipeline de CI com testes unitários, teste de integração da persistência, validação de schema do seed e medição de bundle e de tempo de carregamento.
- Executar prova de conceito de performance em dispositivo móvel real, validando as metas de 200 ms de carregamento e 150 KB de bundle.
