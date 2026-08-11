<script lang="ts">
	import ElementalImage from '$lib/components/common/ElementalImage.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let elemental: Elemental;

	$: displayName = `${elemental.type} ${elemental.variation}`;
</script>

<article class="card-featured overflow-hidden">
	<header class="p-6 md:p-8">
		<h1 class="text-3xl font-semibold tracking-tight text-near-white md:text-4xl">
			{displayName}
		</h1>
		<p class="mt-2 flex items-center gap-2 text-base text-silver">
			<span class="rounded-pill border border-frost bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-near-white">
				{elemental.rarity}
			</span>
			<span class="text-dark-gray">·</span>
			<span>{elemental.variation}</span>
		</p>
	</header>

	<figure class="w-full overflow-hidden bg-surface">
		<ElementalImage src={elemental.imagePath} alt={displayName} fit="contain" height="auto" />
	</figure>
</article>
