<script lang="ts">
	import { page as routePage } from '$app/state';
	import { onMount } from 'svelte';

	import MetricsSummary from '$lib/components/MetricsSummary.svelte';
	import QueueFilters from '$lib/components/QueueFilters.svelte';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';

	import { getQueueMetrics, listQueueRequests } from '$lib/services/request.service';

	import type { MetricItem } from '$lib/types/metrics';
	import type { QueueMetricsResponse, QueueQuery, QueueResponse } from '$lib/types/queue';
	import type { RequestPriority, RequestStatus } from '$lib/types/request';
	import type { Result } from '$lib/types/result';

	const PAGE_SIZE = 5;

	let page = $state(1);
	let status = $state('all');
	let priority = $state('all');
	let assigneeId = $state('all');

	let result = $state<Result<QueueResponse> | null>(null);
	let isFetching = $state(false);
	let queueError = $state<string | null>(null);

	let metricsResult = $state<Result<QueueMetricsResponse> | null>(null);
	let isFetchingMetrics = $state(false);
	let metricsError = $state<string | null>(null);

	const search = $derived(routePage.url.searchParams.get('search')?.trim() ?? '');

	let previousSearch = $state('');

	const statusOptions = [
		{ value: 'all', label: 'Todos' },
		{ value: 'Solicitação enviada', label: 'Solicitação enviada' },
		{ value: 'Aguardando triagem', label: 'Aguardando triagem' },
		{ value: 'Em triagem', label: 'Em triagem' },
		{ value: 'Pendente de informações', label: 'Pendente de informações' },
		{ value: 'Aguardando mapeamento', label: 'Aguardando mapeamento' },
		{ value: 'Mapeamento agendado', label: 'Mapeamento agendado' },
		{ value: 'Em mapeamento', label: 'Em mapeamento' },
		{ value: 'Em análise de viabilidade', label: 'Em análise de viabilidade' },
		{ value: 'Elegível', label: 'Elegível' },
		{ value: 'Não elegível', label: 'Não elegível' },
		{ value: 'Priorizado', label: 'Priorizado' },
		{ value: 'Backlog', label: 'Backlog' },
		{ value: 'Direcionado para outra área', label: 'Direcionado para outra área' },
		{ value: 'Em desenvolvimento', label: 'Em desenvolvimento' },
		{ value: 'Em homologação', label: 'Em homologação' },
		{ value: 'Concluído', label: 'Concluído' },
		{ value: 'Cancelado', label: 'Cancelado' }
	];

	const priorityOptions = [
		{ value: 'all', label: 'Todas' },
		{ value: 'Baixa', label: 'Baixa' },
		{ value: 'Média', label: 'Média' },
		{ value: 'Alta', label: 'Alta' },
		{ value: 'Crítica', label: 'Crítica' }
	];

	const assigneeOptions = [
		{ value: 'all', label: 'Todos' },
		{ value: 'unassigned', label: 'Sem responsável' },
		{ value: '1', label: 'Fernando Alves' },
		{ value: '2', label: 'Ana Souza' },
		{ value: '3', label: 'Lucas Gomes' },
		{ value: '4', label: 'Gabriel Soares' },
		{ value: '5', label: 'Carlos Mendes' }
	];

	const metrics = $derived.by<MetricItem[]>(() => {
		if (!metricsResult?.ok) {
			return [];
		}

		return [
			{
				label: 'Volume Total',
				value: metricsResult.data.totalRequests,
				iconName: 'queueSummary',
				tone: 'indigo'
			},
			{
				label: 'Sem Responsável',
				value: metricsResult.data.unassignedRequests,
				iconName: 'doNotDisturb',
				tone: 'neutral'
			},
			{
				label: 'Em Andamento',
				value: metricsResult.data.inProgressRequests,
				iconName: 'pending',
				tone: 'orange'
			},
			{
				label: 'Atrasados',
				value: metricsResult.data.overdueRequests,
				iconName: 'priority',
				tone: 'danger'
			}
		];
	});

	function buildQueueQuery(): QueueQuery {
		const query: QueueQuery = {
			page,
			pageSize: PAGE_SIZE
		};

		if (search) {
			query.search = search;
		}

		if (status !== 'all') {
			query.status = status as RequestStatus;
		}

		if (priority !== 'all') {
			query.priority = priority as RequestPriority;
		}

		if (assigneeId !== 'all') {
			query.assigneeId = assigneeId === 'unassigned' ? 'unassigned' : Number(assigneeId);
		}

		return query;
	}

	async function loadQueue(): Promise<void> {
		isFetching = true;
		queueError = null;

		try {
			const nextResult = await listQueueRequests(buildQueueQuery());

			if (nextResult.ok) {
				result = nextResult;
				return;
			}

			queueError = nextResult.error.message;
		} finally {
			isFetching = false;
		}
	}

	async function loadMetrics(): Promise<void> {
		isFetchingMetrics = true;
		metricsError = null;

		try {
			const nextResult = await getQueueMetrics();

			if (nextResult.ok) {
				metricsResult = nextResult;
				return;
			}

			metricsError = nextResult.error.message;
		} finally {
			isFetchingMetrics = false;
		}
	}

	async function handlePageChange(nextPage: number): Promise<void> {
		page = nextPage;
		await loadQueue();
	}

	async function handleFilterChange(): Promise<void> {
		page = 1;
		await loadQueue();
	}

	async function handleClearFilters(): Promise<void> {
		status = 'all';
		priority = 'all';
		assigneeId = 'all';
		page = 1;

		await loadQueue();
	}

	onMount(() => {
		previousSearch = search;

		void loadQueue();
		void loadMetrics();
	});

	$effect(() => {
		if (search !== previousSearch) {
			previousSearch = search;
			page = 1;
			void loadQueue();
		}
	});
