<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	let { children } = $props();
</script>

<Header />

{@render children()}

<Footer />