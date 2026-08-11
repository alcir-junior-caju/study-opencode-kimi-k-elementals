<script lang="ts">
	import { base } from '$app/paths';
	import ElementalImage from '$lib/components/common/ElementalImage.svelte';
	import type { Elemental } from '$lib/domain/elemental';

	export let elemental: Elemental;
	export let isEditing = false;
	export let onRemove: (() => void) | undefined = undefined;

	$: displayName = `${elemental.type} ${elemental.variation}`;
</script>

<li
	class="collection-list-item card flex items-center gap-4 overflow-hidden p-3 transition-colors hover:border-frost hover:bg-surface-hover"
>
	<a href="{base}/elemental/{elemental.id}" class="flex flex-1 items-center gap-4">
		<div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-card bg-surface">
			<ElementalImage src={elemental.imagePath} alt={displayName} />
		</div>
		<div class="min-w-0 flex-1">
			<h3 class="truncate text-base font-semibold text-near-white">{displayName}</h3>
			<p class="text-sm text-silver">
				<span>{elemental.rarity}</span>
				<span class="mx-1 text-dark-gray">·</span>
				<span>{elemental.variation}</span>
			</p>
		</div>
	</a>

	<div class="flex items-center gap-3">
		<span
			class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-green text-sm text-void-black"
			aria-label="coletado"
		>
			✓
		</span>
		{#if isEditing && onRemove}
			<button type="button" class="remove-button btn btn-secondary text-sm" on:click={onRemove}>
				Remover
			</button>
		{/if}
	</div>
</li>
