/**
 * T008 — Testes unitários da Store da coleção.
 */

import { jest } from '@jest/globals';
import { get } from 'svelte/store';
import { createCollectionStore } from '$lib/stores/collection';
import type { PersistenceAdapter } from '$lib/persistence/adapter';
import { StorageReadError, StorageWriteError } from '$lib/persistence/errors';
import type { Elemental } from '$lib/domain/elemental';

const water: Elemental = {
	id: 'water_basic',
	type: 'Água',
	rarity: 'Raro',
	variation: 'Normal',
	imagePath: 'assets/elementals/water/water_basic.webp'
};

const fire: Elemental = {
	id: 'fire_gold',
	type: 'Fogo',
	rarity: 'Especial',
	variation: 'Dourado',
	imagePath: 'assets/elementals/fire/fire_gold.webp'
};

const orphan: Elemental = {
	id: 'orphan_gold',
	type: 'Fogo',
	rarity: 'Especial',
	variation: 'Dourado',
	imagePath: 'assets/elementals/fire/orphan_gold.webp'
};

function createFakeAdapter(overrides?: Partial<PersistenceAdapter>): PersistenceAdapter {
	let stored: string[] = [];
	return {
		async isStorageAvailable() {
			return true;
		},
		async loadCollection() {
			return stored;
		},
		async saveCollection(ids: string[]) {
			stored = [...ids];
		},
		...overrides
	};
}

function createFakeCatalog(ids: string[]) {
	return {
		getById(id: string): Elemental | undefined {
			return ids.includes(id)
				? ({ id, type: 'Água', rarity: 'Raro', variation: 'Normal', imagePath: '' } as Elemental)
				: undefined;
		}
	};
}

describe('CollectionStore', () => {
	it('hydrate → active quando storage está disponível e a leitura ok', async () => {
		const adapter = createFakeAdapter();
		const store = createCollectionStore(adapter, createFakeCatalog([water.id, fire.id]));

		await store.hydrate();

		expect(get(store.status)).toBe('active');
		expect(get(store.collection).has(water.id)).toBe(false);
	});

	it('hydrate → degraded quando storage está indisponível', async () => {
		const adapter = createFakeAdapter({
			async isStorageAvailable() {
				return false;
			}
		});
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));

		await store.hydrate();

		expect(get(store.status)).toBe('degraded');
		expect(get(store.collection).size).toBe(0);
	});

	it('hydrate → degraded quando loadCollection rejeita com StorageReadError', async () => {
		const adapter = createFakeAdapter({
			async loadCollection() {
				throw new StorageReadError('read failed');
			}
		});
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));

		await store.hydrate();

		expect(get(store.status)).toBe('degraded');
		expect(get(store.collection).size).toBe(0);
	});

	it('descarta IDs órfãos silenciosamente na hidratação', async () => {
		const adapter = createFakeAdapter({
			async loadCollection() {
				return [water.id, orphan.id];
			}
		});
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));

		await store.hydrate();

		expect(get(store.status)).toBe('active');
		expect(get(store.collection).has(water.id)).toBe(true);
		expect(get(store.collection).has(orphan.id)).toBe(false);
	});

	it('toggle adiciona e remove IDs e persiste o conjunto', async () => {
		const adapter = createFakeAdapter();
		const store = createCollectionStore(adapter, createFakeCatalog([water.id, fire.id]));
		await store.hydrate();

		await store.toggle(water.id);
		expect(get(store.collection).has(water.id)).toBe(true);

		await store.toggle(fire.id);
		expect(get(store.collection).has(fire.id)).toBe(true);

		await store.toggle(water.id);
		expect(get(store.collection).has(water.id)).toBe(false);
		expect(get(store.collection).has(fire.id)).toBe(true);
	});

	it('toggle rejeita sem gravar para ID fora do catálogo', async () => {
		const save = jest.fn() as unknown as (ids: string[]) => Promise<void>;
		const adapter = createFakeAdapter({ saveCollection: save });
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));
		await store.hydrate();

		await expect(store.toggle('unknown_id')).rejects.toBeDefined();
		expect(save).not.toHaveBeenCalled();
		expect(get(store.collection).has('unknown_id')).toBe(false);
	});

	it('toggle rejeita imediatamente em modo degraded', async () => {
		const save = jest.fn() as unknown as (ids: string[]) => Promise<void>;
		const adapter = createFakeAdapter({
			async isStorageAvailable() {
				return false;
			},
			saveCollection: save
		});
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));
		await store.hydrate();

		await expect(store.toggle(water.id)).rejects.toBeDefined();
		expect(save).not.toHaveBeenCalled();
	});

	it('falha de escrita reverte o conjunto e rejeita', async () => {
		let shouldFail = true;
		const adapter = createFakeAdapter({
			async saveCollection() {
				if (shouldFail) {
					throw new StorageWriteError('quota exceeded');
				}
			}
		});
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));
		await store.hydrate();

		await expect(store.toggle(water.id)).rejects.toBeInstanceOf(StorageWriteError);
		expect(get(store.collection).has(water.id)).toBe(false);

		shouldFail = false;
		await store.toggle(water.id);
		expect(get(store.collection).has(water.id)).toBe(true);
	});

	it('toggles concorrentes são serializados (uma gravação por vez)', async () => {
		let running = 0;
		let maxRunning = 0;
		const adapter = createFakeAdapter({
			async saveCollection() {
				running += 1;
				maxRunning = Math.max(maxRunning, running);
				await new Promise((resolve) => setTimeout(resolve, 10));
				running -= 1;
			}
		});
		const store = createCollectionStore(adapter, createFakeCatalog([water.id, fire.id]));
		await store.hydrate();

		await Promise.all([store.toggle(water.id), store.toggle(fire.id)]);

		expect(maxRunning).toBe(1);
		expect(get(store.collection).has(water.id)).toBe(true);
		expect(get(store.collection).has(fire.id)).toBe(true);
	});

	it('solicita navigator.storage.persist() quando a API existe', async () => {
		const persist = jest.fn() as jest.Mock<() => Promise<boolean>>;
		persist.mockResolvedValue(true);
		const originalPersist = navigator.storage?.persist as (() => Promise<boolean>) | undefined;
		// @ts-expect-error mock da API de storage
		navigator.storage = { persist };

		const adapter = createFakeAdapter();
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));
		await store.hydrate();

		expect(persist).toHaveBeenCalledTimes(1);

		// @ts-expect-error restaura mock
		navigator.storage = { persist: originalPersist };
	});

	it('has(id) emite true/false reativamente', async () => {
		const adapter = createFakeAdapter();
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));
		await store.hydrate();

		const hasWater = store.has(water.id);
		expect(get(hasWater)).toBe(false);

		await store.toggle(water.id);
		expect(get(hasWater)).toBe(true);

		await store.toggle(water.id);
		expect(get(hasWater)).toBe(false);
	});

	it('has(id) emite false em modo degraded', async () => {
		const adapter = createFakeAdapter({
			async isStorageAvailable() {
				return false;
			}
		});
		const store = createCollectionStore(adapter, createFakeCatalog([water.id]));
		await store.hydrate();

		expect(get(store.has(water.id))).toBe(false);
	});
});
