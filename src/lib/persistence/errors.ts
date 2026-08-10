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
