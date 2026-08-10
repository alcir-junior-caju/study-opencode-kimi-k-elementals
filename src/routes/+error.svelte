<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} — Diário de Coleção Elementais</title>
</svelte:head>

<main class="error-page">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message ?? 'Página não encontrada.'}</p>
	<a href="/">Voltar ao catálogo</a>
</main>
