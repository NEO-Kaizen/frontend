<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	let { children } = $props();

	const queuePath = resolve('/(admin)/fila');

	async function handleQueueSearch(value: string) {
		const searchParams = new URLSearchParams({
			search: value
		});

		// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
		// a navegação é validada em runtime pelo SvelteKit.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`${queuePath}?${searchParams.toString()}`);
	}
</script>

<Header onSearch={page.url.pathname === queuePath ? handleQueueSearch : undefined} />

{@render children()}

<Footer />
