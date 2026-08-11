/**
 * T014 — Testes do módulo de catálogo.
 */

import {
	catalog,
	CatalogIntegrityError,
	createCatalogModule
} from '$lib/catalog';
import {
	RARITY_ORDER,
	TYPE_ORDER,
	VARIATION_ORDER,
	type Elemental,
	type Rarity,
	type ElementalType,
	type Variation
} from '$lib/domain/elemental';

const EXPECTED_SEQUENCE: string[] = [
	'water_basic',
	'earth_basic',
	'fire_basic',
	'air_basic',
	'fishy_basic',
	'water_gold',
	'water_candy',
	'water_galaxy',
	'water_holofoil',
	'water_gem',
	'water_quack',
	'earth_gold',
	'earth_candy',
	'earth_galaxy',
	'earth_cube',
	'earth_gem',
	'earth_quack',
	'fire_gold',
	'fire_candy',
	'fire_galaxy',
	'fire_holofoil',
	'fire_cube',
	'fire_quack',
	'air_gold',
	'air_candy',
	'air_galaxy',
	'air_holofoil',
	'fishy_gold',
	'fishy_candy',
	'fishy_galaxy',
	'fishy_cube',
	'duck_gold',
	'duck_candy',
	'duck_galaxy',
	'duck_gem',
	'ghost_gold',
	'ghost_candy',
	'ghost_galaxy',
	'ghost_holofoil',
	'demon_gold',
	'demon_candy',
	'demon_galaxy',
	'demon_gem',
	'king_gold',
	'king_candy',
	'king_galaxy',
	'king_holofoil',
	'drifter_gold',
	'drifter_candy',
	'drifter_galaxy',
	'drifter_gem',
	'soccer_gold',
	'soccer_candy',
	'soccer_galaxy',
	'soccer_holofoil',
	'sleepy_gold',
	'sleepy_candy',
	'sleepy_galaxy',
	'sleepy_cube',
	'peely_gold',
	'peely_candy',
	'peely_galaxy',
	'peely_holofoil',
	'punk_gold',
	'punk_candy',
	'punk_galaxy',
	'punk_cube',
	'boss_gold',
	'boss_candy',
	'boss_galaxy',
	'boss_cube',
	'seven_gold',
	'seven_candy',
	'seven_galaxy',
	'seven_holofoil',
	'llama_gold',
	'llama_candy',
	'llama_galaxy',
	'llama_gem',
	'grimreaper_gold',
	'grimreaper_candy',
	'grimreaper_galaxy',
	'grimreaper_holofoil',
	'grimreaper_cube',
	'grimreaper_gem',
	'zeropoint_gold',
	'zeropoint_candy',
	'zeropoint_galaxy',
	'zeropoint_holofoil',
	'zeropoint_cube',
	'zeropoint_gem',
	'zeropoint_quack',
	'batman_gold',
	'batman_candy',
	'batman_galaxy',
	'batman_holofoil',
	'batman_cube',
	'theburntpeanut_basic',
	'pollo_basic',
	'duck_basic',
	'ghost_basic',
	'demon_basic',
	'king_basic',
	'drifter_basic',
	'soccer_basic',
	'sleepy_basic',
	'peely_basic',
	'punk_basic',
	'boss_basic',
	'seven_basic',
	'llama_basic',
	'grimreaper_basic',
	'zeropoint_basic',
	'batman_basic',
	'fillergrunt_basic',
	'vinijr_basic',
	'pedicureantacid_basic'
];

function rankOf(rarity: Rarity, type: ElementalType, variation: Variation) {
	return {
		rarity: RARITY_ORDER.indexOf(rarity),
		type: TYPE_ORDER.indexOf(type),
		variation: VARIATION_ORDER.indexOf(variation)
	};
}

describe('Catalog module', () => {
	it('getAll retorna os 117 itens na sequência canônica', () => {
		const all = catalog.getAll();
		expect(all).toHaveLength(117);
		expect(all.map((e) => e.id)).toEqual(EXPECTED_SEQUENCE);
	});

	it('getById resolve item existente e retorna undefined para ID inexistente sem lançar', () => {
		expect(catalog.getById('water_basic')?.type).toBe('Água');
		expect(catalog.getById('unknown_id')).toBeUndefined();
	});

	it('getByRarity retorna itens na ordenação canônica', () => {
		const rare = catalog.getByRarity('Raro');
		expect(rare).toHaveLength(5);
		expect(rare.map((e) => e.id)).toEqual([
			'water_basic',
			'earth_basic',
			'fire_basic',
			'air_basic',
			'fishy_basic'
		]);

		const epic = catalog.getByRarity('Épico');
		expect(epic.map((e) => e.id)).toEqual([
			'duck_basic',
			'ghost_basic',
			'demon_basic',
			'king_basic',
			'drifter_basic',
			'soccer_basic'
		]);
	});

	it('getByType retorna as variações do tipo na ordenação canônica', () => {
		const water = catalog.getByType('Água');
		expect(water.map((e) => e.id)).toEqual([
			'water_basic',
			'water_gold',
			'water_candy',
			'water_galaxy',
			'water_holofoil',
			'water_gem',
			'water_quack'
		]);
	});

	it('groupedByRarityAndType contém 5 raridades, grupos ordenados e união totalizando 117', () => {
		const groups = catalog.groupedByRarityAndType();
		const rarities = groups.map((g) => g.rarity);
		expect(rarities).toEqual(expect.arrayContaining(RARITY_ORDER));

		const distinctRarities = [...new Set(rarities)];
		expect(distinctRarities).toEqual(RARITY_ORDER);

		const total = groups.reduce((sum, g) => sum + g.items.length, 0);
		expect(total).toBe(117);

		let previous = rankOf('Raro', 'Água', 'Normal');
		for (const group of groups) {
			const current = rankOf(group.rarity, group.type, 'Normal');
			expect(current.rarity).toBeGreaterThanOrEqual(previous.rarity);
			if (current.rarity === previous.rarity) {
				expect(current.type).toBeGreaterThanOrEqual(previous.type);
			}
			previous = current;
		}
	});

	it('checagem de integridade lança CatalogIntegrityError com seed adulterado', () => {
		const corrupted = [
			{ id: 'only_one', type: 'Água', rarity: 'Raro', variation: 'Normal', imagePath: '' }
		] as Elemental[];
		expect(() => createCatalogModule(corrupted)).toThrow(CatalogIntegrityError);
	});

});
