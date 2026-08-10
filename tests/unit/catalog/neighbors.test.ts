/**
 * T031 — Testes de navegação circular (getNeighbors).
 */

import { catalog } from '$lib/catalog';

describe('Catalog neighbors', () => {
	const all = catalog.getAll();
	const firstId = all[0].id;
	const lastId = all[all.length - 1].id;

	it('getNeighbors retorna previousId, nextId, position e total conforme a sequência canônica', () => {
		const neighbors = catalog.getNeighbors(all[5].id);

		expect(neighbors).toBeDefined();
		expect(neighbors!.previousId).toBe(all[4].id);
		expect(neighbors!.nextId).toBe(all[6].id);
		expect(neighbors!.position).toBe(5);
		expect(neighbors!.total).toBe(117);
	});

	it('primeiro item tem previousId igual ao último (wrap-around)', () => {
		const neighbors = catalog.getNeighbors(firstId);

		expect(neighbors).toBeDefined();
		expect(neighbors!.previousId).toBe(lastId);
		expect(neighbors!.nextId).toBe(all[1].id);
		expect(neighbors!.position).toBe(0);
	});

	it('último item tem nextId igual ao primeiro (wrap-around)', () => {
		const neighbors = catalog.getNeighbors(lastId);

		expect(neighbors).toBeDefined();
		expect(neighbors!.previousId).toBe(all[all.length - 2].id);
		expect(neighbors!.nextId).toBe(firstId);
		expect(neighbors!.position).toBe(116);
	});

	it('ID inexistente retorna undefined', () => {
		expect(catalog.getNeighbors('unknown_id')).toBeUndefined();
	});
});
