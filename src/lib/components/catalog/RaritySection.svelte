<script lang="ts">
	import TypeGroup from './TypeGroup.svelte';
	import type { CatalogGroup } from '$lib/domain/catalog-group';
	import type { Rarity } from '$lib/domain/elemental';

	export let rarity: Rarity;
	export let groups: readonly CatalogGroup[];
</script>

<section aria-labelledby="rarity-{rarity}">
	<h2 id="rarity-{rarity}">{rarity}</h2>
	{#each groups as group (group.type)}
		<TypeGroup {group} />
	{/each}
</section>
