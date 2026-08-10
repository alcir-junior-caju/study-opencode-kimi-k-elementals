# Especificação de Feature: Diário de Coleção Elementais

**Feature Branch**: `001-diario-colecao-elementais`

**Criada em**: 2026-08-06

**Status**: Draft

**Input**: Descrição do usuário: "Aplicação web sem login que (1) lista o catálogo completo de elementais agrupado por raridade e tipo, (2) permite abrir a tela individual de cada elemental com navegação circular anterior/próximo, (3) marca e desmarca posse com um clique, persistindo apenas IDs localmente, e (4) exibe a coleção pessoal com modo de edição. Fontes: docs/app-idea.md, docs/PRD-diario-colecao-elementais.md (FR-001 a FR-006 e critérios de aceitação) e docs/elementals.md (117 itens, 25 tipos)."

## Clarifications

### Session 2026-08-06

Sessão executada sem perguntas ao usuário: todas as ambiguidades foram resolvidas com base em `docs/PRD-diario-colecao-elementais.md` e nos FDDs 01–04, sem conflitos entre os documentos.

- Q: Qual o comportamento quando o armazenamento local (IndexedDB) está indisponível ou bloqueado? → A: Modo degradado, detectado na inicialização: o catálogo permanece totalmente consultável, a marcação de posse fica desabilitada em todas as telas (sem indicação visual de posse na listagem) com aviso claro, e a página da coleção exibe aviso de que a coleção não pôde ser carregada — mensagem distinta do estado de coleção vazia, sem exibição de lista parcial (PRD FR-001/FR-003 e Riscos; FDD-01; FDD-02; FDD-03; FDD-04).
- Q: Como tratar IDs órfãos (salvos no storage, mas inexistentes no seed atual)? → A: Descarte silencioso na leitura/hidratação, resolvendo cada ID contra o catálogo atual; órfãos nunca aparecem em nenhuma tela e são limpos do registro na próxima gravação válida, sem erro visível (PRD FR-004; FDD-01; FDD-04).
- Q: Como comunicar a perda da coleção ao limpar os dados do navegador? → A: Aviso permanente na página inicial, presente em 100% dos carregamentos desde o primeiro acesso, complementado pela solicitação de persistência elevada de storage (`navigator.storage.persist()`) quando a API está disponível (PRD Escopo e Riscos; FDD-01; FDD-02).
- Q: Qual ordenação a navegação circular da tela individual segue? → A: Uma sequência única, determinística e estável, derivada da ordenação canônica do catálogo (raridade → tipo → variação, conforme a tabela-fonte), idêntica entre sessões para o mesmo seed, com wrap-around nos extremos: primeiro item + "anterior" = último; último item + "próximo" = primeiro (PRD FR-002; FDD-03; docs/elementals.md).
- Q: O que exibir quando a coleção está vazia? → A: Mensagem orientando o usuário a explorar o catálogo, exibida também após a remoção de todos os itens no modo de edição (PRD FR-004/FR-005; FDD-04).

## Cenários de Usuário e Testes *(obrigatório)*

### História de Usuário 1 - Explorar o catálogo completo (Prioridade: P1)

O jogador abre a aplicação no navegador (desktop ou mobile) e vê, na página inicial, todos os 117 elementais do catálogo, organizados em seções de raridade (Raro, Especial, Épico, Lendário, Mítico) e, dentro de cada seção, agrupados por tipo (Água, Terra, Fogo, Ar, Peixoto, Pato, Fantasma, Demônio, Rei, Aura, Atacante, Sonolento, Banana, Punk, Chefe, Seven, Lhama, Ceifador, Ponto Zero, Batman, John Wick, Vini JR, Pedicure Antacid, Amendoin Queimado, Pollo). Cada item mostra seu nome e uma imagem placeholder. Um aviso permanente na página inicial informa que a coleção é local e será perdida se os dados do navegador forem limpos.

**Por que esta prioridade**: o catálogo é a base de todo o produto — sem ele nenhum outro fluxo existe. Sozinha, esta história já entrega valor: o jogador consulta o universo completo de colecionáveis e descobre o que existe para coletar.

