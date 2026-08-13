<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<Header />
{@render children()}
