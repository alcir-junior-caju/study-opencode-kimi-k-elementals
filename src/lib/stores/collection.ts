import { writable, derived, get, type Readable } from 'svelte/store';
import type { PersistenceAdapter } from '$lib/persistence/adapter';
import { StorageUnavailableError } from '$lib/persistence/errors';
import type { Elemental } from '$lib/domain/elemental';

export type CollectionStatus = 'hydrating' | 'active' | 'degraded';

export interface CollectionStore {
	readonly collection: Readable<ReadonlySet<string>>;
	readonly status: Readable<CollectionStatus>;
	has(id: string): Readable<boolean>;
	hydrate(): Promise<void>;
	toggle(id: string): Promise<void>;
}

interface CatalogLike {
	getById(id: string): Elemental | undefined;
}

export function createCollectionStore(
	adapter: PersistenceAdapter,
	catalog: CatalogLike
): CollectionStore {
	const internal = writable<Set<string>>(new Set());
	const status = writable<CollectionStatus>('hydrating');

	const collection: Readable<ReadonlySet<string>> = {
		subscribe: internal.subscribe
	};

	function has(id: string): Readable<boolean> {
		return derived([collection, status], ([$collection, $status]) => {
			if ($status === 'degraded') return false;
			return $collection.has(id);
		});
	}

	let writeQueue = Promise.resolve();

	async function toggle(id: string): Promise<void> {
		if (!catalog.getById(id)) {
			return Promise.reject(new Error(`ID "${id}" not found in catalog`));
		}
		if (get(status) === 'degraded') {
			return Promise.reject(new StorageUnavailableError('Storage is degraded'));
		}

		const operation = writeQueue.then(async () => {
			const current = get(internal);
			const next = new Set(current);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			internal.set(next);

			try {
				await adapter.saveCollection(Array.from(next));
			} catch (error) {
				internal.set(current);
				throw error;
			}
		});

		// A fila continua vazia após uma falha, mas o erro ainda propaga ao chamador.
		writeQueue = operation.catch(() => {
			/* noop */
		});

		return operation;
	}

	async function hydrate(): Promise<void> {
		const available = await adapter.isStorageAvailable();
		if (!available) {
			status.set('degraded');
			internal.set(new Set());
			return;
		}

		try {
			const storedIds = await adapter.loadCollection();
			const validIds = storedIds.filter((id) => catalog.getById(id) !== undefined);
			internal.set(new Set(validIds));
			status.set('active');
		} catch {
			internal.set(new Set());
			status.set('degraded');
		}

		if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.persist) {
			try {
				navigator.storage.persist().catch(() => {
					// Falha de persistência não é crítica; não quebra a experiência.
				});
			} catch {
				// Ignora ambientes onde navigator.storage não é acessível.
			}
		}
	}

	return {
		collection,
		status,
		has,
		hydrate,
		toggle
	};
}
