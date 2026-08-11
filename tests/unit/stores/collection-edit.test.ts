/**
 * T045 — Testes do modo de edição da Store da coleção.
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

const catalogSequence: readonly Elemental[] = [water, fire];

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

describe('Collection edit store mode', () => {
	it('isEditing alterna o modo de edição', () => {
		const collectionStore = createFakeCollectionStore(['water_basic', 'fire_gold']);
		const store = createCollectedItemsStore(
			collectionStore as unknown as CollectionStore,
			createFakeCatalog()
		);

		expect(get(store.isEditing)).toBe(false);

		store.isEditing.set(true);
		expect(get(store.isEditing)).toBe(true);

		store.isEditing.set(false);
		expect(get(store.isEditing)).toBe(false);
	});

	it('remove(id) delega ao toggle e resolve após gravação confirmada', async () => {
		const collectionStore = createFakeCollectionStore(['water_basic', 'fire_gold']);
		const store = createCollectedItemsStore(
			collectionStore as unknown as CollectionStore,
			createFakeCatalog()
		);

		collectionStore.toggle.mockImplementation(async (id: string) => {
			collectionStore.collection.update((set) => {
				const next = new Set(set);
				next.delete(id);
				return next;
			});
		});

		expect(get(store.collectedItems)).toEqual([water, fire]);

		await store.remove('water_basic');

		expect(collectionStore.toggle).toHaveBeenCalledWith('water_basic');
		expect(get(store.collectedItems)).toEqual([fire]);
	});

	it('falha de escrita rejeita e o item permanece na lista', async () => {
		const collectionStore = createFakeCollectionStore(['water_basic', 'fire_gold']);
		const store = createCollectedItemsStore(
			collectionStore as unknown as CollectionStore,
			createFakeCatalog()
		);

		collectionStore.toggle.mockRejectedValue(new Error('save failed'));

		expect(get(store.collectedItems)).toEqual([water, fire]);

		await expect(store.remove('water_basic')).rejects.toBeDefined();
		expect(get(store.collectedItems)).toEqual([water, fire]);
	});

	it('remover o último item leva a lista vazia', async () => {
		const collectionStore = createFakeCollectionStore(['water_basic']);
		const store = createCollectedItemsStore(
			collectionStore as unknown as CollectionStore,
			createFakeCatalog()
		);

		collectionStore.toggle.mockImplementation(async (id: string) => {
			collectionStore.collection.update((set) => {
				const next = new Set(set);
				next.delete(id);
				return next;
			});
		});

		expect(get(store.collectedItems)).toEqual([water]);

		await store.remove('water_basic');

		expect(get(store.collectedItems)).toEqual([]);
	});
});
