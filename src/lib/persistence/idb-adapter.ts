import { get, set, del } from 'idb-keyval';
import type { PersistenceAdapter, CollectionRecord } from './adapter';
import {
	StorageError,
	StorageReadError,
	StorageWriteError,
	StorageUnavailableError
} from './errors';
import {
	COLLECTION_KEY,
	COLLECTION_RECORD_VERSION,
	STORAGE_OPERATION_TIMEOUT_MS
} from './adapter';

const BACKOFF_BASE_MS = 200;
const JITTER_MAX_MS = 100;

export interface KeyvalLike {
	get<T = unknown>(key: IDBValidKey): Promise<T | undefined>;
	set(key: IDBValidKey, value: unknown): Promise<void>;
	del(key: IDBValidKey): Promise<void>;
}

export interface IdbAdapterOptions {
	/** Função de probe para isStorageAvailable; padrão testa set/get/del real. */
	probe?(): Promise<boolean>;
	/** Implementação chave-valor injetável para testes. */
	keyval?: KeyvalLike;
	/** Timeout por operação (para testes). */
	timeoutMs?: number;
}

function jitter(): number {
	return Math.floor(Math.random() * JITTER_MAX_MS);
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCollectionRecord(value: unknown): value is CollectionRecord {
	if (typeof value !== 'object' || value === null) return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.version === 'number' &&
		Array.isArray(record.ids) &&
		record.ids.every((id) => typeof id === 'string')
	);
}

export function createIdbAdapter(options?: IdbAdapterOptions): PersistenceAdapter {
	const keyval = options?.keyval ?? { get, set, del };
	const timeoutMs = options?.timeoutMs ?? STORAGE_OPERATION_TIMEOUT_MS;

	async function probe(): Promise<boolean> {
		if (options?.probe) return options.probe();
		if (typeof indexedDB === 'undefined') return false;

		const probeKey = '__collection_probe__';
		try {
			await keyval.set(probeKey, 'ok');
			await keyval.get(probeKey);
			await keyval.del(probeKey);
			return true;
		} catch {
			return false;
		}
	}

	function withTimeout<T>(promise: Promise<T>, errorFactory: () => StorageError): Promise<T> {
		return Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				setTimeout(() => {
					reject(errorFactory());
				}, timeoutMs);
			})
		]);
	}

	async function loadWithRetry(): Promise<unknown> {
		try {
			return await keyval.get(COLLECTION_KEY);
		} catch (error) {
			await delay(BACKOFF_BASE_MS + jitter());
			return await keyval.get(COLLECTION_KEY);
		}
	}

	return {
		async isStorageAvailable(): Promise<boolean> {
			return probe();
		},

		async loadCollection(): Promise<string[]> {
			const available = await probe();
			if (!available) {
				throw new StorageUnavailableError('IndexedDB is not available');
			}

			try {
				const raw = await withTimeout(loadWithRetry(), () => new StorageReadError('Timeout'));
				if (raw === undefined || raw === null) return [];
				if (!isCollectionRecord(raw)) return [];
				return raw.ids;
			} catch (error) {
				if (error instanceof StorageUnavailableError) throw error;
				if (error instanceof StorageReadError) throw error;
				throw new StorageReadError(
					error instanceof Error ? error.message : 'Failed to load collection'
				);
			}
		},

		async saveCollection(ids: string[]): Promise<void> {
			const available = await probe();
			if (!available) {
				throw new StorageUnavailableError('IndexedDB is not available');
			}

			const record: CollectionRecord = {
				version: COLLECTION_RECORD_VERSION,
				ids
			};

			try {
				await withTimeout(keyval.set(COLLECTION_KEY, record), () => new StorageWriteError('Timeout'));
			} catch (error) {
				if (error instanceof StorageUnavailableError) throw error;
				if (error instanceof StorageWriteError) throw error;
				throw new StorageWriteError(
					error instanceof Error ? error.message : 'Failed to save collection'
				);
			}
		}
	};
}
