### FDD-02: Listagem do catálogo na página inicial

Versão: 1.0
Data: 2026-08-06
Responsável: Alcir Junior

---

### 1. Contexto e motivação técnica

A página inicial é a porta de entrada da aplicação e precisa renderizar o catálogo completo de 117 elementais, agrupado por raridade e, dentro dela, por tipo, com indicação de posse por item e o aviso permanente sobre persistência local. O problema técnico é entregar essa renderização com carregamento abaixo de 200 ms via cache de CDN e bundle inicial abaixo de 150 KB gzip, sem nenhuma chamada de rede a backend, usando o módulo de catálogo read-only embutido no build e a Store da coleção para o estado de posse.

Atores

- Usuário no navegador (desktop e móvel)
- CDN do provedor de hosting (entrega dos assets estáticos)
- Módulo de catálogo (repositório read-only sobre o JSON embutido)
- Store da coleção (estado de posse por ID)

Limites de escopo

- Catálogo imutável em tempo de execução, sem edição, busca full-text ou filtros dinâmicos além do agrupamento definido
- Nenhuma chamada de rede para obter o catálogo em runtime
- Indicação de posse limitada a um indicador visual por item, sem ações de edição nesta página

---

### 2. Objetivos técnicos

- Carregar e renderizar o catálogo completo em até 200 ms com cache de CDN aquecido.
- Manter o bundle JavaScript inicial abaixo de 150 KB gzip.
- Renderizar os 117 elementais agrupados nas 5 raridades e, dentro de cada raridade, agrupados por tipo, com ordem determinística.
- Invariante: a indicação de posse de cada item reflete a Store da coleção em tempo real, atualizando sem recarregar a página.
- Exibir o aviso permanente sobre persistência local em 100 por cento dos carregamentos da página inicial.
- Cold start da aplicação abaixo de 2 segundos em conexão 4G.

---

### 3. Escopo e exclusões

**Incluído**

- Normalização do catálogo embutido em estruturas de consulta por raridade, tipo e ID na inicialização
- Renderização da listagem agrupada por raridade e tipo com miniatura, nome e indicação de posse
- Aviso permanente sobre persistência local e limpeza dos dados do navegador
- Placeholders de imagem por tipo e variação até a entrega dos assets finais
- Lazy loading das imagens WebP
- Navegação para a tela individual ao selecionar um item

**Excluído**

- Busca textual, ordenação customizada e filtros por variação
- Paginação ou scroll infinito (o catálogo completo cabe em uma única renderização)
- Edição da coleção a partir da página inicial
- Personalização de layout pelo usuário
- Qualquer endpoint de backend para servir o catálogo

---

### 4. Fluxos detalhados e diagramas

**Fluxo principal**

1. O navegador requisita a página inicial e o CDN entrega HTML, CSS e JS estáticos, com cache de edge.
2. A aplicação inicializa e o módulo de catálogo carrega o JSON embutido no bundle, sem chamada de rede.
3. O módulo de catálogo normaliza os dados em estruturas de consulta por raridade, tipo e ID.
4. A Store da coleção é hidratada a partir da persistência local.
5. A página deriva o agrupamento por raridade e tipo e o estado de posse de cada item.
6. A interface renderiza os grupos em ordem determinística, com miniatura (lazy loading), nome e indicador de posse por item, além do aviso permanente sobre persistência local.
7. Ao selecionar um item, o usuário navega para a tela individual do elemental.

**Fluxos alternativos e exceções**

- IndexedDB indisponível: gatilho na etapa 4; resultado é a listagem renderizada sem indicação de posse, com aviso de modo degradado.
- Imagem de um item indisponível ou ainda não entregue: gatilho na etapa 6; resultado é o placeholder do tipo e variação correspondentes, sem impacto funcional.
- Item com estrutura inválida no seed: gatilho na etapa 3; resultado é bloqueio no pipeline de build, impedindo que o catálogo inválido chegue ao runtime.
- Carregamento acima de 2 segundos em conexão lenta: gatilho na etapa 1; resultado é exibição do estado de carregamento até a entrega do bundle.

---

### 5. Contratos públicos

**Página inicial (site estático)**

