<script lang="ts">
	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={data.portalConfig.assets.faviconUrl} />
	<title>{data.portalConfig.platformName}</title>
</svelte:head>

<!-- Tokens do tema aplicados via wrapper (Svelte 5 não interpola `{expr}` em <style>). -->
<div
	class="app-root"
	style:--primary-color={data.portalConfig.theme.light.primary}
	style:--secondary-color={data.portalConfig.theme.light.secondary}
	style:--background-color={data.portalConfig.theme.light.background}
>
	{@render children()}
</div>

<style>
	@import '../lib/styles/global.css';
</style>
