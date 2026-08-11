# Data Model: Diário de Coleção Elementais

**Fase 1 do plano** | Data: 2026-08-06 | Feature: `001-diario-colecao-elementais`

Modelo de dados derivado das "Entidades-chave" da [spec.md](./spec.md), do HLD-01 §Modelo de dados, dos contratos dos FDD-01 a FDD-04 e do seed real `src/data/catalog.json` (inspecionado: 117 itens, 25 tipos, 0 IDs duplicados, 0 imagens ausentes). Fontes tabulares: `docs/elementals.md`.

---

## 1. Entidade: Elemental

Item colecionável do catálogo. Imutável em tempo de execução.

| Campo | Tipo | Descrição | Regras |
|---|---|---|---|
| `id` | `string` | Identificador único | Padrão `<typeSlug>_<variationSlug>` (ex.: `water_basic`, `water_gold`); único em todo o catálogo; `typeSlug` ∈ 25 slugs de tipo; `variationSlug` ∈ {`basic`, `gold`, `candy`, `galaxy`, `holofoil`, `cube`, `gem`, `quack`} |
| `type` | `string` (enum) | Nome de exibição do tipo, pt-BR | Um dos 25 valores de `ElementalType` (§4.2) |
| `rarity` | `string` (enum) | Classificação do item | Um dos 5 valores de `Rarity` (§4.1); **regra cruzada**: `variation ≠ "Normal"` ⇒ `rarity = "Especial"` (nota de `docs/elementals.md`); `variation = "Normal"` ⇒ raridade base do tipo |
| `variation` | `string` (enum) | Versão do tipo | Um dos 8 valores de `Variation` (§4.3) |
| `imagePath` | `string` | Caminho do placeholder WebP | Padrão `assets/elementals/<pasta>/<arquivo>.webp`; o arquivo DEVE existir em disco (verificado no pipeline); servido a partir de `static/` com lazy loading |

**Exemplo (registro real do seed)**:

```json
{
  "id": "water_gold",
  "type": "Água",
  "rarity": "Especial",
  "variation": "Dourado",
  "imagePath": "assets/elementals/water/water_gold.webp"
}
```

**Observação sobre pastas de imagem**: o nome da pasta nem sempre é idêntico ao `typeSlug` do ID (ex.: ID `grimreaper_basic` → pasta `grim/`; ID `theburntpeanut_basic` → pasta `burntpeanut/`). Por isso o validador verifica a **existência do arquivo em `imagePath`**, e não a derivação do caminho a partir do ID.

## 2. Entidade: Catálogo

Conjunto canônico, completo e imutável dos 117 elementais. Fonte de verdade: `src/data/catalog.json` (read-only em runtime, validado no pipeline). Não é entidade persistida — é embutido no bundle.

**Formato do seed**:

```json
{ "elementals": [ /* 117 registros de Elemental */ ] }
```

**Derivações em memória (na carga do módulo, uma única vez)**:

| Estrutura | Conteúdo | Custo |
|---|---|---|
| `byId: Map<string, Elemental>` | resolução de ID → item | O(1) por consulta |
| `sequence: Elemental[]` | os 117 itens na **ordenação canônica** (§3) | base de `getNeighbors` e da lista da coleção |
| `positionById: Map<string, number>` | posição (0–116) de cada ID na sequência | O(1) por consulta |
| grupos raridade → tipo | projeção de `sequence` para a listagem | ver `CatalogGroup` (§5.1) |

**Invariantes**:
- O catálogo contém exatamente 117 itens e 25 tipos (SC-001).
- Nenhuma mutação em runtime: o módulo expõe apenas consultas (constituição VI).
- A checagem de integridade mínima em runtime (§7) protege contra artefato corrompido; a validação profunda ocorre no pipeline (§7).

## 3. Ordenação canônica (chave estável)

A sequência única e determinística do catálogo — que rege a navegação circular (FR-005), o agrupamento da listagem (FR-001) e a ordenação da coleção (FR-010) — é derivada de ranks, **nunca** da ordem de inserção do JSON (R3 do research.md; o seed real não está na ordem canônica):

```text
compare(a, b) = (RARITY_RANK[a.rarity], TYPE_RANK[a.type], VARIATION_RANK[a.variation])
```

