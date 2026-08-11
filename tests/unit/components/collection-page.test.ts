/**
 * T040 — Testes da página da coleção pessoal.
 */

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/svelte';
import { writable, type Writable } from 'svelte/store';
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

let mockCollectedItems: Writable<readonly Elemental[]> = writable([]);
let mockIsEditing: Writable<boolean> = writable(false);
let mockRemove = jest.fn<(id: string) => Promise<void>>();

jest.unstable_mockModule('$lib/stores/collected-items', () => {
	return {
		collectedItemsStore: {
			collectedItems: mockCollectedItems,
			isEditing: mockIsEditing,
			remove: (id: string) => mockRemove(id)
		}
	};
});

describe('Collection page', () => {
	beforeEach(() => {
		mockCollectedItems.set([]);
		mockIsEditing.set(false);
		mockRemove = jest.fn<() => Promise<void>>();
		mockRemove.mockResolvedValue(undefined);
	});

	it('cada linha exibe miniatura, nome, raridade, variação e check verde', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		mockCollectedItems.set([water, fire]);
		render(CollectionPage, { props: { data: {} } });

		expect(screen.getByText(`${water.type} ${water.variation}`)).toBeInTheDocument();
		expect(screen.getByText(water.rarity)).toBeInTheDocument();
		expect(screen.getByText(water.variation)).toBeInTheDocument();

		expect(screen.getByText(`${fire.type} ${fire.variation}`)).toBeInTheDocument();
		expect(screen.getByText(fire.rarity)).toBeInTheDocument();
		expect(screen.getByText(fire.variation)).toBeInTheDocument();

		expect(screen.getAllByLabelText(/coletado/i)).toHaveLength(2);
	});

	it('coleção vazia renderiza EmptyCollection com orientação de explorar o catálogo', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		render(CollectionPage, { props: { data: {} } });

		expect(screen.getByText(/explorar o catálogo/i)).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('modo degradado exibe aviso distinto e nenhuma lista parcial', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		mockCollectedItems.set([water]);
		render(CollectionPage, { props: { data: { degraded: true } } });

		expect(screen.getByText(/não pôde ser carregada|não foi possível carregar/i)).toBeInTheDocument();
		expect(screen.queryByText(`${water.type} ${water.variation}`)).not.toBeInTheDocument();
	});
});
