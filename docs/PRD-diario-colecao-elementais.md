### PRD: Diário de Coleção Elementais

Versão: 1.0
Data: 2026-08-06
Responsável: Alcir Junior

---

### Resumo

O Diário de Coleção Elementais é uma aplicação web leve, sem login e sem backend, que permite a jogadores de Fortnite registrar quais colecionáveis elementais possuem. O catálogo completo (117 itens, 25 tipos, variações Normal e especiais) é carregado a partir de arquivos JSON estáticos incluídos no projeto, e a posse de cada item é persistida localmente no IndexedDB do navegador. O objetivo é oferecer uma forma rápida e sem fricção de acompanhar a coleção pessoal, com carregamento do catálogo abaixo de 200 ms.

---

### Contexto e problema

Público-alvo ou consumidor

- Jogadores de Fortnite que colecionam os elementais e suas variações dentro do jogo.

Cenários de uso chave

- Jogador abre a aplicação no navegador (desktop ou mobile), navega pelo catálogo agrupado por raridade e tipo e abre a tela individual de um elemental para ver detalhes.
- Jogador marca um elemental como coletado com um clique e, dias depois, retorna à aplicação e encontra sua coleção preservada.
- Jogador acessa a página da coleção pessoal para ver apenas os itens que já possui e gerenciar essa lista.

Onde essa feature será implantada

- Novo sistema: aplicação web cliente (single-page app) construída com Svelte/SvelteKit e TypeScript, compilada via Vite e publicada como site estático em Netlify ou Vercel. Não há servidor de aplicação nem banco de dados externo; todo o estado vive no navegador do usuário.

Problemas priorizados

- Falta de uma ferramenta simples para registrar a posse dos elementais: o jogador depende de memória ou anotações manuais para saber quais dos 117 itens já possui. Impacto alto na experiência de coleta, prioridade alta.
- Soluções com login criam fricção desnecessária para um caso de uso pessoal e local. Impacto médio, prioridade alta (autenticação foi explicitamente removida do escopo).
- Catálogos servidos por backend adicionam latência e custo de infraestrutura sem benefício para um catálogo imutável. Impacto médio, prioridade média.

---

### Objetivos e métricas

| Objetivo                                                  | Métrica                                                  | Meta              | Critério de sucesso / SC |
| --------------------------------------------------------- | -------------------------------------------------------- | ----------------- | ------------------------ |
| Carregar o catálogo rapidamente                           | Tempo de carregamento do catálogo com cache estático     | Menor que 200 ms  | SC-007, SC-011           |
| Preservar a coleção do usuário entre sessões              | Percentual de seleções mantidas após fechar e reabrir o navegador | 100 por cento     | SC-004                   |
| Eliminar fricção de acesso                                | Etapas de autenticação exigidas para usar a aplicação    | 0 (sem login)     | SC-006                   |
| Cobrir todo o conjunto de colecionáveis                   | Cobertura do seed em relação ao catálogo-fonte           | 117 itens e 25 tipos, 100 por cento do catálogo | SC-001 |
| Garantir boa experiência em dispositivos móveis           | Peso do bundle JavaScript inicial                        | Abaixo de 150 KB gzip | SC-011               |
| Garantir cold start rápido em mobile                      | Tempo até a home interativa em conexão 4G                | Menor que 2 s     | SC-011                   |

---

### Escopo

Incluso

- Página inicial com a listagem completa do catálogo, agrupada por raridade (Raro, Especial, Épico, Lendário, Mítico) e por tipo (Água, Terra, Fogo, Ar, Peixoto, Pato, Fantasma, Demônio, Rei, Aura, Atacante, Sonolento, Banana, Punk, Chefe, Seven, Lhama, Ceifador, Ponto Zero, Batman, John Wick, Vini JR, Pedicure Antacid, Amendoin Queimado, Pollo), exibindo nome e imagem placeholder de cada item.
- Tela individual por elemental, com cabeçalho contendo nome, raridade e variação, imagem centralizada em destaque e rodapé com botões de navegação (anterior e próximo) e toggle central para salvar ou remover o item da coleção.
- Persistência local da coleção no IndexedDB via `idb-keyval`, salvando apenas os IDs dos itens colecionados.
- Página de visualização da coleção pessoal, com lista contendo miniatura, nome, raridade, variação, check verde indicando posse e botão **Editar coleção** para gerenciar os itens.
- Carga do catálogo a partir de arquivos JSON estáticos (`src/data/catalog.json`) incluídos no build.
- Aviso na página inicial informando que a coleção será perdida se os dados do navegador forem limpos.

