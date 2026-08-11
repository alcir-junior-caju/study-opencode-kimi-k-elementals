import {
	RARITY_ORDER,
	TYPE_ORDER,
	VARIATION_ORDER,
	type Elemental,
	type Rarity,
	type ElementalType
} from '$lib/domain/elemental';
import type { CatalogGroup, Neighbors } from '$lib/domain/catalog-group';
import rawCatalog from '$data/catalog.json';

export class CatalogIntegrityError extends Error {
	readonly code = 'CATALOG_INTEGRITY_ERROR';
	constructor(message = 'Catalog integrity check failed') {
		super(message);
	}
}

function rankFor(elemental: Elemental) {
	return {
		rarity: RARITY_ORDER.indexOf(elemental.rarity),
		type: TYPE_ORDER.indexOf(elemental.type),
		variation: VARIATION_ORDER.indexOf(elemental.variation)
	};
}

function compareElemental(a: Elemental, b: Elemental): number {
	const rankA = rankFor(a);
	const rankB = rankFor(b);

	if (rankA.rarity !== rankB.rarity) return rankA.rarity - rankB.rarity;
	if (rankA.type !== rankB.type) return rankA.type - rankB.type;
	return rankA.variation - rankB.variation;
}

function validateIntegrity(elementals: Elemental[]): void {
	if (!Array.isArray(elementals) || elementals.length !== 117) {
		throw new CatalogIntegrityError('Catalog must contain exactly 117 elementals');
	}

	const ids = new Set<string>();
	for (const item of elementals) {
		if (
			!item ||
			typeof item.id !== 'string' ||
			item.id.length === 0 ||
			typeof item.type !== 'string' ||
			item.type.length === 0 ||
			typeof item.rarity !== 'string' ||
			item.rarity.length === 0 ||
			typeof item.variation !== 'string' ||
			item.variation.length === 0 ||
			typeof item.imagePath !== 'string' ||
			item.imagePath.length === 0
		) {
			throw new CatalogIntegrityError('Catalog item has invalid structure');
		}
		if (ids.has(item.id)) {
			throw new CatalogIntegrityError(`Duplicate catalog ID: ${item.id}`);
		}
		ids.add(item.id);
	}
}

export interface CatalogModule {
	getAll(): readonly Elemental[];
	getById(id: string): Elemental | undefined;
	getByRarity(rarity: Rarity): readonly Elemental[];
	getByType(type: ElementalType): readonly Elemental[];
	groupedByRarityAndType(): readonly CatalogGroup[];
	getNeighbors(id: string): Neighbors | undefined;
}

function createCatalogIndex(elementals: Elemental[]): CatalogModule {
	validateIntegrity(elementals);

	const sequence = Object.freeze([...elementals].sort(compareElemental));
	const byId = new Map<string, Elemental>();
	const positionById = new Map<string, number>();
	for (let i = 0; i < sequence.length; i++) {
		const item = sequence[i];
		byId.set(item.id, item);
		positionById.set(item.id, i);
	}

	const byRarity = new Map<Rarity, Elemental[]>();
	const byType = new Map<ElementalType, Elemental[]>();
	const groups = new Map<string, CatalogGroup>();

	for (const item of sequence) {
		if (!byRarity.has(item.rarity)) byRarity.set(item.rarity, []);
		byRarity.get(item.rarity)!.push(item);

		if (!byType.has(item.type)) byType.set(item.type, []);
		byType.get(item.type)!.push(item);

		const key = `${item.rarity}|${item.type}`;
		if (!groups.has(key)) {
			groups.set(key, {
				rarity: item.rarity,
				type: item.type,
				items: []
			});
		}
		(groups.get(key)!.items as Elemental[]).push(item);
	}

	const groupedByRarityAndTypeResult = Object.freeze(
		Array.from(groups.values()).map((group) =>
			Object.freeze({ ...group, items: Object.freeze([...group.items]) })
		)
	);

	function getAll(): readonly Elemental[] {
		return sequence;
	}

	function getById(id: string): Elemental | undefined {
		return byId.get(id);
	}

	function getByRarity(rarity: Rarity): readonly Elemental[] {
		return Object.freeze(byRarity.get(rarity) ?? []);
	}

	function getByType(type: ElementalType): readonly Elemental[] {
		return Object.freeze(byType.get(type) ?? []);
	}

	function groupedByRarityAndType(): readonly CatalogGroup[] {
		return groupedByRarityAndTypeResult;
	}

	function getNeighbors(id: string): Neighbors | undefined {
		const position = positionById.get(id);
		if (position === undefined) return undefined;

		const total = sequence.length;
		const previousId = sequence[(position - 1 + total) % total].id;
		const nextId = sequence[(position + 1) % total].id;

		return Object.freeze({ previousId, nextId, position, total });
	}

	return {
		getAll,
		getById,
		getByRarity,
		getByType,
		groupedByRarityAndType,
		getNeighbors
	};
}

export function createCatalogModule(elementals: Elemental[]): CatalogModule {
	return createCatalogIndex(elementals);
}

export const catalog: CatalogModule = createCatalogIndex(rawCatalog.elementals as Elemental[]);
