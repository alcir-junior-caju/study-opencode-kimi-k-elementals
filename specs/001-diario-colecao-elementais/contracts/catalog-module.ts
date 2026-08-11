/**
 * CONTRATO: Módulo de catálogo (repositório read-only)
 * Feature: 001-diario-colecao-elementais
 * Fontes: FDD-02 §5, FDD-03 §5, DIAGRAMS-02 (Contrato do Módulo de Catálogo), data-model.md §1–§5
 *
 * Implementação prevista: src/lib/catalog/index.ts
 * Consumidores: rotas SvelteKit e Stores. O módulo NUNCA expõe mutação:
 * o seed src/data/catalog.json é imutável em runtime (constituição VI).
 *
 * Semântica geral:
 * - Carga: o JSON é importado estaticamente (embutido no bundle, sem fetch) e
 *   normalizado uma única vez (memoização lazy na primeira consulta).
 * - Checagem de integridade mínima na carga (117 itens, campos obrigatórios,
 *   IDs únicos); falha ⇒ lança CatalogIntegrityError (spec HU1, cenário 5).
 * - Todas as consultas são síncronas em memória (< 5 ms) e NUNCA lançam
 *   exceção por ID/parâmetro inexistente — retornam undefined/[].
 * - A ordenação canônica (rarityRank → typeRank → variationRank) é derivada
 *   dos ranks abaixo, NUNCA da ordem de inserção do JSON (research.md R3).
 */

/* ---------------------------------- tipos --------------------------------- */

/** Raridade do item. Ordem fixa de exibição/agrupamento (FDD-02 §5). */
export type Rarity = 'Raro' | 'Especial' | 'Épico' | 'Lendário' | 'Mítico';

/** Os 25 tipos (nomes de exibição pt-BR), conforme docs/elementals.md. */
export type ElementalType =
  | 'Água' | 'Terra' | 'Fogo' | 'Ar' | 'Peixoto'
  | 'Pato' | 'Fantasma' | 'Demônio' | 'Rei' | 'Aura' | 'Atacante'
  | 'Sonolento' | 'Banana' | 'Punk' | 'Chefe' | 'Seven' | 'Lhama'
  | 'Ceifador' | 'Ponto Zero' | 'Batman' | 'John Wick' | 'Vini JR'
  | 'Pedicure Antacid' | 'Amendoin Queimado' | 'Pollo';

/** Variação do tipo. Toda variação não-Normal possui raridade "Especial". */
export type Variation =
  | 'Normal' | 'Dourado' | 'Gelatinoso' | 'Galático'
  | 'Metalizado' | 'Cubo' | 'Gema' | 'Quack';

/** Item colecionável do catálogo. Imutável em runtime. */
export interface Elemental {
  /** Único; padrão `<typeSlug>_<variationSlug>` (ex.: "water_gold"). */
  readonly id: string;
  readonly type: ElementalType;
  readonly rarity: Rarity;
  readonly variation: Variation;
  /** Caminho WebP servido de static/ (ex.: "assets/elementals/water/water_gold.webp"). */
  readonly imagePath: string;
}

/**
 * Grupo plano (raridade, tipo) para a listagem da página inicial.
 * Garantias: grupos ordenados por (RARITY_RANK, TYPE_RANK); `items`
 * ordenados por VARIATION_RANK; a união dos itens totaliza exatamente 117.
 */
export interface CatalogGroup {
  readonly rarity: Rarity;
  readonly type: ElementalType;
  readonly items: readonly Elemental[];
}

/** Vizinhança circular na sequência canônica (wrap-around nos extremos). */
export interface Neighbors {
  readonly previousId: string;
  readonly nextId: string;
  /** Posição do item na sequência canônica, 0-indexada. */
  readonly position: number;
  /** Total de itens da sequência (117 para o seed vigente). */
  readonly total: number;
}

/** Erro lançado UMA única vez na carga, se o seed embutido falhar na checagem de integridade mínima. */
export class CatalogIntegrityError extends Error {
  readonly code = 'CATALOG_INTEGRITY_ERROR';
}

/* ------------------------- ordenação canônica ----------------------------- */

/** rank 0..4 — ordem fixa: Raro → Especial → Épico → Lendário → Mítico. */
export const RARITY_ORDER: readonly Rarity[];

/** rank 0..24 — ordem das linhas da tabela-fonte docs/elementals.md. */
export const TYPE_ORDER: readonly ElementalType[];

/** rank 0..7 — Normal, Dourado, Gelatinoso, Galático, Metalizado, Cubo, Gema, Quack. */
export const VARIATION_ORDER: readonly Variation[];

/* ------------------------------ interface --------------------------------- */

export interface CatalogModule {
  /**
   * Todos os 117 itens na sequência canônica (raridade → tipo → variação).
   * A lista retornada é imutável; mesma instância entre chamadas (memoizada).
   */
  getAll(): readonly Elemental[];

  /**
   * Resolve um ID. Retorna undefined para ID inexistente — nunca lança.
   * Base do redirecionamento suave da tela individual (FR-016).
   */
  getById(id: string): Elemental | undefined;

  /**
   * Itens de uma raridade, na ordenação canônica (tipo → variação).
   * Lista vazia para valor válido sem itens (não ocorre no seed vigente).
   */
  getByRarity(rarity: Rarity): readonly Elemental[];

  /**
   * Itens de um tipo (todas as variações existentes), na ordem de VARIATION_ORDER.
   * Lista vazia para tipo sem itens (não ocorre no seed vigente).
   */
  getByType(type: ElementalType): readonly Elemental[];

  /**
   * Grupos (raridade → tipo) para a página inicial, na ordenação canônica.
   * A página deriva os cabeçalhos de seção de raridade de grupos consecutivos.
   */
  groupedByRarityAndType(): readonly CatalogGroup[];

  /**
   * Vizinhos circulares do ID na sequência canônica.
   * - ID válido ⇒ sempre retorna vizinhos válidos, com wrap-around:
   *   primeiro item ⇒ previousId = último; último item ⇒ nextId = primeiro.
   * - ID inválido ⇒ retorna undefined; o chamador redireciona para a home.
   * - Resolução em memória < 1 ms (posição pré-computada por ID).
   */
  getNeighbors(id: string): Neighbors | undefined;
}

/** Instância única do módulo (singleton), carregada do JSON embutido no build. */
export const catalog: CatalogModule;
