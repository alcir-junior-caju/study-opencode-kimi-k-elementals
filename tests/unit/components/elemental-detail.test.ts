/**
 * T032 — Testes dos componentes da tela individual.
 */

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/svelte';
import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CollectionStatus } from '$lib/stores/collection';
import { catalog } from '$lib/catalog';

let mockCollection: Writable<Set<string>> = writable(new Set<string>());
let mockStatus: Writable<CollectionStatus> = writable('active');
let mockToggle = jest.fn<(id: string) => Promise<void>>();

jest.unstable_mockModule('$lib/stores/collection', () => {
	return {
		collectionStore: {
			collection: mockCollection,
			status: mockStatus,
			has(id: string) {
				return derived([mockCollection, mockStatus], ([$collection, $status]) => {
					return $status !== 'degraded' && $collection.has(id);
				});
			},
			hydrate: jest.fn(),
			toggle: (id: string) => mockToggle(id)
		}
	};
});

describe('ElementalDetail', () => {
	const elemental = catalog.getById('water_basic')!;

	beforeEach(() => {
		mockCollection.set(new Set<string>());
		mockStatus.set('active');
		mockToggle = jest.fn<() => Promise<void>>();
		mockToggle.mockResolvedValue(undefined);
	});

	it('exibe cabeçalho com nome, raridade e variação', async () => {
		const ElementalDetail = (await import('$lib/components/elemental/ElementalDetail.svelte'))
			.default;

		render(ElementalDetail, { props: { elemental } });

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
			`${elemental.type} ${elemental.variation}`
		);
		expect(screen.getByText(elemental.rarity)).toBeInTheDocument();
		expect(screen.getByText(elemental.variation)).toBeInTheDocument();
	});

	it('exibe imagem em destaque com fallback de placeholder', async () => {
		const ElementalDetail = (await import('$lib/components/elemental/ElementalDetail.svelte'))
			.default;

		render(ElementalDetail, { props: { elemental } });

		const img = screen.getByRole('img') as HTMLImageElement;
		expect(img).toHaveAttribute('src', `/${elemental.imagePath}`);
		expect(img).toHaveAttribute('alt', `${elemental.type} ${elemental.variation}`);
	});
});

describe('CircularNav', () => {
	const elemental = catalog.getById('water_basic')!;
	const neighbors = catalog.getNeighbors(elemental.id)!;

	beforeEach(() => {
		mockCollection.set(new Set<string>());
		mockStatus.set('active');
		mockToggle = jest.fn<() => Promise<void>>();
		mockToggle.mockResolvedValue(undefined);
	});

	it('renderiza links anterior/próximo com os IDs vizinhos e toggle central', async () => {
		const CircularNav = (await import('$lib/components/elemental/CircularNav.svelte')).default;

		render(CircularNav, { props: { elemental, neighbors } });

		const links = screen.getAllByRole('link') as HTMLAnchorElement[];
		expect(links).toHaveLength(2);
		expect(links[0]).toHaveAttribute('href', `/elemental/${neighbors.previousId}`);
		expect(links[1]).toHaveAttribute('href', `/elemental/${neighbors.nextId}`);

		expect(screen.getByRole('button', { name: /adicionar à coleção|remover da coleção/i })).toBeInTheDocument();
	});

	it('toggle desabilitado em modo degraded', async () => {
		const CircularNav = (await import('$lib/components/elemental/CircularNav.svelte')).default;

		mockStatus.set('degraded');

		render(CircularNav, { props: { elemental, neighbors } });

		expect(screen.getByRole('button', { name: /adicionar à coleção|remover da coleção/i })).toBeDisabled();
	});
});
