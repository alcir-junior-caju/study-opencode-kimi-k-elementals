/**
 * T033 — Testes da rota individual.
 */

import { catalog } from '$lib/catalog';

describe('Elemental page route', () => {
	it('entries retorna exatamente os 117 IDs do seed', async () => {
		const { entries } = await import('../../../src/routes/elemental/[id]/+page.ts');

		expect(entries()).toHaveLength(117);
		expect(entries()).toEqual(catalog.getAll().map((e) => ({ id: e.id })));
	});

	it('load com ID válido retorna elemental e neighbors', async () => {
		const { load } = await import('../../../src/routes/elemental/[id]/+page.ts');

		const result = load({ params: { id: 'water_basic' } } as never);

		expect(result).toEqual({
			elemental: catalog.getById('water_basic'),
			neighbors: catalog.getNeighbors('water_basic')
		});
	});

	it('load com ID inexistente dispara redirect(307, /)', async () => {
		const { load } = await import('../../../src/routes/elemental/[id]/+page.ts');

		expect(() => load({ params: { id: 'unknown_id' } } as never)).toThrow(
			expect.objectContaining({ status: 307, location: '/' })
		);
	});
});
