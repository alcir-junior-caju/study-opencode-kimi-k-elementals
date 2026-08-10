<script lang="ts">
	import { collectionStore } from '$lib/stores/collection';
	import ElementalImage from '$lib/components/common/ElementalImage.svelte';
	import CollectionToggle from '$lib/components/elemental/CollectionToggle.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let elemental: Elemental;

	$: displayName = `${elemental.type} ${elemental.variation}`;
	$: isCollected = collectionStore.has(elemental.id);
</script>

<div class="elemental-card" data-testid="elemental-card">
	<a href="/elemental/{elemental.id}" class="elemental-card-link">
		<ElementalImage src={elemental.imagePath} alt={displayName} />
		<p class="elemental-name">{displayName}</p>
		{#if $isCollected}
			<span class="collected-indicator" aria-label="coletado">✓</span>
		{/if}
	</a>
	<CollectionToggle id={elemental.id} />
</div>
