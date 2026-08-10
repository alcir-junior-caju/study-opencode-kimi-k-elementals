<script lang="ts">
	import ElementalDetail from '$lib/components/elemental/ElementalDetail.svelte';
	import CircularNav from '$lib/components/elemental/CircularNav.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.elemental.type} {data.elemental.variation} — Diário de Coleção Elementais</title>
</svelte:head>

<main class="elemental-page">
	<ElementalDetail elemental={data.elemental} />
	<CircularNav elemental={data.elemental} neighbors={data.neighbors} />
</main>