Fora de escopo

- Autenticação de usuário e qualquer forma de conta (removida por decisão de produto).
- Busca, filtragem avançada e estatísticas da coleção.
- Backend, banco de dados externo ou API própria.
- Sincronização da coleção entre dispositivos.
- Exportação ou importação da coleção.
- Imagens finais dos elementais; nesta entrega são usados placeholders.

---

### Requisitos funcionais

#### FR-001 Listagem do catálogo agrupada

A página inicial exibe todos os 117 elementais do catálogo, agrupados por raridade e, dentro dela, por tipo, refletindo o seed `src/data/catalog.json` e a tabela de referência em `docs/elementals.md`.

**Fluxo principal**

- Usuário acessa a página inicial.
- A aplicação carrega o catálogo do JSON estático embutido no build.
- A tela exibe as seções de raridade (Raro, Especial, Épico, Lendário, Mítico) e, dentro de cada uma, os tipos com seus itens.
- Cada item exibe nome e imagem placeholder.

**Fluxos alternativos e exceções**

- Se o IndexedDB estiver disponível, os itens já colecionados são exibidos com indicação visual de posse.
- Se o IndexedDB não estiver disponível no navegador, o catálogo é exibido normalmente e a marcação de posse fica indisponível, com aviso ao usuário.

**Erros previstos**

- Falha ao interpretar o JSON do catálogo: exibir mensagem de erro na página inicial em vez de lista vazia silenciosa.

**Prioridade:** alta

---

#### FR-002 Visualização individual do elemental

Cada elemental é exibido em tela própria, com foco na imagem e navegação sequencial entre os itens do catálogo.

**Fluxo principal**

- Usuário seleciona um elemental na listagem.
- A tela individual abre com cabeçalho contendo nome, raridade e variação do elemental.
- A imagem do elemental é exibida centralizada e em destaque.
- O rodapé exibe botões anterior e próximo, que navegam para o elemental imediatamente anterior ou seguinte na ordenação do catálogo, e um toggle central para salvar ou remover o item da coleção.

**Fluxos alternativos e exceções**

- A navegação é circular: no primeiro item do catálogo, o botão anterior navega para o último item.
- No último item do catálogo, o botão próximo navega para o primeiro item.

**Erros previstos**

- Imagem do elemental não encontrada: exibir imagem placeholder padrão sem quebrar a navegação.

**Prioridade:** alta

---

#### FR-003 Adicionar e remover da coleção com persistência local

O usuário adiciona ou remove um elemental da coleção com um clique no toggle, e a seleção é gravada no IndexedDB via `idb-keyval`, persistindo apenas o ID do item.

**Fluxo principal**

- Usuário clica no toggle de um elemental não colecionado.
- A aplicação grava o ID do elemental no IndexedDB.
- O estado visual do toggle e da indicação de posse é atualizado imediatamente.
- Ao clicar novamente em um item colecionado, o ID é removido do IndexedDB e o estado visual reverte.

**Fluxos alternativos e exceções**

- Se a gravação no IndexedDB falhar, o estado visual não é alterado e o usuário é informado da falha.
- Se os dados locais forem limpos pelo navegador ou pelo usuário, todas as seleções são perdidas; a página inicial exibe aviso permanente sobre essa característica.

**Erros previstos**

- Erro de escrita no IndexedDB (ex: modo privado com storage bloqueado, cota excedida): exibir mensagem acionável informando que a seleção não foi salva.

**Prioridade:** alta

---

#### FR-004 Visualização da coleção pessoal

Página que lista apenas os elementais marcados como colecionados pelo usuário atual.

**Fluxo principal**

- Usuário acessa a página da coleção.
- A aplicação lê os IDs salvos no IndexedDB e resolve cada ID contra o catálogo estático.
- A tela exibe, para cada item colecionado, miniatura, nome, raridade, variação e um check verde indicando posse.
- Abaixo da lista, o botão **Editar coleção** leva ao modo de gerenciamento dos itens.

**Fluxos alternativos e exceções**

- Se a coleção estiver vazia, exibir mensagem orientando o usuário a explorar o catálogo.
- Se algum ID salvo não existir mais no catálogo (ex: após atualização do seed), o item é ignorado na listagem.

**Erros previstos**

- Falha de leitura do IndexedDB: tratar a coleção como vazia e exibir aviso de que os dados não puderam ser carregados.

**Prioridade:** alta

---

#### FR-005 Edição da coleção pessoal

