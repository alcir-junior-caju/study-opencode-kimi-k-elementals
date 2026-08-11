<script lang="ts">
	import { collectionStore } from '$lib/stores/collection';
	import { collectedItemsStore } from '$lib/stores/collected-items';
	import CollectionListItem from '$lib/components/collection/CollectionListItem.svelte';
	import EmptyCollection from '$lib/components/collection/EmptyCollection.svelte';
	import EditCollectionBar from '$lib/components/collection/EditCollectionBar.svelte';

	export let data: {
		degraded?: boolean;
	};

	const status = collectionStore.status;
	const collectedItems = collectedItemsStore.collectedItems;
	const isEditing = collectedItemsStore.isEditing;

	$: degraded = data.degraded === true || $status === 'degraded';
	$: items = $collectedItems;

	let removeError = '';

	async function handleRemove(id: string) {
		removeError = '';
		try {
			await collectedItemsStore.remove(id);
		} catch {
			removeError = 'Não foi possível remover o item. Tente novamente.';
		}
	}
</script>

<svelte:head>
	<title>Minha coleção — Diário de Coleção Elementais</title>
</svelte:head>

<main class="mx-auto w-full max-w-[1136px] flex-1 px-4 py-8 md:px-6 md:py-12">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-12">
		<div>
			<h1 class="text-4xl font-semibold tracking-tight text-near-white md:text-5xl">
				Minha coleção
			</h1>
			<p class="mt-2 text-base text-silver">
				Gerencie os elementais que você já colecionou.
			</p>
		</div>

		{#if !degraded}
			<EditCollectionBar />
		{/if}
	</div>

	{#if removeError}
		<div role="alert" class="mb-6 rounded-card border border-frost bg-surface p-4 text-silver">
			<p>{removeError}</p>
		</div>
	{/if}

	{#if degraded}
		<div
			role="alert"
			class="rounded-card border border-accent-orange bg-accent-orange-subtle px-4 py-3 text-sm font-medium text-accent-orange"
		>
			<p>
				Não foi possível carregar sua coleção. O armazenamento local está indisponível.
			</p>
		</div>
	{:else if items.length === 0}
		<EmptyCollection />
	{:else}
		<ul class="flex flex-col gap-3">
			{#each items as item (item.id)}
				<CollectionListItem
					elemental={item}
					isEditing={$isEditing}
					onRemove={() => handleRemove(item.id)}
				/>
			{/each}
		</ul>
	{/if}
</main>