**Teste independente**: abrir a página inicial e conferir que os 117 itens aparecem agrupados por raridade e tipo, em conformidade com a tabela-fonte, cada um com nome e placeholder visíveis, e que o aviso de persistência local está presente. Entrega a consulta completa do catálogo, sem depender de nenhuma outra história.

**Cenários de aceitação**:

1. **Dado** que o usuário acessa a página inicial, **Quando** o catálogo termina de carregar, **Então** são exibidas as cinco seções de raridade e, dentro de cada uma, os tipos com seus respectivos itens, totalizando 117 itens e 25 tipos.
2. **Dado** um item qualquer da listagem, **Quando** a página é exibida, **Então** o item mostra nome e imagem placeholder.
3. **Dado** que o usuário possui itens previamente marcados como colecionados, **Quando** a página inicial carrega, **Então** esses itens exibem indicação visual de posse.
4. **Dado** que o usuário acessa a página inicial, **Quando** a página é exibida, **Então** um aviso permanente informa que a coleção é local e será apagada se os dados do navegador forem limpos.
5. **Dado** uma falha de integridade nos dados do catálogo, **Quando** a página inicial é acessada, **Então** uma mensagem de erro é exibida em vez de uma lista vazia silenciosa.

---

### História de Usuário 2 - Registrar posse com um clique (Prioridade: P2)

O jogador marca um elemental como colecionado com um único clique/toque no controle de posse, e desfaz a marcação da mesma forma. A seleção é gravada imediatamente no armazenamento local do navegador — apenas os IDs dos itens — e permanece intacta ao recarregar a página e ao fechar e reabrir o navegador dias depois.

**Por que esta prioridade**: registrar a posse é a razão de existir do produto — tirar o jogador da dependência de memória ou anotações manuais. Vem depois do catálogo porque a marcação opera sobre os itens listados, mas é independentemente testável sobre qualquer item visível.

**Teste independente**: marcar alguns itens na listagem, recarregar a página e confirmar que as marcações permanecem; fechar e reabrir o navegador e confirmar novamente. Entrega o registro persistente da coleção, sem depender da tela individual ou da página de coleção.

**Cenários de aceitação**:

1. **Dado** um elemental não colecionado, **Quando** o usuário ativa o controle de posse, **Então** o ID do item é gravado localmente e a indicação visual de posse é atualizada imediatamente.
2. **Dado** um elemental colecionado, **Quando** o usuário ativa o controle de posse novamente, **Então** o ID é removido do armazenamento local e a indicação visual reverte imediatamente.
3. **Dado** itens marcados como colecionados, **Quando** a página é recarregada ou o navegador é fechado e reaberto, **Então** 100% das marcações são preservadas.
4. **Dado** uma falha na gravação local (ex.: armazenamento bloqueado ou cota excedida), **Quando** o usuário tenta marcar um item, **Então** o estado visual não é alterado e uma mensagem acionável informa que a seleção não foi salva.
5. **Dado** que o armazenamento local do navegador está indisponível ou bloqueado (detectado na inicialização da aplicação), **Quando** a aplicação é aberta, **Então** o catálogo continua totalmente consultável, a marcação de posse fica indisponível em todas as telas (sem indicação visual de posse na listagem) e um aviso explica a limitação.

---

### História de Usuário 3 - Ver a tela individual com navegação circular (Prioridade: P3)

O jogador seleciona um elemental na listagem e abre uma tela dedicada: cabeçalho com nome, raridade e variação; imagem centralizada em destaque; rodapé com botões anterior e próximo e, no centro, o controle de posse. A navegação segue a ordenação do catálogo e é circular: no primeiro item, "anterior" leva ao último; no último, "próximo" leva ao primeiro.

**Por que esta prioridade**: a tela individual enriquece a exploração (foco na imagem e navegação sequencial imersiva) e concentra o controle de posse em contexto de descoberta, mas o registro da coleção já funciona sem ela (História 2).

**Teste independente**: a partir da listagem, abrir qualquer elemental, percorrer itens com anterior/próximo até cruzar os dois extremos do catálogo (wrap-around) e alternar a posse pelo controle central. Entrega a experiência de detalhe e navegação sequencial.

**Cenários de aceitação**:

