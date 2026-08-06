<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/header.svelte';

	let { children } = $props();
</script>
<style>
	@import '../lib/styles/global.css';
</style>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<Header />
	<main class="app-content">{@render children()}</main>
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
	}
	/* reserve space for the fixed sidebar on tablet/mobile */
	.app-content {
		flex: 1;
		min-width: 0;
	}
</style>