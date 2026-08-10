<script lang="ts">
	import LocalStorageNotice from '$lib/components/common/LocalStorageNotice.svelte';
	import DegradedBanner from '$lib/components/common/DegradedBanner.svelte';
	import RaritySection from '$lib/components/catalog/RaritySection.svelte';
	import type { CatalogGroup } from '$lib/domain/catalog-group';
	import type { Rarity } from '$lib/domain/elemental';

	export let data: {
		groups?: readonly CatalogGroup[];
		error?: string;
	};

	function groupByRarity(groups: readonly CatalogGroup[]): Map<Rarity, CatalogGroup[]> {
		const map = new Map<Rarity, CatalogGroup[]>();
		for (const group of groups) {
			if (!map.has(group.rarity)) {
				map.set(group.rarity, []);
			}
			map.get(group.rarity)!.push(group);
		}
		return map;
	}

	$: sections = data.groups ? groupByRarity(data.groups) : new Map<Rarity, CatalogGroup[]>();
</script>

<main>
	<LocalStorageNotice />
	<DegradedBanner />

	{#if data.error === 'integrity'}
		<p role="alert" class="integrity-error">
			Erro de integridade: não foi possível carregar o catálogo.
		</p>
	{:else}
		{#each sections.entries() as [rarity, groups] (rarity)}
			<RaritySection {rarity} {groups} />
		{/each}
	{/if}
</main>