A partir da página da coleção, o usuário gerencia os itens já marcados, removendo ou ajustando a seleção sem precisar navegar item a item no catálogo.

**Fluxo principal**

- Usuário clica no botão **Editar coleção** na página da coleção.
- A lista entra em modo de edição, permitindo remover itens da coleção.
- Cada remoção atualiza o IndexedDB e o estado visual imediatamente.
- Usuário sai do modo de edição e a lista reflete o estado final.

**Fluxos alternativos e exceções**

- Remover todos os itens deixa a coleção vazia e exibe a mensagem de coleção vazia.

**Erros previstos**

- Erro de escrita no IndexedDB durante a remoção: manter o item na lista e informar a falha.

**Prioridade:** media

---

#### FR-006 Carga do catálogo a partir de seed estático

Os dados de todos os elementais disponíveis ficam em arquivos fonte (JSON) versionados no repositório e são carregados no cliente na inicialização da aplicação.

**Fluxo principal**

- O seed `src/data/catalog.json` é mantido atualizado conforme a tabela de referência em `docs/elementals.md` sempre que o conjunto do jogo for importado.
- No build, o JSON é embutido no pacote estático.
- Na inicialização, a aplicação lê o catálogo localmente, sem chamada de rede a backend.

**Fluxos alternativos e exceções**

- Atualização do catálogo exige novo deploy; usuários recebem a nova versão no próximo carregamento após a publicação.

**Erros previstos**

- Seed inválido (schema fora do esperado): o build deve falhar na validação, impedindo publicar catálogo inconsistente.

**Prioridade:** alta

---

### Requisitos não funcionais

Performance

- Tempo de carregamento do catálogo abaixo de 200 ms, garantido pelo empacotamento estático e pelo cache de CDN.
- Bundle JavaScript inicial pequeno, favorecido pela escolha de Svelte e Vite, com meta abaixo de 150 KB gzip.
- Tempo de cold start em dispositivos móveis abaixo de 2 segundos em conexão 4G.

Disponibilidade

- A aplicação é um site estático servido por CDN (Netlify ou Vercel); a disponibilidade é delegada ao provedor, com meta de 99.9 por cento.
- Não há backend próprio; nenhuma funcionalidade depende de serviço remoto em tempo de execução.
- Comportamento offline: não há service worker nesta entrega; o primeiro carregamento exige conexão, e a coleção permanece acessível enquanto a página estiver aberta.

Segurança

- Nenhum dado pessoal é coletado ou transmitido; não há login, cookies de rastreamento ou envio de informações a servidores.
- Todos os dados da coleção permanecem no dispositivo do usuário, no IndexedDB, sem criptografia adicional (característica da plataforma web).

Observabilidade

- Console livre de erros em produção, com erros de storage capturados e exibidos ao usuário de forma amigável.
- Sem telemetria ou analytics nesta entrega, alinhado à decisão de não coletar dados do usuário.

Confiabilidade e integridade

- Os dados do catálogo são imutáveis em tempo de execução: carregados uma única vez e nunca modificados pelo usuário, o que garante sua integridade.
- A coleção persiste entre sessões, mas será perdida se o usuário limpar os dados do navegador; essa limitação é comunicada por aviso na página inicial.

Compatibilidade e portabilidade

- Navegadores modernos com suporte a IndexedDB e ES modules: versões correntes e penúltima de Chrome, Firefox, Safari e Edge.
- A matriz de compatibilidade dos navegadores acima é escopo de validação de layout responsivo, navegação (por teclado, clique e toque) e funcionamento do IndexedDB.
- Layout responsivo para uso em desktop e dispositivos móveis, com os seguintes critérios objetivos:
  - viewport de 320 px a 1440 px sem scroll horizontal forçado;
  - breakpoint mobile/tablet: largura < 768 px, com cards em 2 colunas e seções empilhadas verticalmente;
  - breakpoint desktop: largura ≥ 768 px, com cards em até 4 colunas e seções lado a lado quando couberem;
  - áreas de toque mínimas de 44 × 44 px para botões e toggles.

Acessibilidade

- Critérios objetivos de acessibilidade, alinhados às diretrizes da WCAG 2.1 AA:
  - todos os controles interativos (botões anterior/próximo, **Editar coleção**, toggle de posse na listagem e na tela individual) devem ser operáveis por teclado (navegação por Tab e ativação por Enter ou Espaço);
  - todo placeholder de elemental deve possuir texto alternativo (`alt`) descritivo composto por tipo e variação (ex.: "Água Normal");
  - contraste mínimo de 4.5:1 para texto e 3:1 para componentes interativos e bordas de foco.

