<script lang="ts">
	import ElementalDetail from '$lib/components/elemental/ElementalDetail.svelte';
	import CircularNav from '$lib/components/elemental/CircularNav.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.elemental.type} {data.elemental.variation} — Diário de Coleção Elementais</title>
</svelte:head>

<main class="mx-auto w-full max-w-[1136px] flex-1 px-4 py-8 md:px-6 md:py-12">
	<ElementalDetail elemental={data.elemental} />
	<CircularNav elemental={data.elemental} neighbors={data.neighbors} />
</main>