- Tipo: http_endpoint
- Assinatura ou rota: `GET /`
- Método: GET
- Limites: carregamento do catálogo abaixo de 200 ms com cache; disponibilidade de 99.9 por cento delegada ao provedor; bundle inicial abaixo de 150 KB gzip
- Versionamento: assets versionados por hash de build, com invalidação de cache a cada deploy
- Semântica de status e headers:
  - `200 OK`: página pré-renderizada entregue pelo CDN
  - `cache-control`: HTML com revalidação a cada deploy; assets com hash imutável e cache longo
  - `content-type: text/html; charset=utf-8`
  - `strict-transport-security`: HTTPS obrigatório, TLS terminado no CDN

**Exemplo de requisição**

```json
{
  "method": "GET",
  "path": "/",
  "headers": {
    "accept": "text/html",
    "accept-encoding": "br, gzip"
  }
}
```

**Exemplo de resposta**

```json
{
  "status": 200,
  "headers": {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=0, must-revalidate",
    "content-encoding": "br"
  },
  "body": "HTML pré-renderizado da página inicial com o catálogo agrupado"
}
```

**Módulo de catálogo**

- Tipo: sdk
- Assinatura ou rota: `getAll(): Elemental[]`, `getById(id: string): Elemental | undefined`, `groupedByRarityAndType(): CatalogGroup[]`
- Método: N/A
- Limites: consultas resolvidas em memória em menos de 5 ms; catálogo com exatamente 117 itens validados no build
- Versionamento: schema do seed validado no pipeline; mudanças de schema exigem nova versão do validador e do módulo
- Semântica de status e headers:
  - `getById` retorna `undefined` para ID inexistente, nunca lança exceção
  - `groupedByRarityAndType` retorna grupos na ordem fixa das raridades (Raro, Especial, Épico, Lendário, Mítico)

**Exemplo de requisição**

```json
{
  "operation": "getById",
  "id": "water_gold"
}
```

**Exemplo de resposta**

```json
{
  "id": "water_gold",
  "type": "water",
  "rarity": "Lendário",
  "variation": "Dourado",
  "imagePath": "assets/elementals/water/water_gold.webp"
}
```

---

### 6. Erros, exceções e fallback

**Matriz de erros**

| Condição                                   | Tratamento                                                     | Observações                                        |
| ------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------------- |
| Timeout de carregamento (acima de 2 s em 4G) | Exibe estado de carregamento até a entrega do bundle           | Meta de cold start monitorada em CI                |
| Input inválido (ID inexistente no catálogo) | `getById` retorna `undefined` e o item não é renderizado       | Nunca lança exceção em runtime                     |
| Falha de autorização                       | Não se aplica: conteúdo público e sem autenticação, por decisão de produto | Documentado no HLD e no ADR 001          |
| Falha da dependência de persistência       | Listagem renderiza sem indicação de posse, com aviso de modo degradado | Catálogo nunca depende do IndexedDB para renderizar |
| Imagem indisponível                        | Placeholder por tipo e variação                                | Sem impacto funcional                              |

**Estratégias de resiliência**

- Timeouts: 2 segundos como meta de cold start em 4G; operações de consulta ao catálogo são síncronas em memória.
- Retries: entrega de assets delegada ao CDN, com nova tentativa automática do navegador em falha de rede.
- Backoff: não se aplica, pois não há chamadas a backend.
- Circuit breaker: não se aplica; falhas de origem são absorvidas pelo cache de edge do CDN.

**Política de fallback**

- Se a persistência falhar, a página inicial continua plenamente utilizável para consulta ao catálogo, apenas sem indicação de posse e sem marcação, com aviso claro ao usuário.

**Invariantes**

- O catálogo renderizado é idêntico ao seed validado no build, sem mutação em runtime.
- A página inicial nunca fica em branco por falha do IndexedDB.
- A ordem dos grupos e dos itens é determinística entre carregamentos.

---

### 7. Observabilidade

**Métricas**

- `bundle.initial.gz_kb`, medida em CI a cada build, meta abaixo de 150 KB
- `catalog.load.duration_ms`, medida em CI, meta abaixo de 200 ms
- Métricas do provedor de hosting: requisições, banda, taxa de acerto de cache e códigos de status por deploy