1. **Dado** um elemental na listagem, **Quando** o usuário o seleciona, **Então** a tela individual abre com cabeçalho contendo nome, raridade e variação, e a imagem centralizada em destaque.
2. **Dado** a tela individual aberta, **Quando** o usuário aciona "próximo" ou "anterior", **Então** é exibido o elemental imediatamente seguinte ou anterior na ordenação do catálogo.
3. **Dado** o primeiro item do catálogo, **Quando** o usuário aciona "anterior", **Então** o último item do catálogo é exibido; **Dado** o último item, **Quando** aciona "próximo", **Então** o primeiro item é exibido.
4. **Dado** a tela individual aberta, **Quando** o usuário alterna o controle central de posse, **Então** o item é salvo ou removido da coleção com atualização visual imediata, consistente com o restante da aplicação.
5. **Dado** uma imagem de elemental não encontrada, **Quando** a tela individual é aberta, **Então** o placeholder correspondente ao tipo e à variação do item é exibido e a navegação não é afetada.
6. **Dado** um ID inexistente no catálogo atual (ex.: URL antiga de item removido do seed), **Quando** a tela individual é acessada, **Então** o usuário é redirecionado para a página inicial, sem tela em branco ou erro fatal.

---

### História de Usuário 4 - Ver a coleção pessoal (Prioridade: P4)

O jogador acessa a página da coleção pessoal e vê apenas os elementais que marcou como colecionados. Cada linha exibe miniatura, nome, raridade, variação e um check verde indicando posse. Abaixo da lista, o botão **Editar coleção** dá acesso ao gerenciamento dos itens.

**Por que esta prioridade**: consolida o resultado do registro (História 2) em uma visão de progresso pessoal — o "diário" propriamente dito. Depende das marcações já existirem, por isso vem depois.

**Teste independente**: marcar um conjunto de itens, abrir a página da coleção e verificar que somente eles aparecem, com todos os atributos visíveis e o check verde. Entrega a visão consolidada da coleção.

**Cenários de aceitação**:

1. **Dado** itens marcados como colecionados, **Quando** o usuário acessa a página da coleção, **Então** apenas esses itens são listados, cada um com miniatura, nome, raridade, variação e check verde de posse.
2. **Dado** uma coleção vazia, **Quando** o usuário acessa a página da coleção, **Então** uma mensagem orienta o usuário a explorar o catálogo.
3. **Dado** um ID salvo localmente que não existe mais no catálogo atual, **Quando** a coleção é lida do armazenamento local, **Então** esse ID é descartado silenciosamente e não aparece em nenhuma tela, sem erro visível.
4. **Dado** uma falha de leitura do armazenamento local, **Quando** a página da coleção é aberta, **Então** a coleção é tratada como vazia e um aviso informa que os dados não puderam ser carregados — mensagem distinta do estado de coleção vazia, sem exibição de lista parcial.
5. **Dado** itens marcados como colecionados, **Quando** a coleção é exibida, **Então** a lista segue a mesma ordenação determinística do catálogo, sem ordenação customizada pelo usuário.

---

### História de Usuário 5 - Editar a coleção pessoal (Prioridade: P5)

A partir da página da coleção, o jogador clica em **Editar coleção** e a lista entra em modo de edição, permitindo remover itens sem precisar navegar um a um pelo catálogo. Cada remoção surte efeito imediato; ao sair do modo de edição, a lista reflete o estado final.

**Por que esta prioridade**: é uma conveniência de manutenção da coleção (prioridade média no PRD) — a remoção individual já é possível pelos controles de posse, então esta história agiliza, mas não desbloqueia, o gerenciamento.

**Teste independente**: com itens na coleção, entrar em modo de edição, remover um item e confirmar a atualização imediata; remover todos e confirmar a mensagem de coleção vazia. Entrega o gerenciamento em lote da coleção.

**Cenários de aceitação**:

