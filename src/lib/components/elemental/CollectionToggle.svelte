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
	class="btn collection-toggle w-full"
	class:btn-primary={!$isCollected}
	class:border-accent-green={$isCollected}
	class:bg-accent-green-subtle={$isCollected}
	class:text-accent-green={$isCollected}
	class:hover:bg-accent-green-hover={$isCollected}
	class:opacity-50={disabled}
	class:cursor-not-allowed={disabled}
	aria-pressed={$isCollected ? 'true' : 'false'}
	aria-label={$isCollected ? 'Remover da coleção' : 'Adicionar à coleção'}
	{disabled}
	on:click={handleClick}
>
	<span aria-hidden="true">{$isCollected ? '✓' : '+'}</span>
	<span>{$isCollected ? 'Colecionado' : 'Colecionar'}</span>
</button>

{#if errorMessage}
	<div role="alert" aria-live="polite" class="mt-2 text-xs text-silver">{errorMessage}</div>
{/if}
