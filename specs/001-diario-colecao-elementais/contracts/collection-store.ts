/**
 * CONTRATO: Store da coleção (Svelte Stores)
 * Feature: 001-diario-colecao-elementais
 * Fontes: FDD-01 §5/§6, FDD-04 §5, DIAGRAMS-01 (Ciclo de Estados),
 *         DIAGRAMS-04 (Contratos Públicos), data-model.md §6/§8
 *
 * Implementação prevista: src/lib/stores/collection.ts (Store base) e
 * src/lib/stores/collected-items.ts (Store derivada da página da coleção).
 *
 * Semântica geral:
 * - Componentes são consumidores PUROS: leem via $store e disparam toggle/
 *   remove; nunca acessam o adaptador ou o catálogo diretamente.
 * - INVARIANTE CENTRAL: o estado visual de posse nunca diverge do conteúdo
 *   confirmado no IndexedDB — toggle/remove só resolvem após gravação
 *   confirmada; em falha, o conjunto em memória sofre rollback e a promise
 *   rejeita para a UI exibir a mensagem (constituição V).
 * - Uma gravação por vez: toggles concorrentes são serializados numa fila
 *   interna (determinístico e testável).
 * - A Store depende do PersistenceAdapter e do CatalogModule; componentes
 *   dependem apenas da Store.
 */

import type { Readable, Writable } from 'svelte/store';
import type { Elemental } from './catalog-module';

/* ------------------------------- Store base -------------------------------- */

/** Estado operacional da Store (máquina de estados do data-model.md §8.1). */
export type CollectionStatus =
  /** Leitura inicial em andamento (verificação de disponibilidade + loadCollection). */
  | 'hydrating'
  /** Storage disponível e coleção carregada; marcação habilitada. */
  | 'active'
  /** Storage indisponível ou falha de leitura persistente: catálogo consultável,
   *  marcação DESABILITADA em todas as telas, aviso de modo degradado visível. */
  | 'degraded';

export interface CollectionStore {
  /**
   * Conjunto reativo dos IDs colecionados (apenas IDs válidos e confirmados).
   * Em 'degraded', permanece vazio — a listagem não exibe indicação de posse.
   */
  readonly collection: Readable<ReadonlySet<string>>;

  /**
   * Estado operacional; habilita/desabilita marcação e exibe o aviso de
   * modo degradado. Transições: hydrating → active | degraded;
   * degraded persiste até o próximo carregamento da aplicação.
   */
  readonly status: Readable<CollectionStatus>;

  /**
   * Derivação reativa de posse por ID (para cards e tela individual).
   * Emite false em modo degradado.
   */
  has(id: string): Readable<boolean>;

  /**
   * Hidratação na inicialização (chamada uma única vez pelo +layout.svelte):
   * 1. isStorageAvailable() ⇒ false → status 'degraded' e resolve.
   * 2. loadCollection() ⇒ IDs resolvidos contra o catálogo; órfãos
   *    descartados silenciosamente (limpos do registro na próxima gravação).
   * 3. Solicita navigator.storage.persist() quando a API existe (não bloqueia).
   * 4. StorageReadError ⇒ status 'degraded' (coleção vazia + aviso de que os
   *    dados não puderam ser carregados — distinto do estado de coleção vazia).
   * Sempre resolve; nunca rejeita — a UI inicializa em qualquer cenário.
   */
  hydrate(): Promise<void>;

  /**
   * Alterna a posse de um ID (marcar/desmarcar com um clique).
   * - ID inexistente no catálogo ⇒ rejeita SEM gravar.
   * - Status 'degraded' ⇒ rejeita imediatamente (UI mantém controles desabilitados).
   * - Fluxo: atualiza o conjunto em memória → grava via adaptador (serializado,
   *   uma operação por vez) → sucesso: resolve (estado confirmado);
   *   StorageWriteError/timeout: reverte o conjunto (rollback) e rejeita —
   *   o estado visual permanece inalterado e a UI exibe mensagem acionável.
   * - Rejeita em até 2 s (timeout da operação de storage subjacente).
   */
  toggle(id: string): Promise<void>;
}

/** Instância singleton consumida pelas rotas/componentes. */
export const collectionStore: CollectionStore;

/* ---------------------- Store derivada (página da coleção) ------------------ */

export interface CollectedItemsStore {
  /**
   * Lista reativa dos elementais colecionados, RESOLVIDA contra o catálogo:
   * - apenas IDs presentes no seed atual (órfãos nunca aparecem);
   * - ordenada pela sequência canônica do catálogo (sem ordenação customizada);
   * - emite a cada mudança confirmada do conjunto (remoção otimista proibida:
   *   o item só sai da lista após a gravação confirmada);
   * - resolução < 10 ms para 117 itens; lista reage em ≤ 50 ms sem reload.
   */
  readonly collectedItems: Readable<readonly Elemental[]>;

  /**
   * Modo de edição da página da coleção (botão "Editar coleção").
   * Estado de UI puro — não é persistido.
   */
  readonly isEditing: Writable<boolean>;

  /**
   * Remove um item da coleção em modo de edição (delega a toggle da Store base).
   * - Sucesso ⇒ resolve após a gravação confirmada; a lista reage removendo o item.
   * - Falha de escrita ⇒ rejeita e o item PERMANECE na lista; a UI exibe
   *   mensagem explícita (sem falha silenciosa).
   * - Remover o último item leva a página ao estado vazio com orientação de
   *   retorno ao catálogo.
   */
  remove(id: string): Promise<void>;
}

/** Instância singleton derivada de collectionStore × módulo de catálogo. */
export const collectedItemsStore: CollectedItemsStore;
