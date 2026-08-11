<script lang="ts">
	import { collectedItemsStore } from '$lib/stores/collected-items';

	const isEditing = collectedItemsStore.isEditing;

	function toggleEdit() {
		isEditing.update((value) => !value);
	}
</script>

{#if $isEditing}
	<button
		type="button"
		class="btn border-accent-orange bg-accent-orange-subtle text-accent-orange hover:bg-accent-orange-hover"
		on:click={toggleEdit}
	>
		Encerrar edição
	</button>
{:else}
	<button type="button" class="btn btn-primary" on:click={toggleEdit}>
		Editar coleção
	</button>
{/if}
