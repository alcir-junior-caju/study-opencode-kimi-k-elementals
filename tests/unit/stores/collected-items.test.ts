/**
 * T039 — Testes da Store derivada de itens colecionados.
 */

import { jest } from '@jest/globals';
import { get, writable, type Readable } from 'svelte/store';
import { createCollectedItemsStore } from '$lib/stores/collected-items';
import type { CollectionStore } from '$lib/stores/collection';
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

const air: Elemental = {
	id: 'air_basic',
	type: 'Ar',
	rarity: 'Raro',
	variation: 'Normal',
	imagePath: 'assets/elementals/air/air_basic.webp'
};

const catalogSequence: readonly Elemental[] = [water, air, fire];

function createFakeCatalog() {
	return {
		getAll: () => catalogSequence,
		getById(id: string): Elemental | undefined {
			return catalogSequence.find((e) => e.id === id);
		}
	};
}

function createFakeCollectionStore(initial: string[] = []) {
	const collection = writable<Set<string>>(new Set(initial));
	const status = writable<'hydrating' | 'active' | 'degraded'>('active');
	const toggle = jest.fn<(id: string) => Promise<void>>();
	toggle.mockResolvedValue(undefined);

	return {
		collection,
		status,
		has(_id: string): Readable<boolean> {
			return writable(false);
		},
		hydrate: jest.fn(),
		toggle
	};
}

describe('CollectedItemsStore', () => {
	it('resolve IDs contra o catálogo, descarta órfãos e ordena pela sequência canônica', () => {
		const collectionStore = createFakeCollectionStore(['fire_gold', 'unknown_id', 'water_basic']);
		const store = createCollectedItemsStore(collectionStore as unknown as CollectionStore, createFakeCatalog());

		expect(get(store.collectedItems)).toEqual([water, fire]);
	});

	it('emite apenas em mudanças confirmadas do conjunto', async () => {
		const collectionStore = createFakeCollectionStore(['water_basic']);
		const store = createCollectedItemsStore(collectionStore as unknown as CollectionStore, createFakeCatalog());

		const values: Elemental[][] = [];
		store.collectedItems.subscribe((items) => values.push([...items]));

		expect(values).toHaveLength(1);
		expect(values[0]).toEqual([water]);

		collectionStore.collection.set(new Set(['water_basic', 'air_basic']));
		await Promise.resolve();

		expect(values).toHaveLength(2);
		expect(values[1]).toEqual([water, air]);
	});

	it('lista vazia quando a coleção está vazia', () => {
		const collectionStore = createFakeCollectionStore([]);
		const store = createCollectedItemsStore(collectionStore as unknown as CollectionStore, createFakeCatalog());

		expect(get(store.collectedItems)).toEqual([]);
	});

	it('expor isEditing como writable iniciado em false', () => {
		const collectionStore = createFakeCollectionStore([]);
		const store = createCollectedItemsStore(collectionStore as unknown as CollectionStore, createFakeCatalog());

		expect(get(store.isEditing)).toBe(false);
		store.isEditing.set(true);
		expect(get(store.isEditing)).toBe(true);
	});

	it('remove(id) delega ao toggle da Store base', async () => {
		const collectionStore = createFakeCollectionStore(['water_basic']);
		const store = createCollectedItemsStore(collectionStore as unknown as CollectionStore, createFakeCatalog());

		await store.remove('water_basic');

		expect(collectionStore.toggle).toHaveBeenCalledWith('water_basic');
	});
});
