<script lang="ts">
	import { browser } from '$app/environment';
	import { collectionStore } from '$lib/stores/collection';
	import Header from '$lib/components/common/Header.svelte';
	import '../app.css';

	if (browser) {
		collectionStore.hydrate();
	}
</script>

<div class="flex min-h-screen flex-col bg-void-black">
	<Header />
	<slot />

	<footer class="mt-auto border-t border-frost bg-void-black text-near-white">
		<div class="mx-auto max-w-[1136px] px-4 py-10 md:px-6">
			<p class="text-sm font-semibold">Diário de Coleção Elementais</p>
			<p class="mt-2 text-sm text-silver">
				Sua coleção é salva localmente no navegador.
			</p>
		</div>
	</footer>
</div>
