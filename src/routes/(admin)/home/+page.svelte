<script lang="ts">
	import Banner from '$lib/components/layout/Banner.svelte';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import { listQueueRequests } from '$lib/services/request.service';
	import type { QueueResponse } from '$lib/types/queue';
	import type { Result } from '$lib/types/result';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let fetchedResult = $state<Result<QueueResponse> | null>(null);
	let currentPage = $state(1);
	let isFetching = $state(false);
	let requestToken = 0;

	const isAnalyst = $derived(data.user?.role === 'Analista');

	let result = $derived(fetchedResult ?? data.result);
	let userName = $derived(data.user?.name ?? 'Usuário');

	let sectionTitle = $derived(
		isAnalyst ? 'Solicitações sob minha responsabilidade' : 'Solicitações sem responsável'
	);

	let emptyTitle = $derived(
		isAnalyst
			? 'Nenhuma solicitação sob sua responsabilidade'
			: 'Nenhuma solicitação sem responsável'
	);

	let emptyMessage = $derived(
		isAnalyst
			? 'Não há solicitações atribuídas a você no momento.'
			: 'Não há solicitações pendentes de atribuição no momento.'
	);

	let bannerDescription = $derived.by(() => {
		if (!result.ok) {
			return isAnalyst
				? 'Não foi possível carregar o total de solicitações sob sua responsabilidade.'
				: 'Não foi possível carregar o total de solicitações sem responsável.';
		}

		const total = result.data.total;
		const noun = total === 1 ? 'solicitação' : 'solicitações';

		if (isAnalyst) {
			return `Você tem ${total} ${noun} sob sua responsabilidade.`;
		}

		return `Há ${total} ${noun} sem responsável.`;
	});

	async function fetchTable(pageNumber: number) {
		const token = ++requestToken;

		isFetching = true;

		const next = await listQueueRequests({
			page: pageNumber,
			pageSize: data.pageSize,
			assigneeId: data.assigneeId
		});

		if (token !== requestToken) {
			return;
		}

		fetchedResult = next;
		currentPage = pageNumber;
		isFetching = false;
	}
</script>

<svelte:head>
	<title>Home Administrativa - MAAT</title>
</svelte:head>

<div class="content-container dashboard">
	<Banner titulo={`Bem-vindo de volta, ${userName}`} descricao={bannerDescription} />

	<section class="table-section">
		<h2>{sectionTitle}</h2>

		<SolicitationTable
			page={currentPage}
			{result}
			{isFetching}
			detailRoute="/(admin)/fila/[protocolo]"
			{emptyTitle}
			{emptyMessage}
			onretry={() => void fetchTable(currentPage)}
			onpagechange={(nextPage) => void fetchTable(nextPage)}
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
