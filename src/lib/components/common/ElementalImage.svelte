<script lang="ts">
	export let src: string;
	export let alt: string;

	let currentSrc = src;

	function handleError() {
		const fallback =
			'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
		if (currentSrc !== fallback) {
			currentSrc = fallback;
		}
	}

	$: currentSrc = src;
</script>

<img src={currentSrc} {alt} loading="lazy" on:error={handleError} />