1. **Dado** a página da coleção com itens, **Quando** o usuário clica em **Editar coleção**, **Então** a lista entra em modo de edição com ação de remoção disponível por item.
2. **Dado** o modo de edição ativo, **Quando** o usuário remove um item, **Então** a remoção é persistida localmente e refletida na lista imediatamente.
3. **Dado** o modo de edição ativo, **Quando** o usuário remove todos os itens, **Então** a coleção fica vazia e a mensagem de coleção vazia é exibida.
4. **Dado** uma falha de gravação durante a remoção, **Quando** o usuário tenta remover um item, **Então** o item permanece na lista e a falha é informada ao usuário.
5. **Dado** o modo de edição ativo, **Quando** o usuário sai do modo de edição, **Então** a lista exibe o estado final da coleção.

---

### Casos de borda

- **Armazenamento local indisponível ou bloqueado** (ex.: modo privado restrito): detectado na inicialização, ativa o modo degradado — o catálogo permanece totalmente consultável; a marcação de posse fica indisponível com aviso claro ao usuário; a página da coleção informa que a coleção não pôde ser carregada, sem exibir lista parcial — sem falha silenciosa.
- **Falha de gravação** (cota excedida, bloqueio de escrita): o estado visual não muda e o usuário recebe mensagem acionável de que a seleção não foi salva.
- **Falha de leitura**: a coleção é tratada como vazia, com aviso de que os dados não puderam ser carregados, distinto da mensagem de coleção vazia.
- **Registro corrompido**: conteúdo persistido que não corresponde à lista de IDs esperada é descartado; a coleção inicia vazia e o registro é sobrescrito na próxima gravação válida, sem erro visível.
- **Limpeza dos dados do navegador**: todas as marcações são perdidas; o aviso permanente na página inicial comunica essa característica desde o primeiro acesso, e a aplicação solicita persistência elevada de storage quando a API correspondente está disponível.
- **IDs órfãos**: IDs salvos que deixam de existir no catálogo (após atualização do conjunto do jogo) são descartados na leitura/hidratação, nunca aparecem em nenhuma tela e são limpos do registro na próxima gravação válida, sem erro visível.
- **Coleção vazia**: a página da coleção exibe mensagem orientando a explorar o catálogo, inclusive após remover todos os itens em modo de edição.
- **Imagem ausente**: o placeholder correspondente ao tipo e à variação do elemental é exibido, sem quebrar a navegação ou a marcação.
- **Dados do catálogo inválidos**: a página inicial exibe mensagem de erro em vez de lista vazia silenciosa; dados inconsistentes não devem ser publicados.
- **Extremos da navegação circular**: primeiro item + "anterior" = último; último item + "próximo" = primeiro, seguindo a ordenação determinística e estável do catálogo.
- **ID inválido na tela individual**: ID inexistente no catálogo atual redireciona para a página inicial, sem tela em branco ou erro fatal.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **FR-001**: A página inicial DEVE exibir todos os 117 elementais do catálogo, agrupados por raridade (Raro, Especial, Épico, Lendário, Mítico) e, dentro de cada raridade, por tipo, refletindo integralmente a tabela-fonte de referência (25 tipos).
- **FR-002**: Cada item da listagem DEVE exibir nome e imagem placeholder; itens colecionados DEVEM exibir indicação visual de posse.
- **FR-003**: A página inicial DEVE exibir aviso permanente informando que a coleção é local e será perdida se os dados do navegador forem limpos.
- **FR-004**: Cada elemental DEVE ter tela individual própria com cabeçalho contendo nome, raridade e variação, imagem centralizada em destaque e rodapé com botões anterior/próximo e controle central de posse.
- **FR-005**: A navegação anterior/próximo DEVE seguir uma sequência única, determinística e estável, derivada da ordenação canônica do catálogo (raridade → tipo → variação, conforme a tabela-fonte) e idêntica entre sessões para o mesmo seed, e ser circular: no primeiro item, "anterior" leva ao último; no último, "próximo" leva ao primeiro.
- **FR-006**: O usuário DEVE poder adicionar e remover um elemental da coleção com um único clique/toque, com atualização visual imediata do estado de posse.
- **FR-007**: A aplicação DEVE persistir localmente, no dispositivo do usuário, apenas os IDs dos itens colecionados, mantendo 100% das seleções entre recarregamentos e entre sessões do navegador; nenhum dado do usuário pode sair do dispositivo.
- **FR-008**: Em falha de gravação local, o estado visual NÃO DEVE ser alterado e o usuário DEVE ser informado de forma acionável; em falha de leitura, a coleção é tratada como vazia com aviso de que os dados não puderam ser carregados, distinto da mensagem de coleção vazia; registro persistido inválido ou corrompido DEVE ser descartado na leitura, com a coleção iniciando vazia e sendo sobrescrito na próxima gravação válida.
- **FR-009**: Se o armazenamento local estiver indisponível ou bloqueado, a indisponibilidade DEVE ser detectada na inicialização, o catálogo DEVE permanecer consultável e a marcação de posse DEVE ficar indisponível em todas as telas (sem indicação visual de posse na listagem), com aviso ao usuário; a aplicação DEVE solicitar persistência elevada de storage quando a API correspondente estiver disponível.
- **FR-010**: A página da coleção pessoal DEVE listar apenas os itens marcados, cada um com miniatura, nome, raridade, variação e check verde de posse, na mesma ordenação determinística do catálogo; IDs salvos sem correspondente no catálogo atual DEVEM ser descartados na leitura, sem erro visível; coleção vazia DEVE exibir mensagem orientando a explorar o catálogo.
- **FR-011**: A página da coleção DEVE oferecer o botão **Editar coleção**, que ativa um modo de edição permitindo remover itens com efeito imediato; ao remover todos os itens, o estado de coleção vazia DEVE ser exibido.
- **FR-012**: Os dados do catálogo DEVEM ser carregados a partir de arquivo de dados estático versionado junto à aplicação, sem chamada de rede a servidor em tempo de execução; o catálogo é imutável em tempo de execução e dados inconsistentes DEVEM impedir a publicação da aplicação.
- **FR-013**: Nenhum fluxo PODE exigir login, conta ou qualquer etapa de autenticação.
- **FR-014**: Imagem de elemental não encontrada DEVE ser substituída pelo placeholder correspondente ao tipo e à variação do item, sem quebrar a navegação ou a marcação de posse.
- **FR-015**: A interface NÃO DEVE conter busca, filtragem avançada ou estatísticas da coleção.
- **FR-016**: Um ID inexistente no catálogo atual acessado na tela individual DEVE redirecionar o usuário para a página inicial, sem tela em branco ou erro fatal.

