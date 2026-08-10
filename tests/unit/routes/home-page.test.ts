/**
 * T017 — Teste da página inicial.
 */

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/svelte';
import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CollectionStatus } from '$lib/stores/collection';
import { catalog } from '$lib/catalog';
import { RARITY_ORDER } from '$lib/domain/elemental';

let mockCollection: Writable<Set<string>> = writable(new Set<string>());
let mockStatus: Writable<CollectionStatus> = writable('active');

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
			toggle: jest.fn()
		}
	};
});

describe('Home page', () => {
	const groups = catalog.groupedByRarityAndType();

	beforeEach(() => {
		mockCollection.set(new Set<string>());
		mockStatus.set('active');
	});

	it('renderiza as 5 seções de raridade com seus grupos', async () => {
		const HomePage = (await import('../../../src/routes/+page.svelte')).default;

		render(HomePage, { props: { data: { groups } } });

		for (const rarity of RARITY_ORDER) {
			expect(screen.getByRole('heading', { level: 2, name: rarity })).toBeInTheDocument();
		}
	});

	it('exibe mensagem de erro em vez de lista quando data.error está presente', async () => {
		const HomePage = (await import('../../../src/routes/+page.svelte')).default;

		render(HomePage, { props: { data: { error: 'integrity' } } });

		expect(
			screen.getByText(/erro de integridade|não foi possível carregar o catálogo/i)
		).toBeInTheDocument();
		expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
	});

	it('exibe DegradedBanner e omite indicação de posse em modo degradado', async () => {
		mockStatus.set('degraded');
		mockCollection.set(new Set([groups[0].items[0].id]));

		const HomePage = (await import('../../../src/routes/+page.svelte')).default;

		render(HomePage, { props: { data: { groups } } });

		expect(screen.getByText(/armazenamento indisponível|modo degradado/i)).toBeInTheDocument();
	});

	it('LocalStorageNotice está presente em todo carregamento', async () => {
		const HomePage = (await import('../../../src/routes/+page.svelte')).default;

		render(HomePage, { props: { data: { groups } } });

		expect(
			screen.getByText(/coleção é local e será perdida ao limpar os dados do navegador/i)
		).toBeInTheDocument();
	});
});
