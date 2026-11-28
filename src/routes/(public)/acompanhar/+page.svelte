<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import { notifyError } from '$lib/utils/feedback';
	import ProtocolSearchCard from './components/ProtocolSearchCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const searchedEmail = $derived(data.email);
	const isOwnerView = $derived(Boolean((data as { isOwnerView?: boolean }).isOwnerView));

	// `invalidate` não popula `navigating`; o estado local cobre o retry.
	let isRetrying = $state(false);
	const isFetching = $derived(navigating.to?.route?.id === page.route.id || isRetrying);
	const emptyMessage = $derived(
		isOwnerView
			? 'Você ainda não possui solicitações registradas.'
			: 'Confira o e-mail informado e tente novamente.'
	);

	async function retryRequests() {
		if (isRetrying) return;

		isRetrying = true;

		try {
			await invalidate('app:requests');
		} catch {
			notifyError('Não foi possível recarregar as solicitações. Tente novamente.');
		} finally {
			isRetrying = false;
		}
	}

	function goToPage(pagina: number) {
		const searchParams = new SvelteURLSearchParams();

		if (!isOwnerView && searchedEmail) {
			searchParams.set('email', searchedEmail);
		}

		if (pagina > 1) {
			searchParams.set('page', String(pagina));
		}

		const query = searchParams.toString();

		// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
		// a navegação é validada em runtime pelo SvelteKit.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${resolve('/(public)/acompanhar')}${query ? `?${query}` : ''}`, {
			keepFocus: true,
			invalidateAll: true,
			replaceState: true
		}).catch(() => notifyError('Não foi possível carregar a página. Tente novamente.'));
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

	<ProtocolSearchCard {isOwnerView} />

	<div style="margin-top: var(--spacing-xl);">
		<SolicitationTable
			page={data.page}
			result={data.result}
			{isFetching}
			{emptyMessage}
			onretry={() => void retryRequests()}
			onpagechange={goToPage}
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
