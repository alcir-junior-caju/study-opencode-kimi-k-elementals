import { catalog, CatalogIntegrityError } from '$lib/catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	try {
		return {
			groups: catalog.groupedByRarityAndType()
		};
	} catch (error) {
		if (error instanceof CatalogIntegrityError) {
			return {
				error: 'integrity'
			};
		}
		throw error;
	}
};