1. **Raridade** — ordem fixa de exibição: `Raro(0) → Especial(1) → Épico(2) → Lendário(3) → Mítico(4)` (FDD-02 §5).
2. **Tipo** — ordem das linhas da tabela-fonte `docs/elementals.md`: `Água, Terra, Fogo, Ar, Peixoto, Pato, Fantasma, Demônio, Rei, Aura, Atacante, Sonolento, Banana, Punk, Chefe, Seven, Lhama, Ceifador, Ponto Zero, Batman, John Wick, Vini JR, Pedicure Antacid, Amendoin Queimado, Pollo` (ranks 0–24).
3. **Variação** — ordem canônica da tabela-fonte: `Normal(0), Dourado(1), Gelatinoso(2), Galático(3), Metalizado(4), Cubo(5), Gema(6), Quack(7)`.

A sequência resultante é idêntica entre sessões para o mesmo seed e só muda em novo deploy (FDD-03 §8). Um teste unitário fixa a sequência esperada para o seed vigente.

## 4. Enums

### 4.1 `Rarity` (5 valores)

```text
"Raro" | "Especial" | "Épico" | "Lendário" | "Mítico"
```

Distribuição real no seed: Raro 5, Especial 94, Épico 6, Lendário 6, Mítico 6 (total 117).

### 4.2 `ElementalType` (25 valores, com slug e raridade base)

| Slug | Exibição | Raridade base (Normal) |
|---|---|---|
| `water` | Água | Raro |
| `earth` | Terra | Raro |
| `fire` | Fogo | Raro |
| `air` | Ar | Raro |
| `fishy` | Peixoto | Raro |
| `duck` | Pato | Épico |
| `ghost` | Fantasma | Épico |
| `demon` | Demônio | Épico |
| `king` | Rei | Épico |
| `drifter` | Aura | Épico |
| `soccer` | Atacante | Épico |
| `sleepy` | Sonolento | Lendário |
| `peely` | Banana | Lendário |
| `punk` | Punk | Lendário |
| `boss` | Chefe | Lendário |
| `seven` | Seven | Lendário |
| `llama` | Lhama | Lendário |
| `grimreaper` | Ceifador | Mítico |
| `zeropoint` | Ponto Zero | Mítico |
| `batman` | Batman | Mítico |
| `fillergrunt` | John Wick | Mítico |
| `vinijr` | Vini JR | Mítico |
| `pedicureantacid` | Pedicure Antacid | Mítico |
| `theburntpeanut` | Amendoin Queimado | Especial |
| `pollo` | Pollo | Especial |

### 4.3 `Variation` (8 valores)

| Slug (sufixo do ID) | Exibição | Raridade resultante |
|---|---|---|
| `basic` | Normal | raridade base do tipo |
| `gold` | Dourado | Especial |
| `candy` | Gelatinoso | Especial |
| `galaxy` | Galático | Especial |
| `holofoil` | Metalizado | Especial |
| `cube` | Cubo | Especial |
| `gem` | Gema | Especial |
| `quack` | Quack | Especial |

## 5. Projeções de leitura (não persistidas)

### 5.1 `CatalogGroup` — agrupamento da página inicial

Contrato do FDD-02 §5: lista plana de grupos `(rarity, type)` na ordenação canônica; a página deriva os cabeçalhos de seção por raridade a partir de grupos consecutivos.

```text
CatalogGroup = { rarity: Rarity; type: ElementalType; items: Elemental[] }
```

Garantias: grupos ordenados por `(RARITY_RANK, TYPE_RANK)`; `items` ordenados por `VARIATION_RANK`; a união dos `items` de todos os grupos tem exatamente 117 elementos.

### 5.2 `Neighbors` — navegação circular

Contrato do FDD-03 §5:

```text
Neighbors = { previousId: string; nextId: string; position: number; total: number }
```

Com `position` ∈ [0, 116] e `total = 117`: `previousId = sequence[(position - 1 + total) % total].id`, `nextId = sequence[(position + 1) % total].id` — wrap-around garantido nos dois extremos.

## 6. Entidade: Coleção (conjunto de IDs)

A coleção do usuário é **apenas um conjunto de IDs de elementais** — nenhum outro dado é persistido (constituição VII).

**Em memória (Store)**: `Set<string>` de IDs válidos e confirmados.

**Persistida (IndexedDB via `idb-keyval`)**: registro único versionado sob a chave `collection`:

```text
CollectionRecord = { version: 1; ids: string[] }
```

