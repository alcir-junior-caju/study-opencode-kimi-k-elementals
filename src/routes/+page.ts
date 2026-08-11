import { catalog, CatalogIntegrityError } from '$lib/catalog';
import type { Elemental } from '$lib/domain/elemental';
import type { PageLoad } from './$types';

function compareByName(a: Elemental, b: Elemental): number {
	const nameA = `${a.type} ${a.variation}`;
	const nameB = `${b.type} ${b.variation}`;
	return nameA.localeCompare(nameB, 'pt-BR');
}

export const load: PageLoad = () => {
	try {
		return { items: [...catalog.getAll()].sort(compareByName) };
	} catch (error) {
		if (error instanceof CatalogIntegrityError) {
			return {
				error: 'integrity'
			};
		}
		throw error;
	}
};
