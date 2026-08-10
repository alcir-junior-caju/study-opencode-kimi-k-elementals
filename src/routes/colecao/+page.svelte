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

<main class="collection-page">
	<h1>Minha coleção</h1>

	{#if !degraded}
		<EditCollectionBar />
	{/if}

	{#if removeError}
		<div role="alert" class="remove-error">
			<p>{removeError}</p>
		</div>
	{/if}

	{#if degraded}
		<div role="alert" class="degraded-message">
			<p>
				Não foi possível carregar sua coleção. O armazenamento local está indisponível.
			</p>
		</div>
	{:else if items.length === 0}
		<EmptyCollection />
	{:else}
		<ul class="collection-list">
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
