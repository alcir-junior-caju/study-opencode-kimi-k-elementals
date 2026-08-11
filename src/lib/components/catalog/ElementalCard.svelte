<script lang="ts">
	import { base } from '$app/paths';
	import { collectionStore } from '$lib/stores/collection';
	import ElementalImage from '$lib/components/common/ElementalImage.svelte';
	import CollectionToggle from '$lib/components/elemental/CollectionToggle.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let elemental: Elemental;

	$: displayName = `${elemental.type} ${elemental.variation}`;
	$: isCollected = collectionStore.has(elemental.id);
</script>

<div
	class="card group flex flex-col overflow-hidden transition-colors hover:border-frost hover:bg-surface-hover"
	data-testid="elemental-card"
>
	<a href="{base}/elemental/{elemental.id}" class="block flex-1">
		<div class="relative aspect-square overflow-hidden bg-surface">
			<ElementalImage src={elemental.imagePath} alt={displayName} />
			{#if $isCollected}
				<span
					class="collected-indicator absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-green text-xs text-void-black"
					aria-label="coletado"
				>
					✓
				</span>
			{/if}
		</div>
		<div class="p-3">
			<p class="text-sm font-semibold text-near-white">{displayName}</p>
			<p class="text-xs text-silver">{elemental.rarity}</p>
		</div>
	</a>
	<div class="px-3 pb-3">
		<CollectionToggle id={elemental.id} />
	</div>
</div>
