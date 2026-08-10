<script lang="ts">
	import ElementalImage from '$lib/components/common/ElementalImage.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let elemental: Elemental;

	$: displayName = `${elemental.type} ${elemental.variation}`;
</script>

<article class="elemental-detail">
	<header>
		<h1>{displayName}</h1>
		<p class="elemental-meta">
			<span class="rarity">{elemental.rarity}</span>
			<span class="variation">{elemental.variation}</span>
		</p>
	</header>

	<figure class="elemental-image-wrapper">
		<ElementalImage src={elemental.imagePath} alt={displayName} />
	</figure>
</article>
