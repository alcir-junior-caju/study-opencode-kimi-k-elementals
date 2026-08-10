import type { Elemental, Rarity, ElementalType } from './elemental';

export interface CatalogGroup {
	readonly rarity: Rarity;
	readonly type: ElementalType;
	readonly items: readonly Elemental[];
}

export interface Neighbors {
	readonly previousId: string;
	readonly nextId: string;
	readonly position: number;
	readonly total: number;
}
