<script lang="ts">
	export let src: string;
	export let alt: string;
	export let fit: 'cover' | 'contain' = 'cover';
	export let height: 'full' | 'auto' = 'full';

	let currentSrc = src;

	function normalizeSrc(value: string): string {
		if (value.startsWith('/') || value.startsWith('data:') || value.startsWith('http')) {
			return value;
		}
		return `/${value}`;
	}

	function handleError() {
		const fallback =
			'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
		if (currentSrc !== fallback) {
			currentSrc = fallback;
		}
	}

	$: currentSrc = normalizeSrc(src);
</script>

<img
	src={currentSrc}
	{alt}
	loading="lazy"
	on:error={handleError}
	class="w-full object-{fit} {height === 'full' ? 'h-full' : 'h-auto'}"
/>
