import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { catalog } from '$lib/catalog';

export function entries(): Array<{ id: string }> {
	return catalog.getAll().map((elemental) => ({ id: elemental.id }));
}

export const load: PageLoad = ({ params }) => {
	const elemental = catalog.getById(params.id);

	if (!elemental) {
		redirect(307, '/');
	}

	const neighbors = catalog.getNeighbors(params.id)!;

	return { elemental, neighbors };
};
