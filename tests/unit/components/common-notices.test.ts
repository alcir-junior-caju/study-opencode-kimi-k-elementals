/**
 * T016 — Testes dos avisos comuns.
 */

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CollectionStatus } from '$lib/stores/collection';

let mockStatus: Writable<CollectionStatus> = writable('active');
const falseStore = {
	subscribe: (fn: (value: boolean) => void) => {
		fn(false);
		return () => {};
	},
	set: () => {},
	update: () => {}
};

jest.unstable_mockModule('$lib/stores/collection', () => {
	return {
		collectionStore: {
			status: mockStatus,
			hydrate: jest.fn(),
			toggle: jest.fn(),
			has: jest.fn(() => falseStore)
		}
	};
});

describe('Common notices', () => {
	beforeEach(() => {
		mockStatus.set('active');
	});

	it('LocalStorageNotice renderiza o aviso permanente de persistência local', async () => {
		const LocalStorageNotice = (await import('$lib/components/common/LocalStorageNotice.svelte'))
			.default;

		render(LocalStorageNotice);

		expect(
			screen.getByText(/coleção é local e será perdida ao limpar os dados do navegador/i)
		).toBeInTheDocument();
	});

	it('DegradedBanner exibe o aviso de modo degradado quando status = degraded', async () => {
		mockStatus.set('degraded');

		const DegradedBanner = (await import('$lib/components/common/DegradedBanner.svelte')).default;

		render(DegradedBanner);

		expect(
			screen.getByText(/armazenamento indisponível|modo degradado|marcação desabilitada/i)
		).toBeInTheDocument();
	});

	it('DegradedBanner permanece oculto quando status não é degraded', async () => {
		mockStatus.set('active');

		const DegradedBanner = (await import('$lib/components/common/DegradedBanner.svelte')).default;

		const { container } = render(DegradedBanner);

		expect(container.firstElementChild).toBeNull();
	});
});
