<script lang="ts">
	import CollectionToggle from './CollectionToggle.svelte';
	import type { Elemental } from '$lib/domain/elemental';
	import type { Neighbors } from '$lib/domain/catalog-group';

	export let elemental: Elemental;
	export let neighbors: Neighbors;
</script>

<nav
	class="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"
	aria-label="Navegação entre elementais"
>
	<a
		href="/elemental/{neighbors.previousId}"
		class="btn btn-secondary order-2 sm:order-1"
		data-sveltekit-preload-data
		aria-label="Anterior: {neighbors.previousId}"
	>
		← Anterior
	</a>

	<div class="order-1 sm:order-2 sm:w-48">
		<CollectionToggle id={elemental.id} />
	</div>

	<a
		href="/elemental/{neighbors.nextId}"
		class="btn btn-secondary order-3"
		data-sveltekit-preload-data
		aria-label="Próximo: {neighbors.nextId}"
	>
		Próximo →
	</a>
</nav>
