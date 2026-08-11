/**
 * T027 — Testes do controle de posse (CollectionToggle).
 */

import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CollectionStatus } from '$lib/stores/collection';

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

describe('CollectionToggle', () => {
	const elementalId = 'water_basic';

	beforeEach(() => {
		mockCollection.set(new Set<string>());
		mockStatus.set('active');
		mockToggle = jest.fn<() => Promise<void>>();
		mockToggle.mockResolvedValue(undefined);
	});

	it('um clique dispara collectionStore.toggle(id)', async () => {
		const CollectionToggle = (await import('$lib/components/elemental/CollectionToggle.svelte'))
			.default;

		render(CollectionToggle, { props: { id: elementalId } });

		const control = screen.getByRole('button');
		await fireEvent.click(control);

		expect(mockToggle).toHaveBeenCalledWith(elementalId);
	});

	it('o estado visual reflete a posse confirmada', async () => {
		const CollectionToggle = (await import('$lib/components/elemental/CollectionToggle.svelte'))
			.default;

		mockCollection.set(new Set([elementalId]));

		render(CollectionToggle, { props: { id: elementalId } });

		expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
	});

	it('clique em item colecionado desmarca', async () => {
		const CollectionToggle = (await import('$lib/components/elemental/CollectionToggle.svelte'))
			.default;

		mockCollection.set(new Set([elementalId]));

		render(CollectionToggle, { props: { id: elementalId } });

		const control = screen.getByRole('button');
		expect(control).toHaveAttribute('aria-pressed', 'true');

		await fireEvent.click(control);
		expect(mockToggle).toHaveBeenCalledWith(elementalId);
	});

	it('controle desabilitado em modo degraded', async () => {
		const CollectionToggle = (await import('$lib/components/elemental/CollectionToggle.svelte'))
			.default;

		mockStatus.set('degraded');

		render(CollectionToggle, { props: { id: elementalId } });

		const control = screen.getByRole('button');
		expect(control).toBeDisabled();
	});

	it('rejeição do toggle mantém estado visual inalterado e exibe mensagem acionável', async () => {
		const CollectionToggle = (await import('$lib/components/elemental/CollectionToggle.svelte'))
			.default;

		mockToggle.mockRejectedValue(new Error('save failed'));

		render(CollectionToggle, { props: { id: elementalId } });

		const control = screen.getByRole('button');
		expect(control).toHaveAttribute('aria-pressed', 'false');

		await fireEvent.click(control);

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent(/não foi salva|não pôde ser salva/i);
		});

		expect(control).toHaveAttribute('aria-pressed', 'false');
	});
});
