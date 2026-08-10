/**
 * CONTRATO: Adaptador de persistência (IndexedDB via idb-keyval)
 * Feature: 001-diario-colecao-elementais
 * Fontes: FDD-01 §5/§6, DIAGRAMS-01 (Contratos Públicos), data-model.md §6
 *
 * Implementação prevista: src/lib/persistence/adapter.ts (interface),
 * src/lib/persistence/idb-adapter.ts (implementação), src/lib/persistence/errors.ts.
 *
 * Propósito: isolar o IndexedDB do restante da aplicação, permitindo
 * simulação em testes (fake-indexeddb injeta o global indexedDB; testes
 * unitários podem injetar um stub da interface diretamente na Store).
 *
 * Semântica geral:
 * - Persiste SOMENTE IDs de elementais (constituição VII): registro único
 *   versionado sob a chave "collection" ({ version: 1, ids: string[] }).
 * - Timeout de 2 s por operação; excedido ⇒ tratado como falha de leitura/escrita.
 * - Erros tipados: NENHUM erro de storage fica silencioso ou vaza como
 *   exceção genérica para a camada de estado (constituição V).
 */

/* --------------------------------- registro -------------------------------- */

/** Chave única do registro no store chave-valor do idb-keyval. */
export const COLLECTION_KEY = 'collection';

/** Versão corrente do formato do registro. Leituras de outras versões são migradas ou descartadas sem erro. */
export const COLLECTION_RECORD_VERSION = 1;

/** Timeout por operação de storage, em milissegundos. */
export const STORAGE_OPERATION_TIMEOUT_MS = 2000;

/** Registro persistido: apenas a lista de IDs colecionados. Payload < 4 KB (≤ 117 IDs). */
export interface CollectionRecord {
  readonly version: number;
  readonly ids: string[];
}

/* ---------------------------------- erros ---------------------------------- */

/** Base dos erros tipados do adaptador. `code` é estável e destinado a logs/telemetria local. */
export abstract class StorageError extends Error {
  abstract readonly code: string;
}

/** Falha de gravação (cota excedida, bloqueio de escrita, timeout). A Store faz rollback ao recebê-lo. */
export class StorageWriteError extends StorageError {
  readonly code = 'STORAGE_WRITE_ERROR';
}

/** Falha de leitura persistente (após o retry único com backoff de 200 ms + jitter). */
export class StorageReadError extends StorageError {
  readonly code = 'STORAGE_READ_ERROR';
}

/** IndexedDB ausente ou bloqueado (ex.: modo privado restrito). Ativa o modo degradado. */
export class StorageUnavailableError extends StorageError {
  readonly code = 'STORAGE_UNAVAILABLE';
}

/* -------------------------------- interface -------------------------------- */

export interface PersistenceAdapter {
  /**
   * Verifica se o IndexedDB está acessível (probe rápido na inicialização).
   * Resolve false quando bloqueado/ausente — nunca rejeita.
   */
  isStorageAvailable(): Promise<boolean>;

  /**
   * Lê o registro da coleção e retorna os IDs.
   * - Registro ausente ⇒ resolve [] (NUNCA rejeita por ausência).
   * - Registro corrompido (não é { version: number, ids: string[] }) ⇒
   *   descarta o registro e resolve []; a próxima gravação válida sobrescreve.
   * - 1 retry automático com backoff exponencial (base 200 ms) + jitter em
   *   falha transitória; falha persistente ⇒ rejeita com StorageReadError.
   * - O descarte de IDs órfãos (ausentes no seed) é responsabilidade da
   *   Store, que resolve os IDs contra o catálogo — o adaptador não conhece
   *   o catálogo (dependência dados → estado, nunca o inverso).
   */
  loadCollection(): Promise<string[]>;

  /**
   * Grava o conjunto completo de IDs (nunca diffs), serializado como
   * CollectionRecord na versão corrente.
   * - Sucesso ⇒ resolve após a confirmação da escrita.
   * - Falha ⇒ rejeita com StorageWriteError (ou StorageUnavailableError se o
   *   storage se tornou inacessível); NADA é parcialmente gravado.
   */
  saveCollection(ids: string[]): Promise<void>;
}

/**
 * Instância padrão sobre idb-keyval. Em testes de integração, o global
 * `indexedDB` é provido por fake-indexeddb; em testes unitários da Store,
 * injeta-se um stub de PersistenceAdapter.
 */
export const persistenceAdapter: PersistenceAdapter;
