import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { CollectionStore } from '$lib/stores/collection';
import type { Elemental } from '$lib/domain/elemental';
import { collectionStore } from '$lib/stores/collection';
import { catalog } from '$lib/catalog';

export interface CollectedItemsStore {
	readonly collectedItems: Readable<readonly Elemental[]>;
	readonly isEditing: Writable<boolean>;
	remove(id: string): Promise<void>;
}

interface CatalogLike {
	getAll(): readonly Elemental[];
	getById(id: string): Elemental | undefined;
}

export function createCollectedItemsStore(
	collectionStore: CollectionStore,
	catalog: CatalogLike
): CollectedItemsStore {
	const collectedItems: Readable<readonly Elemental[]> = derived(
		collectionStore.collection,
		($collection) => {
			const sequence = catalog.getAll();
			return sequence.filter((elemental) => $collection.has(elemental.id));
		}
	);

	const isEditing: Writable<boolean> = writable(false);

	async function remove(id: string): Promise<void> {
		return collectionStore.toggle(id);
	}

	return {
		collectedItems,
		isEditing,
		remove
	};
}

export const collectedItemsStore: CollectedItemsStore = createCollectedItemsStore(
	collectionStore,
	catalog
);
