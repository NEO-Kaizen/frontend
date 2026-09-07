<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import ProtocolSearchCard from './components/ProtocolSearchCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const emailBuscado = $derived(data.email);

	// Navegação pendente para a própria rota: estado de carregamento da tabela.
	const isFetching = $derived(navigating.to?.route?.id === page.route.id);

	function irParaPagina(pagina: number) {
		const searchParams = new SvelteURLSearchParams();

		if (emailBuscado) {
			searchParams.set('email', emailBuscado);
		}

		if (pagina > 1) {
			searchParams.set('page', String(pagina));
		}

		const query = searchParams.toString();

		// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
		// a navegação é validada em runtime pelo SvelteKit.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${resolve('/(public)/acompanhar')}?${query}`, {
			keepFocus: true,
			invalidateAll: true
		});
	}
</script>

<svelte:head>
	<title>Acompanhar Solicitações - {data.portalConfig.platformName}</title>
</svelte:head>

<main class="content-container">
	<div class="header-acompanhar">
		<h1>Acompanhar Solicitações</h1>
		<p>Consulte em tempo real os status da sua demanda institucional.</p>
	</div>

	<ProtocolSearchCard />

	<div style="margin-top: var(--spacing-xl);">
		<SolicitationTable
			page={data.page}
			resultado={data.resultado}
			{isFetching}
			onpagechange={irParaPagina}
		/>
	</div>
</main>

<style>
	.header-acompanhar {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	.header-acompanhar p {
		margin: 0;
		color: var(--gray);
	}
</style>