**Rastreabilidade com o PRD** (`docs/PRD-diario-colecao-elementais.md` — a numeração e a granularidade dos FRs diferem entre os dois documentos; esta tabela é o mapeamento oficial):

| FR do PRD | FRs desta spec |
|---|---|
| FR-001 Listagem do catálogo agrupada | FR-001, FR-002, FR-003, FR-009 (modo degradado na listagem), FR-012 (erro de integridade — HU1, cenário 5) |
| FR-002 Visualização individual do elemental | FR-004, FR-005, FR-014, FR-016 |
| FR-003 Adicionar/remover da coleção com persistência local | FR-006, FR-007, FR-008 (falha de gravação), FR-003 (aviso permanente) |
| FR-004 Visualização da coleção pessoal | FR-010, FR-008 (falha de leitura) |
| FR-005 Edição da coleção pessoal | FR-011, FR-008 (falha de escrita na remoção) |
| FR-006 Carga do catálogo a partir de seed estático | FR-012 |
| Transversais do PRD (sem login; sem busca/filtros/estatísticas) | FR-013, FR-015 |

### Entidades-chave

- **Elemental**: item colecionável do catálogo. Atributos: identificador único (ID), nome, tipo, raridade, variação e imagem (placeholder nesta entrega). Imutável em tempo de execução.
- **Tipo**: categoria do elemental (25 no total: Água, Terra, Fogo, Ar, Peixoto, Pato, Fantasma, Demônio, Rei, Aura, Atacante, Sonolento, Banana, Punk, Chefe, Seven, Lhama, Ceifador, Ponto Zero, Batman, John Wick, Vini JR, Pedicure Antacid, Amendoin Queimado, Pollo). Define a raridade base da variação Normal.
- **Variação**: versão de um tipo (Normal, Dourado, Gelatinoso, Galático, Metalizado, Cubo, Gema, Quack). Toda variação não-Normal possui raridade Especial.
- **Raridade**: classificação do item — Raro, Especial, Épico, Lendário ou Mítico — usada como primeiro nível de agrupamento da listagem.
- **Catálogo**: conjunto completo dos 117 elementais, ordenado de forma determinística e estável (raridade → tipo → variação, conforme a tabela-fonte), fonte única para listagem, tela individual e resolução da coleção; a mesma ordenação rege a navegação circular e a lista da coleção pessoal.
- **Coleção**: conjunto de IDs dos elementais marcados como possuídos pelo usuário, persistido localmente no dispositivo e resolvido contra o catálogo para exibição.

