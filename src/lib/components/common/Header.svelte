<script lang="ts">
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;
</script>

<header class="sticky top-0 z-50 border-b border-frost bg-void-black/95 backdrop-blur-sm">
	<div class="mx-auto flex max-w-[1136px] items-center justify-between px-4 py-4 md:px-6">
		<a href="/" class="text-xl font-semibold tracking-tight text-near-white">Diário Elementais</a>

		<nav aria-label="Navegação principal">
			<ul class="flex items-center gap-2">
				<li>
					<a
						href="/"
						class="rounded-pill border px-4 py-2 text-sm font-medium text-near-white transition-all"
						class:border-frost={currentPath !== '/'}
						class:bg-transparent={currentPath !== '/'}
						class:hover:bg-glass-hover={currentPath !== '/'}
						class:active:bg-surface-hover={currentPath !== '/'}
						class:border-near-white={currentPath === '/'}
						class:bg-glass-hover={currentPath === '/'}
						class:hover:bg-surface-hover={currentPath === '/'}
					>
						Catálogo
					</a>
				</li>
				<li>
					<a
						href="/colecao"
						class="rounded-pill border px-4 py-2 text-sm font-medium text-near-white transition-all"
						class:border-frost={currentPath !== '/colecao'}
						class:bg-transparent={currentPath !== '/colecao'}
						class:hover:bg-glass-hover={currentPath !== '/colecao'}
						class:active:bg-surface-hover={currentPath !== '/colecao'}
						class:border-near-white={currentPath === '/colecao'}
						class:bg-glass-hover={currentPath === '/colecao'}
						class:hover:bg-surface-hover={currentPath === '/colecao'}
					>
						Coleção
					</a>
				</li>
			</ul>
		</nav>
	</div>
</header>
