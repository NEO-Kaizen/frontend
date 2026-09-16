<script lang="ts">
	import { onMount } from 'svelte';
	import { themeStyleVars } from '$lib/utils/theme';
	import { getThemeMode } from '$lib/states/theme.svelte';

	let { data, children } = $props();

	// As duas paletas (light/dark) entram como custom properties no wrapper; o
	// CSS estático escolhe qual vale conforme o atributo data-theme no elemento
	// raiz. Como o Svelte 5 não interpola expressões dentro do bloco de estilos,
	// o tema é aplicado via atributo `style`.
	const themeVars = $derived(themeStyleVars(data.portalConfig.theme));

	// O favicon é um `<link>` — o CSS não consegue trocá-lo, então alternamos via
	// JS conforme o tema. Antes do mount usa a variante clara (igual ao SSR), o
	// que evita mismatch de hidratação; depois o tema real é aplicado.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const faviconHref = $derived(
		mounted && getThemeMode() === 'dark'
			? data.portalConfig.assets.faviconDarkUrl
			: data.portalConfig.assets.faviconLightUrl
	);
</script>

<svelte:head>
	<link rel="icon" href={faviconHref} />
	<title>{data.portalConfig.platformName}</title>
</svelte:head>

<div class="app-root" style={themeVars}>
	{@render children()}
</div>

<style>
	@import '../lib/styles/global.css';
</style>
