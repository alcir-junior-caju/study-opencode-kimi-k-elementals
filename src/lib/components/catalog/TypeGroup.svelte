<script lang="ts">
	import ElementalCard from './ElementalCard.svelte';
	import type { CatalogGroup } from '$lib/domain/catalog-group';

	export let group: CatalogGroup;
</script>

<div class="type-group">
	<h3>{group.type}</h3>
	<ul>
		{#each group.items as item (item.id)}
			<li>
				<ElementalCard elemental={item} />
			</li>
		{/each}
	</ul>
</div>
