<script lang="ts">
	import { collectionStore } from '$lib/stores/collection';

	const status = collectionStore.status;
</script>

{#if $status === 'degraded'}
	<div
		role="alert"
		class="mb-6 rounded-card border border-accent-orange bg-accent-orange-subtle px-4 py-3 text-sm font-medium text-accent-orange"
	>
		<p>
			Modo degradado: o armazenamento local está indisponível. A marcação de posse
			está desabilitada.
		</p>
	</div>
{/if}