</script>

<svelte:head>
	<title>Fila Centralizada | MAAT Flow</title>
</svelte:head>

<section class="queue-page">
	<header class="queue-page__header">
		<h1>Fila Centralizada</h1>
		<p>Gestão e acompanhamento operacional de demandas</p>
	</header>

	{#if isFetchingMetrics && metrics.length === 0}
		<p class="metrics-state" role="status" aria-live="polite">Carregando indicadores…</p>
	{:else if metricsError && metrics.length === 0}
		<p class="metrics-state metrics-state--error" role="alert">
			{metricsError}
		</p>
	{:else}
		<MetricsSummary {metrics} />

		{#if metricsError}
			<p class="metrics-state metrics-state--error" role="alert">
				{metricsError}
			</p>
		{/if}
	{/if}

	<QueueFilters
		bind:status
		bind:priority
		bind:assignee={assigneeId}
		{statusOptions}
		{priorityOptions}
		{assigneeOptions}
		onFilterChange={handleFilterChange}
		onClear={handleClearFilters}
	/>

	{#if result === null && isFetching}
		<div class="queue-state" role="status" aria-live="polite">
			<p>Carregando solicitações…</p>
		</div>
	{:else if result === null && queueError}
		<div class="queue-state queue-state--error" role="alert">
			<p>{queueError}</p>

			<button type="button" class="queue-state__retry" onclick={() => void loadQueue()}>
				Tentar novamente
			</button>
		</div>
	{:else if result}
		<SolicitationTable
			{page}
			{result}
			{isFetching}
			detailRoute="/(admin)/fila/[protocolo]"
			onpagechange={handlePageChange}
		/>
	{/if}
</section>

<style>
	.queue-page {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: var(--largura-maxima-conteudo);
		gap: var(--spacing-lg);
	}

	.queue-page__header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.queue-page__header h1,
	.queue-page__header p {
		margin: 0;
	}

	.queue-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		min-height: 240px;
		padding: var(--spacing-xl);
		text-align: center;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
	}

	.queue-state p {
		margin: 0;
		font: var(--paragrafo);
		color: var(--gray);
	}

	.queue-state__retry {
		padding: var(--spacing-xs) var(--spacing-md);
		font: var(--paragrafo);
		font-weight: 600;
		color: var(--secondary-color);
		background: none;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
</style>
