<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} — Diário de Coleção Elementais</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-[1136px] flex-1 flex-col items-center justify-center px-4 py-20 text-center md:px-6">
	<h1 class="text-6xl font-semibold tracking-tight text-near-white md:text-8xl">
		{$page.status}
	</h1>
	<p class="mt-4 text-lg text-silver">
		{$page.error?.message ?? 'Página não encontrada.'}
	</p>
	<a href="/" class="btn btn-primary mt-8">Voltar ao catálogo</a>
</main>