| Propriedade | Valor |
|---|---|
| Chave | `collection` (única) |
| Versão inicial | `1`; leituras de versões futuras/desconhecidas são migradas ou descartadas sem erro |
| Cardinalidade | 0 a 117 IDs |
| Payload máximo | < 4 KB |

**Regras de leitura (hidratação)**:
1. Registro ausente ⇒ coleção vazia (não é erro).
2. Registro corrompido (não é objeto com `version` numérico + `ids` de strings) ⇒ descarte silencioso, coleção vazia, sobrescrito na próxima gravação válida (spec, casos de borda).
3. **IDs órfãos** (ausentes no seed atual) ⇒ descartados individualmente na resolução contra o catálogo, sem erro visível, limpos do registro na próxima gravação válida (FR-010).
4. Falha de leitura ⇒ coleção tratada como vazia + aviso de que os dados não puderam ser carregados (mensagem distinta de coleção vazia, FR-008).

**Regras de escrita**:
- Toda mutação grava o `CollectionRecord` completo (o conjunto inteiro serializado), nunca diffs.
- Escrita confirmada ⇒ estado visual mantido; falha ⇒ rollback do conjunto em memória + mensagem acionável (invariante FDD-01 §6).
- Uma gravação por vez (serialização de toggles concorrentes).

## 7. Regras de validação

**Pipeline (`npm run validate:seed`, zod — bloqueia o deploy, FDD-05 §5)**:
- estrutura de cada item (5 campos obrigatórios, strings não vazias);
- unicidade de `id` (117 únicos);
- `rarity` ∈ `Rarity`, `variation` ∈ `Variation`, `type` ∈ `ElementalType`;
- `id` no padrão `<typeSlug>_<variationSlug>` e consistente com `type`/`variation`;
- regra cruzada variação × raridade (§1);
- cardinalidade: exatamente 117 itens e 25 tipos distintos;
- existência de cada `imagePath` em disco;
- saída: exit 0 (válido) ou exit 1 com relatório JSON item a item (stderr + artefato de build).

**Runtime (checagem de integridade mínima na carga do módulo — R5 do research.md)**:
- array presente com 117 itens; campos obrigatórios string não vazios; IDs únicos;
- falha ⇒ `CatalogIntegrityError` ⇒ página inicial exibe mensagem de erro em vez de lista vazia silenciosa (spec HU1, cenário 5).

**Store da coleção**:
- `toggle(id)` com `id` inexistente no catálogo ⇒ rejeita sem gravar (FDD-01 §6).

## 8. Máquinas de estado

### 8.1 Store da coleção (FDD-01 §4 / DIAGRAMS-01)

```text
hydrating ──storage disponível + leitura ok──▶ active
hydrating ──storage indisponível | falha de leitura persistente──▶ degraded
active ──toggle──▶ saving ──escrita confirmada──▶ active
                    saving ──falha (rollback + aviso)──▶ active
degraded: catálogo consultável, marcação desabilitada, aviso visível;
          persiste até o próximo carregamento da aplicação
```

### 8.2 Página da coleção (FDD-04 §4 / DIAGRAMS-04)

```text
loading ──coleção carregada com itens──▶ reading
loading ──coleção vazia──▶ empty
loading ──storage indisponível──▶ degraded (sem lista parcial)
reading ──"Editar coleção"──▶ editing ──encerrar──▶ reading
editing ──remoção confirmada──▶ editing (lista reativa)
editing ──falha de escrita──▶ editing (item mantido + aviso)
editing ──último item removido──▶ empty
empty ──novos itens marcados em outras telas──▶ reading
```

`empty` e `degraded` têm mensagens obrigatoriamente distintas (FR-008): `empty` orienta a explorar o catálogo; `degraded` informa que a coleção não pôde ser carregada.

## 9. Relacionamentos

```text
Catálogo 1───117 Elemental                 (composição; imutável)
Coleção  *───*  Elemental                  (referência por id; órfãos descartados na leitura)
Catálogo 1───*  CatalogGroup               (projeção: raridade → tipo → itens)
Elemental 1───1 Neighbors                  (derivação por posição na sequência canônica)
Coleção  1───1 CollectionRecord            (serialização persistida na chave `collection`)
```

**Fontes de verdade**:
- Catálogo → `src/data/catalog.json` (repositório; consistente com `docs/elementals.md`; validado no build).
- Coleção → IndexedDB do navegador de cada usuário (único local de persistência; sem sincronização; sujeita à limpeza dos dados do navegador — comunicada pelo aviso permanente da home).
