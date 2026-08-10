/**
 * T046 — Testes do modo de edição da página da coleção.
 */

import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
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

describe('Collection edit mode', () => {
	beforeEach(() => {
		mockCollectedItems.set([]);
		mockIsEditing.set(false);
		mockRemove = jest.fn<() => Promise<void>>();
		mockRemove.mockResolvedValue(undefined);
	});

	it('botão "Editar coleção" ativa o modo com ação de remoção por item', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		mockCollectedItems.set([water, fire]);
		render(CollectionPage, { props: { data: {} } });

		const editButton = screen.getByRole('button', { name: /editar coleção/i });
		await fireEvent.click(editButton);

		expect(get(mockIsEditing)).toBe(true);
		expect(screen.getAllByRole('button', { name: /remover/i })).toHaveLength(2);
	});

	it('remoção confirmada faz o item sumir imediatamente', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		mockCollectedItems.set([water, fire]);
		mockIsEditing.set(true);
		mockRemove.mockImplementation(async () => {
			mockCollectedItems.set([fire]);
		});

		render(CollectionPage, { props: { data: {} } });

		const removeButtons = screen.getAllByRole('button', { name: /remover/i });
		await fireEvent.click(removeButtons[0]);

		await waitFor(() => {
			expect(screen.queryByText(`${water.type} ${water.variation}`)).not.toBeInTheDocument();
		});
		expect(screen.getByText(`${fire.type} ${fire.variation}`)).toBeInTheDocument();
	});

	it('remover todos exibe o estado vazio', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		mockCollectedItems.set([water]);
		mockIsEditing.set(true);
		mockRemove.mockImplementation(async () => {
			mockCollectedItems.set([]);
		});

		render(CollectionPage, { props: { data: {} } });

		const removeButton = screen.getByRole('button', { name: /remover/i });
		await fireEvent.click(removeButton);

		await waitFor(() => {
			expect(screen.getByText(/explorar o catálogo/i)).toBeInTheDocument();
		});
	});

	it('falha de gravação mantém o item e exibe mensagem explícita', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		mockCollectedItems.set([water]);
		mockIsEditing.set(true);
		mockRemove.mockRejectedValue(new Error('save failed'));

		render(CollectionPage, { props: { data: {} } });

		const removeButton = screen.getByRole('button', { name: /remover/i });
		await fireEvent.click(removeButton);

		await waitFor(() => {
			expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível remover|não pôde ser removida/i);
		});

		expect(screen.getByText(`${water.type} ${water.variation}`)).toBeInTheDocument();
	});

	it('encerrar edição reflete o estado final da lista', async () => {
		const CollectionPage = (await import('../../../src/routes/colecao/+page.svelte')).default;

		mockCollectedItems.set([water, fire]);
		mockIsEditing.set(true);

		render(CollectionPage, { props: { data: {} } });

		const endButton = screen.getByRole('button', { name: /encerrar edição|concluir edição/i });
		await fireEvent.click(endButton);

		expect(get(mockIsEditing)).toBe(false);
		expect(screen.getByText(`${water.type} ${water.variation}`)).toBeInTheDocument();
		expect(screen.getByText(`${fire.type} ${fire.variation}`)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
	});
});

function get<T>(store: Writable<T>): T {
	let value: T;
	const unsubscribe = store.subscribe((v) => {
		value = v;
	});
	unsubscribe();
	return value!;
}
