<script lang="ts">
	import { browser } from '$app/environment';
	import { collectionStore } from '$lib/stores/collection';

	if (browser) {
		collectionStore.hydrate();
	}
</script>

<slot />
