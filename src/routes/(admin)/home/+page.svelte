<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Banner from '$lib/components/layout/Banner.svelte';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import { listQueueRequests } from '$lib/services/request.service';
	import type { QueueResponse } from '$lib/types/queue';
	import type { Result } from '$lib/types/result';

	const pageSize = 10;

	let currentPage = $state<number>(1);
	let loading = $state<boolean>(true);
	let tableResult = $state<Result<QueueResponse> | null>(null);
	let requestToken = 0;

	let user = $derived(page.data.user);
	let userName = $derived(user?.name ?? 'Usuário');
	let bannerDescription = $derived.by(() => {
		if (tableResult === null) {
			return 'Carregando solicitações sem responsável…';
		}

		if (!tableResult.ok) {
			return 'Não foi possível carregar o total de solicitações sem responsável.';
		}

		const total = tableResult.data.total;

		return `Há ${total} ${total === 1 ? 'solicitação' : 'solicitações'} sem responsável.`;
	});

	async function fetchTable(pageNumber: number) {
		const token = ++requestToken;

		loading = true;
		currentPage = pageNumber;

		const result = await listQueueRequests({
			page: pageNumber,
			pageSize,
			assigneeId: 'unassigned'
		});

		if (token !== requestToken) {
			return;
		}

		tableResult = result;
		loading = false;
	}

	function handlePageChange(newPage: number) {
		void fetchTable(newPage);
	}

	onMount(() => {
		void fetchTable(1);
	});
</script>

<svelte:head>
	<title>Home Administrativa - MAAT</title>
</svelte:head>

<div class="content-container dashboard">
	<Banner titulo={`Bem-vindo de volta, ${userName}`} descricao={bannerDescription} />

	<section class="table-section">
		<h2>Solicitações sem responsável</h2>

		<SolicitationTable
			page={currentPage}
			result={tableResult}
			isFetching={loading}
			detailRoute="/(admin)/fila/[protocolo]"
			emptyTitle="Nenhuma solicitação sem responsável"
			emptyMessage="Não há solicitações pendentes de atribuição no momento."
			onretry={() => fetchTable(currentPage)}
			onpagechange={handlePageChange}
		/>
	</section>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		width: 100%;
		padding-bottom: var(--spacing-xl);
	}

	.table-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.table-section h2 {
		font: var(--h3);
		color: var(--rich-black);
		margin: 0;
	}
</style>
