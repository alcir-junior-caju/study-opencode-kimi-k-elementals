<script lang="ts">
	import { collectionStore } from '$lib/stores/collection';
	import ElementalImage from '$lib/components/common/ElementalImage.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let elemental: Elemental;

	$: displayName = `${elemental.type} ${elemental.variation}`;
	$: isCollected = collectionStore.has(elemental.id);
</script>

<a href="/elemental/{elemental.id}" class="elemental-card" data-testid="elemental-card">
	<ElementalImage src={elemental.imagePath} alt={displayName} />
	<p class="elemental-name">{displayName}</p>
	{#if $isCollected}
		<span class="collected-indicator" aria-label="coletado">✓</span>
	{/if}
</a>
