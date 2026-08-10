/**
 * T015 — Testes dos componentes da listagem da home.
 */

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/svelte';
import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CollectionStatus } from '$lib/stores/collection';
import { catalog } from '$lib/catalog';

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

describe('Home listing components', () => {
	const groups = catalog.groupedByRarityAndType();
	const firstGroup = groups[0];
	const firstElemental = firstGroup.items[0];

	beforeEach(() => {
		mockCollection.set(new Set<string>());
		mockStatus.set('active');
	});

	it('RaritySection renderiza o cabeçalho da raridade e seus tipos', async () => {
		const RaritySection = (await import('$lib/components/catalog/RaritySection.svelte')).default;

		render(RaritySection, { props: { rarity: firstGroup.rarity, groups: [firstGroup] } });

		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(firstGroup.rarity);
		expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(firstGroup.type);
	});

	it('TypeGroup renderiza o grupo de tipo', async () => {
		const TypeGroup = (await import('$lib/components/catalog/TypeGroup.svelte')).default;

		render(TypeGroup, { props: { group: firstGroup } });

		expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(firstGroup.type);
		for (const item of firstGroup.items) {
			expect(screen.getByText(`${item.type} ${item.variation}`)).toBeInTheDocument();
		}
	});

	it('ElementalCard exibe nome derivado, imagem lazy e link para tela individual', async () => {
		const ElementalCard = (await import('$lib/components/catalog/ElementalCard.svelte')).default;

		render(ElementalCard, { props: { elemental: firstElemental } });

		const link = screen.getByRole('link') as HTMLAnchorElement;
		expect(link).toHaveAttribute('href', `/elemental/${firstElemental.id}`);

		expect(screen.getByText(`${firstElemental.type} ${firstElemental.variation}`)).toBeInTheDocument();

		const img = screen.getByRole('img') as HTMLImageElement;
		expect(img).toHaveAttribute('loading', 'lazy');
		expect(img).toHaveAttribute('alt', expect.stringContaining(firstElemental.type));
	});

	it('ElementalCard exibe indicação visual de posse quando a Store contém o ID', async () => {
		const ElementalCard = (await import('$lib/components/catalog/ElementalCard.svelte')).default;

		mockCollection.set(new Set([firstElemental.id]));

		render(ElementalCard, { props: { elemental: firstElemental } });

		expect(screen.getByLabelText(/coletado/i)).toBeInTheDocument();
	});
});