---

### Arquitetura e abordagem

Abordagem

- Aplicação web 100 por cento cliente (single-page app), sem servidor de aplicação. O front-end em Svelte/SvelteKit com TypeScript é compilado pelo Vite em um pacote estático, publicado em Netlify ou Vercel e distribuído via CDN. O catálogo é um JSON estático embutido no build, e o estado da coleção vive exclusivamente no IndexedDB do navegador, acessado pelo wrapper `idb-keyval`, que salva apenas os IDs dos itens colecionados. O gerenciamento de estado em memória usa Svelte Stores (`writable` e `derived`), garantindo reatividade automática dos componentes.

Componentes

- Página inicial (listagem do catálogo agrupada por raridade e tipo, com aviso sobre persistência local).
- Tela individual do elemental (cabeçalho com nome, raridade e variação; imagem em destaque; rodapé com navegação circular anterior e próximo e toggle de coleção).
- Página da coleção pessoal (lista com miniaturas, check de posse e botão **Editar coleção**).
- Store da coleção (Svelte Store sincronizada com o IndexedDB via `idb-keyval`).
- Módulo de catálogo (carrega e valida `src/data/catalog.json` e expõe consultas por raridade, tipo e ID).
- Assets estáticos de imagem em `assets/elementals/<tipo>/`, em formato WebP, com placeholders nesta entrega.

Integrações

- IndexedDB do navegador, via `idb-keyval`, para persistência da coleção.
- Provedor de hosting estático (Netlify ou Vercel), com deploy automático a partir do repositório e cache de CDN.
- Nenhuma integração com backend, API externa ou serviço de autenticação.

### Decisões e trade-offs

#### Decisão: Funcionar sem autenticação, com armazenamento apenas local

- **Justificativa:** elimina toda a fricção de acesso para um caso de uso pessoal e simplifica drasticamente a arquitetura, sem backend e sem tratamento de dados pessoais.
- **Trade-off:** a coleção não sincroniza entre dispositivos e é perdida se o usuário limpar os dados do navegador, limitação comunicada por aviso na página inicial.

#### Decisão: Persistência no IndexedDB via `idb-keyval`

- **Justificativa:** API assíncrona e simples (chave-valor), adequada para salvar apenas IDs, sem bloquear a interface e com suporte amplo nos navegadores.
- **Trade-off:** os dados ficam sujeitos às políticas de evicção do navegador (limpeza manual ou sob pressão de armazenamento), sem garantia de durabilidade de longo prazo.

#### Decisão: Catálogo como JSON estático embutido no build

- **Justificativa:** o catálogo é imutável em tempo de execução, então servi-lo como asset estático garante carregamento abaixo de 200 ms via CDN e elimina custo e complexidade de backend.
- **Trade-off:** qualquer atualização do conjunto de elementais exige alterar o seed e publicar um novo deploy.

#### Decisão: Svelte com SvelteKit e Vite

- **Justificativa:** compila para JavaScript enxuto, com reatividade nativa e bundle pequeno, beneficiando a performance em dispositivos móveis.
- **Trade-off:** ecossistema e pool de desenvolvedores menores que os de React, o que pode encarecer manutenção futura.

#### Decisão: Imagens placeholder nesta entrega

- **Justificativa:** desbloqueia o desenvolvimento de todos os fluxos sem depender da produção dos assets finais.
- **Trade-off:** a experiência visual fica limitada até que as imagens reais dos elementais sejam produzidas e adicionadas.

---

### Dependências

#### Técnica: Seed do catálogo e assets de imagem

O catálogo-fonte (`src/data/catalog.json`) e a tabela de referência (`docs/elementals.md`) precisam estar completos e consistentes, cobrindo os 117 itens e 25 tipos, pois toda a experiência depende desses dados. A equipe do projeto é responsável por manter o seed atualizado a cada importação do conjunto do jogo e por produzir ou substituir os placeholders de imagem.

#### Externa: Provedor de hosting estático

Netlify ou Vercel precisa estar configurado com deploy automático a partir do repositório, pois a disponibilidade e o tempo de carregamento abaixo de 200 ms dependem do cache de CDN do provedor.

#### Técnica: Suporte do navegador a IndexedDB

A persistência da coleção depende do IndexedDB estar disponível e habilitado no navegador do usuário; navegadores em modo restrito (ex: algumas configurações de modo privado) podem bloquear a gravação.

---

### Riscos e mitigação

#### Usuário perde a coleção ao limpar os dados do navegador

