<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>
<style>
	@import '../lib/styles/global.css';
</style>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