**Logs**

- Formato: JSON estruturado no console do navegador, apenas nível error em produção
- Campos essenciais: `feature`, `action` (catalog_load, group_render, image_fallback), `outcome`, `latency_ms`
- Proteção de dados sensíveis: nenhum dado pessoal é registrado; logs não incluem conteúdo da coleção do usuário

**Tracing**

- Spans principais: não se aplica distributed tracing, pois não há chamadas entre serviços; o único recurso externo é o CDN
- Amostragem: 100 por cento dos erros de renderização registrados no console

**Dashboards e alertas**

- Painel do provedor de hosting com requisições, banda e taxa de acerto de cache
- Alerta de falha de build no pipeline quando o bundle ultrapassa 150 KB gzip ou o tempo de carregamento do catálogo ultrapassa 200 ms nas medições de CI

---

### 8. Dependências e compatibilidade

| Componente       | Versão mínima | Observações                                            |
| ---------------- | ------------- | ------------------------------------------------------ |
| Svelte           | 5.0           | Componentes como consumidores puros das Stores         |
| SvelteKit        | 2.0           | Pré-renderização estática e code splitting por rota    |
| Vite             | 5.0           | Build e empacotamento                                  |
| TypeScript       | 5.4           | Tipagem do catálogo e das estruturas de consulta       |
| Provedor de hosting | Netlify ou Vercel, plano atual | CDN global, TLS e invalidação de cache por deploy |

**Garantias de compatibilidade**

- Suporte às versões correntes e penúltima de Chrome, Firefox, Safari e Edge.
- O schema do seed só evolui de forma compatível; campos novos são opcionais até nova major version do validador.
- URLs das rotas permanecem estáveis entre deploys, preservando links compartilhados.

---

### 9. Critérios de aceite técnicos

- A página inicial renderiza os 117 elementais agrupados nas 5 raridades, com agrupamento por tipo dentro de cada raridade.
- Carregamento do catálogo abaixo de 200 ms com cache de CDN, medido em CI.
- Bundle JavaScript inicial abaixo de 150 KB gzip, medido em CI e bloqueando o deploy quando ultrapassado.
- A indicação de posse reflete a Store da coleção em tempo real, sem recarregar a página.
- O aviso permanente sobre persistência local é exibido em 100 por cento dos carregamentos.
- Com IndexedDB indisponível, a listagem renderiza completa, sem indicação de posse e com aviso de modo degradado.
- Itens sem imagem final exibem o placeholder correspondente ao tipo e variação.
- Nenhum erro não tratado aparece no console durante o carregamento e a navegação.

---

### 10. Riscos e mitigação

#### Assets de imagem não entregues a tempo

- **Probabilidade:** media
- **Impacto:** experiência visual degradada, sem impacto funcional.
- **Mitigação:**
  - Placeholders consistentes por tipo e variação em todos os fluxos.
  - Caminhos de imagem padronizados (`assets/elementals/<tipo>/`) permitindo substituição direta dos arquivos, sem mudança de código.
- **Plano de contingência:** lançar com placeholders e adicionar os assets reais em iteração posterior, por meio de novo deploy estático.

#### Bundle inicial ultrapassa a meta de 150 KB gzip

- **Probabilidade:** media
- **Impacto:** degradação do cold start em dispositivos móveis e conexões lentas.
- **Mitigação:**
  - Medição do bundle em CI a cada build, com alerta e bloqueio ao ultrapassar a meta.
  - Code splitting por rota e dependências mínimas no carregamento inicial.
- **Plano de contingência:** auditoria de dependências, adiamento de código não essencial para rotas secundárias e novo deploy.

#### Seed do catálogo inválido ou desatualizado

- **Probabilidade:** media
- **Impacto:** catálogo inconsistente publicado ou novos elementais ausentes.
- **Mitigação:**
  - Validação de schema do JSON no pipeline de build, com falha bloqueando o deploy.
  - Tabela de referência em `docs/elementals.md` como fonte da verdade para revisão a cada importação.
- **Plano de contingência:** correção do seed seguida de novo deploy, que chega aos usuários no próximo carregamento.
