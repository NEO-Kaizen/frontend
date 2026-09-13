<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Banner from '$lib/components/layout/Banner.svelte';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import { listQueue } from '$lib/api/request.api';
	import type { QueueResponse } from '$lib/types/queue';
	import type { Result } from '$lib/types/result';

	let currentPage = $state<number>(1);
	let pageSize = $state<number>(10);
	let loading = $state<boolean>(true);
	let assignedCount = $state<number>(0);
	let tableResult = $state<Result<QueueResponse> | null>(null);

	let user = $derived(page.data.user);
	let userName = $derived(user?.name ?? 'Usuário');

	async function fetchDashboardData(pageNumber = 1) {
		loading = true;
		currentPage = pageNumber;

		try {
			const data = await listQueue({
				page: pageNumber,
				pageSize,
				assigneeId: 'unassigned'
			});

			tableResult = {
				ok: true,
				data
			};
		} catch (error) {
			tableResult = {
				ok: false,
				error: {
					message: error instanceof Error ? error.message : 'Erro ao carregar solicitações da fila.'
				}
			};
		} finally {
			loading = false;
		}
	}

	function handlePageChange(newPage: number) {
		fetchDashboardData(newPage);
	}

	onMount(() => {
		fetchDashboardData(1);
	});
</script>

<svelte:head>
	<title>Home Administrativa - MAAT</title>
</svelte:head>

<div class="content-container dashboard">
	<Banner
		titulo={`Bem-vindo de volta, ${userName}`}
		descricao={`Você possui ${assignedCount} solicitações das quais você está como responsável.`}
	/>

	<section class="table-section">
		<h2>Solicitações sem responsável</h2>

		<SolicitationTable
			page={currentPage}
			result={tableResult}
			isFetching={loading}
			detailRoute="/(admin)/fila/[protocolo]"
			initialTitle="Nenhuma solicitação sem responsável"
			initialMessage="Não há solicitações pendentes de atribuição no momento."
			onretry={() => fetchDashboardData(currentPage)}
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
