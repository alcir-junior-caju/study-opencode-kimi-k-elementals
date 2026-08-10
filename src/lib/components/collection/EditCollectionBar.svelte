<script lang="ts">
	import { collectedItemsStore } from '$lib/stores/collected-items';

	const isEditing = collectedItemsStore.isEditing;

	function toggleEdit() {
		isEditing.update((value) => !value);
	}
</script>

<div class="edit-collection-bar">
	{#if $isEditing}
		<button type="button" on:click={toggleEdit}>Encerrar edição</button>
	{:else}
		<button type="button" on:click={toggleEdit}>Editar coleção</button>
	{/if}
</div>
