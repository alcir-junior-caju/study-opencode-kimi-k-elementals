# Diário de Coleção Elementais

## Propósito
O projeto é uma aplicação web leve que permite aos jogadores do Fortnite **registrar quais colecionáveis elementais possuem**. A funcionalidade principal consiste em:
1. Exibir a lista completa de elementais agrupada por raridade e categoria.
2. Permitir ao usuário adicionar um elemental à sua coleção com um clique, salvando essa escolha no IndexedDB.
3. Carregar os dados iniciais do catálogo a partir de arquivos JSON estáticos incluídos no projeto; não há banco de dados externo.

A aplicação é deliberadamente mínima – não inclui busca, filtragem avançada ou estatísticas; apenas mostra o catálogo e permite que o usuário marque os itens já coletados.

## Conjunto de Funcionalidades (High-Level)
| Funcionalidade | Descrição |
|-----------------|-----------|
| Autenticação do Usuário | Removida: o aplicativo funciona sem login, usando armazenamento local. |
| Listagem do Catálogo | Página inicial exibe todos os elementais, separados por raridade (*Raro*, *Épico*, *Lendário*, *Mítico*) e sub‑categoria (água, fogo, etc.), refletindo a tabela em `docs/elementals.md`. Cada item mostra seu nome e uma imagem placeholder. |
| Adicionar à Coleção | Usuários adicionam ou removem um elemental com um clique; a seleção é persistida localmente via IndexedDB. Cada elemental será exibido em tela única com cabeçalho contendo nome, raridade e variação, imagem centralizada em destaque, e rodapé com botões de navegação (anterior/próximo) e, no centro, um toggle que alterna entre salvar ou remover do histórico local. |
| Visualização da Coleção Pessoal | Página opcional listando apenas os elementais adicionados pelo usuário atual. Inclui uma lista com miniatura, nome, raridade e variação de cada elemento, um check verde indicando posse, e abaixo a lista um botão **Editar coleção** para gerenciar itens. |
| Dados Seed do Catálogo | Os dados iniciais de todos os elementais disponíveis ficam em arquivos fonte (por ex.: CSV, JSON), carregados no cliente ao inicializar a aplicação.

## Persistência local
Dados de posse são armazenados localmente em IndexedDB usando a API `idb`. Cada seleção do usuário permanece entre sessões, mas será perdida se o histórico do navegador for limpo ou os dados forem apagados manualmente.

## Fluxo de História do Usuário
1. Acessar a página inicial – o catálogo é carregado localmente a partir de arquivos JSON estáticos.
2. Clicar em **Adicionar** grava a seleção no IndexedDB e atualiza o estado do botão.
3. Se os dados locais forem limpos, todas as seleções serão perdidas; um aviso será exibido na página inicial informando que a coleção será apagada.

## Observações Não‑Funcionais
A aplicação prioriza **velocidade**; tempos de carregamento do catálogo são <200 ms graças ao cache estático.



Como os usuários não alteram os dados dos elementais, a integridade é assegurada pelo fato de que eles são carregados apenas uma vez e nunca modificados.



---
*Este documento descreve o funcionamento pretendido em alto nível. Detalhes técnicos a serem implementados posteriormente.*

## Tecnologia Selecionada
| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| **Front‑end Framework** | **Svelte** (via SvelteKit) | Compila para JS leve, reatividade nativa e excelente performance em dispositivos móveis. |
| **Bundler / Dev‑server** | **Vite** | Build instantâneo, output bundle pequeno. |
| **Persistência local** | `idb-keyval` (wrapper `idb`) | Wrapper simples para IndexedDB, salva apenas IDs dos elementos colecionados. |
| **Gerenciamento de estado** | Svelte Store (`writable`, `derived`) | Reatividade automática nos componentes. |
| **Tipagem** | **TypeScript** 4+ | Evita bugs em JSON/IDs e aumenta produtividade. |
| **Testes unitários** | **Jest + @testing-library/svelte** | Testa lógica de Store e UI sem dependência de backend. |
| **Deploy estático** | **Netlify / Vercel** | Deploy automático a partir do repositório, cache CDN garantem <200 ms entre usuários globais.


## Exibição e Navegação
Cada elemental será exibido em tela própria. O cabeçalho apresenta nome, raridade e variação. Abaixo vai a foto destacada do elemental e, no rodapé, há dois botões de navegação (anterior/ próximo) com um toggle central para salvar ou remover da coleção local.