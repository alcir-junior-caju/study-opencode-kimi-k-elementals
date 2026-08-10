/**
 * T028 — Teste de integração do fluxo de marcação de posse.
 */

import { get, del } from 'idb-keyval';
import { createCollectionStore } from '$lib/stores/collection';
import { createIdbAdapter } from '$lib/persistence/idb-adapter';
import { catalog } from '$lib/catalog';
import { StorageWriteError } from '$lib/persistence/errors';
import { COLLECTION_KEY } from '$lib/persistence/adapter';
import type { PersistenceAdapter } from '$lib/persistence/adapter';

const ids = ['water_basic', 'fire_gold', 'earth_candy'];

function readCollection(store: { collection: { subscribe: (fn: (value: ReadonlySet<string>) => void) => () => void } }): ReadonlySet<string> {
	let value: ReadonlySet<string> = new Set();
	store.collection.subscribe((v) => {
		value = v;
	})();
	return value;
}

function createFailingAdapter(): PersistenceAdapter {
	return {
		async isStorageAvailable() {
			return true;
		},
		async loadCollection() {
			return [];
		},
		async saveCollection() {
			throw new StorageWriteError('quota exceeded');
		}
	};
}

describe('Collection toggle flow', () => {
	beforeEach(async () => {
		await del(COLLECTION_KEY);
	});

	it('marcar itens via Store grava o registro versionado com os IDs', async () => {
		const adapter = createIdbAdapter();
		const store = createCollectionStore(adapter, catalog);

		await store.hydrate();

		for (const id of ids) {
			await store.toggle(id);
		}

		const raw = await get(COLLECTION_KEY);
		expect(raw).toEqual({ version: 1, ids });
	});

	it('nova instância da Store hidratada do mesmo banco recupera 100% das marcações', async () => {
		const adapter = createIdbAdapter();
		const firstStore = createCollectionStore(adapter, catalog);
		await firstStore.hydrate();

		for (const id of ids) {
			await firstStore.toggle(id);
		}

		const secondStore = createCollectionStore(createIdbAdapter(), catalog);
		await secondStore.hydrate();

		const collection = readCollection(secondStore);
		expect(collection.size).toBe(ids.length);
		for (const id of ids) {
			expect(collection.has(id)).toBe(true);
		}
	});

	it('falha de escrita simulada reverte o conjunto e rejeita, sem registro parcial', async () => {
		const adapter = createFailingAdapter();
		const store = createCollectionStore(adapter, catalog);
		await store.hydrate();

		await expect(store.toggle(ids[0])).rejects.toBeInstanceOf(StorageWriteError);
		expect(readCollection(store).has(ids[0])).toBe(false);
	});
});
