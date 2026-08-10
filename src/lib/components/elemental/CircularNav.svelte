<script lang="ts">
	import CollectionToggle from './CollectionToggle.svelte';
	import type { Elemental } from '$lib/domain/elemental';
	import type { Neighbors } from '$lib/domain/catalog-group';

	export let elemental: Elemental;
	export let neighbors: Neighbors;
</script>

<nav class="circular-nav" aria-label="Navegação entre elementais">
	<a
		href="/elemental/{neighbors.previousId}"
		class="nav-link nav-link--previous"
		data-sveltekit-preload-data
		aria-label="Anterior: {neighbors.previousId}"
	>
		← Anterior
	</a>

	<CollectionToggle id={elemental.id} />

	<a
		href="/elemental/{neighbors.nextId}"
		class="nav-link nav-link--next"
		data-sveltekit-preload-data
		aria-label="Próximo: {neighbors.nextId}"
	>
		Próximo →
	</a>
</nav>