- **Probabilidade:** media
- **Impacto:** perda total do histórico de coleta do usuário, sem possibilidade de recuperação.
- **Mitigação:**
  - Exibir aviso permanente na página inicial informando que a coleção é local e será apagada com a limpeza dos dados do navegador.
  - Solicitar persistência elevada de storage via `navigator.storage.persist()` quando disponível.
- **Plano de contingência:** em versão futura, oferecer exportação e importação da coleção em arquivo; nesta entrega, o usuário precisa remarcar os itens manualmente.

#### Catálogo fica desatualizado em relação ao conjunto do jogo

- **Probabilidade:** media
- **Impacto:** novos elementais ou variações não aparecem na aplicação, reduzindo sua utilidade.
- **Mitigação:**
  - Manter o processo de atualização do seed documentado, com a tabela de referência em `docs/elementals.md` como fonte da verdade.
  - Validar o schema do JSON no build para impedir publicação de seed inconsistente.
- **Plano de contingência:** correção do seed seguida de novo deploy, que chega aos usuários no próximo carregamento.

#### Navegador bloqueia ou evicta o IndexedDB

- **Probabilidade:** baixa
- **Impacto:** impossibilidade de salvar a coleção ou perda silenciosa em cenários de pressão de armazenamento.
- **Mitigação:**
  - Detectar indisponibilidade do IndexedDB e exibir mensagem clara de que a marcação de posse não será persistida.
  - Tratar erros de escrita e leitura com feedback ao usuário, sem falhas silenciosas.
- **Plano de contingência:** a aplicação continua utilizável para consulta ao catálogo mesmo sem persistência.

#### Assets de imagem não entregues a tempo

- **Probabilidade:** media
- **Impacto:** experiência visual degradada, sem impacto funcional.
- **Mitigação:**
  - Usar placeholders consistentes por tipo e variação em todos os fluxos.
  - Estruturar os caminhos de imagem (`assets/elementals/<tipo>/`) para permitir substituição direta dos arquivos, sem mudança de código.
- **Plano de contingência:** lançar a versão com placeholders e adicionar os assets reais em iteração posterior, por meio de novo deploy estático.

---

### Critérios de aceitação

Checklist objetivo que define se a feature está pronta.

- A página inicial exibe os 117 itens do catálogo, agrupados por raridade e por tipo, conforme `src/data/catalog.json` e `docs/elementals.md`.
- Cada item da listagem mostra nome e imagem placeholder.
- A tela individual de um elemental exibe cabeçalho com nome, raridade e variação, imagem centralizada e rodapé com botões anterior e próximo com navegação circular e toggle central.
- O toggle adiciona e remove o item da coleção, e a seleção permanece após recarregar a página e após fechar e reabrir o navegador.
- A página da coleção lista apenas os itens marcados, com miniatura, nome, raridade, variação, check verde e botão **Editar coleção** funcional.
- Nenhum fluxo exige login ou criação de conta.
- O tempo de carregamento do catálogo é inferior a 200 ms com cache de CDN.
- A página inicial exibe aviso informando que a coleção será perdida se os dados do navegador forem limpos.
- Não existe busca, filtragem avançada ou estatísticas na interface.

---

### Testes e validação

Tipos de teste obrigatórios

- Testes unitários com Jest e `@testing-library/svelte`, cobrindo a lógica das Stores (adição, remoção e derivação da coleção) e os componentes de listagem, tela individual e coleção.
- Testes de integração do fluxo de persistência, simulando o IndexedDB via `fake-indexeddb` para validar gravação, leitura e remoção de IDs.
- Testes de compatibilidade em matriz de navegadores (versões correntes e penúltima de Chrome, Firefox, Safari e Edge), validando IndexedDB, layout responsivo nos breakpoints definidos, navegação por teclado/clique/toque e navegação circular da tela individual.
- Medição de performance do carregamento do catálogo, verificando a meta de 200 ms com cache, e do peso do bundle.
- Validação de schema do seed JSON no pipeline de build.
- Teste end-to-end do fluxo crítico: abrir a home, marcar itens, recarregar, abrir a coleção e remover um item em modo de edição.

Estratégia de validação

- TDD na lógica de Stores e no módulo de catálogo, que concentram as regras de negócio.
- QA por script para os fluxos de interface (listagem, navegação individual, toggle, coleção e edição) na matriz de navegadores, executado antes de cada release.
- Validação manual exploratória em dispositivo móvel real antes da publicação, focada em tempo de carregamento e responsividade.