## Critérios de Sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: A página inicial exibe exatamente 117 itens, agrupados por raridade e por tipo, com 100% de correspondência com a tabela-fonte do catálogo (25 tipos).
- **SC-002**: 100% dos itens da listagem exibem nome e imagem placeholder; itens colecionados exibem indicação visual de posse.
- **SC-003**: A tela individual de qualquer elemental exibe cabeçalho com nome, raridade e variação, imagem centralizada e rodapé com anterior/próximo e controle central de posse; a navegação circular é verificada nos dois extremos do catálogo (primeiro ↔ último).
- **SC-004**: 100% das marcações de posse permanecem após recarregar a página e após fechar e reabrir o navegador; adicionar e remover um item exige exatamente um clique/toque por operação.
- **SC-005**: A página da coleção lista apenas os itens marcados — nem mais, nem menos — cada um com miniatura, nome, raridade, variação e check verde, na ordenação do catálogo e sem exibir IDs órfãos, e o botão **Editar coleção** permite remover itens com efeito imediato.
- **SC-006**: Todos os fluxos são completados com 0 etapas de autenticação ou criação de conta.
- **SC-007**: O catálogo é exibido em menos de 200 ms no carregamento com cache.
- **SC-008**: A página inicial exibe, em 100% dos acessos, o aviso de que a coleção será perdida se os dados do navegador forem limpos.
- **SC-009**: Nenhuma tela apresenta busca, filtragem avançada ou estatísticas — verificável por inspeção de todas as telas.
- **SC-010**: Nenhum erro de leitura ou gravação local ocorre de forma silenciosa: 100% dos cenários de falha simulados exibem feedback ao usuário e preservam o estado anterior.
- **SC-011**: O bundle JavaScript inicial é inferior a 150 KB gzip e o cold start em conexão 4G é inferior a 2 segundos, medidos no pipeline de CI e bloqueantes para publicação.
- **SC-012**: Com o armazenamento local indisponível, 100% dos carregamentos exibem o catálogo completo com a marcação de posse desabilitada e o aviso de modo degradado; a página da coleção informa que a coleção não pôde ser carregada, sem exibir lista parcial.

## Fora de escopo

- Autenticação de usuário e qualquer forma de conta (decisão de produto).
- Busca, filtragem avançada e estatísticas da coleção.
- Backend, banco de dados externo ou API própria.
- Sincronização da coleção entre dispositivos.
- Exportação ou importação da coleção.
- Remoção em lote ou seleção múltipla na coleção — a edição é item a item.
- Marcação de novos itens a partir da página da coleção — marcações ocorrem na listagem do catálogo e na tela individual.
- Imagens finais dos elementais — nesta entrega, todas as imagens são placeholders (por tipo e variação).

## Premissas

- Um usuário por navegador/dispositivo: a coleção é pessoal e local, sem necessidade de identidade.
- O usuário utiliza navegadores modernos, nas versões corrente e penúltima, com suporte ao armazenamento local do navegador.
- O primeiro carregamento exige conexão com a internet; não há requisito de uso offline nesta entrega.
- A tabela-fonte do catálogo (`docs/elementals.md`) é a fonte da verdade e está completa e consistente (117 itens, 25 tipos); atualizações do conjunto do jogo geram nova versão publicada da aplicação.
- Imagens placeholder são aceitáveis nesta entrega e serão substituídas pelos assets finais em iteração futura, sem mudança de comportamento.
- O usuário aceita que a coleção pode ser perdida com a limpeza dos dados do navegador, limitação comunicada pelo aviso permanente na página inicial.
