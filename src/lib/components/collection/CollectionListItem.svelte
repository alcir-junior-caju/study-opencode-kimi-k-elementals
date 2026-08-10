<script lang="ts">
	import ElementalImage from '$lib/components/common/ElementalImage.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let elemental: Elemental;
	export let isEditing = false;

	$: displayName = `${elemental.type} ${elemental.variation}`;
</script>

<li class="collection-list-item">
	<ElementalImage src={elemental.imagePath} alt={displayName} />
	<div class="item-info">
		<h3>{displayName}</h3>
		<p class="item-meta">
			<span class="rarity">{elemental.rarity}</span>
			<span class="variation">{elemental.variation}</span>
		</p>
	</div>
	<span class="collected-check" aria-label="coletado">✓</span>
	{#if isEditing}
		<slot name="actions" />
	{/if}
</li>
