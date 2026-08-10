<script lang="ts">
	import { collectionStore } from '$lib/stores/collection';

	export let id: string;

	$: isCollected = collectionStore.has(id);
	$: status = collectionStore.status;
	$: disabled = $status === 'degraded';

	let errorMessage = '';

	async function handleClick() {
		errorMessage = '';
		try {
			await collectionStore.toggle(id);
		} catch {
			errorMessage = 'A seleção não foi salva. Tente novamente.';
		}
	}
</script>

<button
	type="button"
	class="collection-toggle"
	class:collected={$isCollected}
	aria-pressed={$isCollected ? 'true' : 'false'}
	aria-label={$isCollected ? 'Remover da coleção' : 'Adicionar à coleção'}
	{disabled}
	on:click={handleClick}
>
	<span aria-hidden="true">{$isCollected ? '✓' : '+'}</span>
	<span class="toggle-label">{$isCollected ? 'Colecionado' : 'Colecionar'}</span>
</button>

{#if errorMessage}
	<div role="alert" aria-live="polite" class="toggle-error">{errorMessage}</div>
{/if}
