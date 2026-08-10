<script lang="ts">
	import { collectionStore } from '$lib/stores/collection';

	const status = collectionStore.status;
</script>

{#if $status === 'degraded'}
	<div role="alert" class="degraded-banner">
		<p>
			Modo degradado: o armazenamento local está indisponível. A marcação de posse
			está desabilitada.
		</p>
	</div>
{/if}
