<script lang="ts">
	import Footer from '$lib/components/layout/Footer.svelte';

	let { children } = $props();
</script>

{@render children()}

<Footer />
