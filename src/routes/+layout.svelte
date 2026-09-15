<script lang="ts">
	import { themeStyleVars } from '$lib/utils/theme';

	let { data, children } = $props();

	// As duas paletas (light/dark) entram como custom properties no wrapper; o
	// CSS estático escolhe qual vale conforme o atributo data-theme no elemento
	// raiz. Como o Svelte 5 não interpola expressões dentro do bloco de estilos,
	// o tema é aplicado via atributo `style`.
	const themeVars = $derived(themeStyleVars(data.portalConfig.theme));
</script>

<svelte:head>
	<link rel="icon" href={data.portalConfig.assets.faviconUrl} />
	<title>{data.portalConfig.platformName}</title>
</svelte:head>

<div class="app-root" style={themeVars}>
	{@render children()}
</div>

<style>
	@import '../lib/styles/global.css';
</style>
