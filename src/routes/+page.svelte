<script lang="ts">
	import LocalStorageNotice from '$lib/components/common/LocalStorageNotice.svelte';
	import DegradedBanner from '$lib/components/common/DegradedBanner.svelte';
	import ElementalCard from '$lib/components/catalog/ElementalCard.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let data: {
		items?: readonly Elemental[];
		error?: string;
	};
</script>

<main class="mx-auto w-full max-w-[1136px] flex-1 px-4 py-8 md:px-6 md:py-12">
	<LocalStorageNotice />
	<DegradedBanner />

	{#if data.error === 'integrity'}
		<p
			role="alert"
			class="rounded-card border border-frost bg-surface p-6 text-center text-silver"
		>
			Erro de integridade: não foi possível carregar o catálogo.
		</p>
	{:else}
		<div class="mb-8 md:mb-12">
			<h1 class="text-4xl font-semibold tracking-tight text-near-white md:text-5xl">
				Catálogo de Elementais
			</h1>
			<p class="mt-2 text-base text-silver">
				Explore a coleção completa e marque os que você já possui.
			</p>
		</div>

		<ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each data.items ?? [] as item (item.id)}
				<li>
					<ElementalCard elemental={item} />
				</li>
			{/each}
		</ul>
	{/if}
</main>
