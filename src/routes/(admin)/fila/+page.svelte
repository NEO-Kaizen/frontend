<script lang="ts">
	import { afterNavigate, goto, invalidate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import MetricsSummary from '$lib/components/MetricsSummary.svelte';
	import QueueFilters from '$lib/components/QueueFilters.svelte';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { exportQueueCsv } from '$lib/services/report.service';
	import { notifyError } from '$lib/utils/feedback';

	import type { MetricItem } from '$lib/types/metrics';
	import type { PriorityFilter, QueueFilterQuery } from '$lib/types/queue';
	import type { RequestStatus } from '$lib/types/request';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Navegação pendente para a própria rota: estado de carregamento da tabela.
	const isFetching = $derived(navigating.to?.route?.id === page.route.id);
	let isExporting = $state(false);

	const canExport = $derived(data.user?.role === 'Gestor' || data.user?.role === 'Administrador');
	const hasExportableRows = $derived(data.result.ok && data.result.data.total > 0);

	const queuePath = resolve('/(admin)/fila');

	// Filtros com estado local: o select responde na hora, sem esperar a
	// navegação (a URL só muda após o load resolver). A URL continua sendo a
	// fonte de verdade — `afterNavigate` ressincroniza em voltar/avançar e busca.
	const params = page.url.searchParams;

	const activeSearch = $derived(page.url.searchParams.get('search') ?? '');

	let status = $state(params.get('status') ?? 'all');
	let priority = $state(params.get('priority') ?? 'all');
	let assigneeId = $state(params.get('assigneeId') ?? 'all');

	afterNavigate(() => {
		status = page.url.searchParams.get('status') ?? 'all';
		priority = page.url.searchParams.get('priority') ?? 'all';
		assigneeId = page.url.searchParams.get('assigneeId') ?? 'all';
	});

	const statusOptions = $derived.by(() => [
		{ value: 'all', label: 'Todos' },
		...data.portalConfig.statuses
			.filter((item) => item.isActive)
			.map((item) => ({ value: item.name, label: item.name }))
	]);

	const priorityOptions = [
		{ value: 'all', label: 'Todas' },
		{ value: 'Baixa', label: 'Baixa' },
		{ value: 'Média', label: 'Média' },
		{ value: 'Alta', label: 'Alta' },
		{ value: 'Crítica', label: 'Crítica' },
		{ value: 'nenhum', label: 'Nenhuma' }
	];

	// Roster vem do envelope de GET /queue (id + nome), independente dos filtros.
	const assigneeOptions = $derived.by(() => {
		const roster = data.result.ok ? data.result.data.assignees : [];

		return [
			{ value: 'all', label: 'Todos' },
			{ value: 'unassigned', label: 'Sem responsável' },
			...roster.map((assignee) => ({
				value: String(assignee.id),
				label: assignee.name
			}))
		];
	});

	const metrics = $derived.by<MetricItem[]>(() => {
		if (!data.metricsResult.ok) {
			return [];
		}

		return [
			{
				label: 'Volume Total',
				value: data.metricsResult.data.totalRequests,
				iconName: 'queueSummary',
				tone: 'indigo'
			},
			{
				label: 'Sem Responsável',
				value: data.metricsResult.data.unassignedRequests,
				iconName: 'doNotDisturb',
				tone: 'neutral'
			},
			{
				label: 'Em Andamento',
				value: data.metricsResult.data.inProgressRequests,
				iconName: 'pending',
				tone: 'orange'
			},
			{
				label: 'Atrasados',
				value: data.metricsResult.data.overdueRequests,
				iconName: 'priority',
				tone: 'danger'
			}
		];
	});

	function buildQueueParams(overrides: Record<string, string | null>): string {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);

		for (const [key, value] of Object.entries(overrides)) {
			if (value === null || value === 'all') {
				searchParams.delete(key);
			} else {
				searchParams.set(key, value);
			}
		}

		const query = searchParams.toString();

		return query ? `?${query}` : '';
	}

	function goToPage(nextPage: number) {
		const target = `${queuePath}${buildQueueParams({
			page: nextPage > 1 ? String(nextPage) : null
		})}`;

		// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
		// a navegação é validada em runtime pelo SvelteKit.
		// Sem invalidateAll: o load da lista já reroda ao mudar ?page; forçá-lo
		// refaria também o load das métricas.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(target, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	async function handleFilterChange(
		nextStatus: string,
		nextPriority: string,
		nextAssigneeId: string
	) {
		status = nextStatus;
		priority = nextPriority;
		assigneeId = nextAssigneeId;

		const target = `${queuePath}${buildQueueParams({
			page: null,
			status: nextStatus,
			priority: nextPriority,
			assigneeId: nextAssigneeId
		})}`;

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target, { keepFocus: true, noScroll: true });
	}

	async function handleClearFilters(): Promise<void> {
		status = 'all';
		priority = 'all';
		assigneeId = 'all';

		const target = `${queuePath}${buildQueueParams({
			page: null,
			status: null,
			priority: null,
			assigneeId: null,
			search: null
		})}`;

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target, { keepFocus: true, noScroll: true });
	}

	async function handleSearch(term: string): Promise<void> {
		const target = `${queuePath}${buildQueueParams({
			page: null,
			search: term ? term.trim() : null
		})}`;

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target, { keepFocus: true, noScroll: true });
	}

	async function handleClearSearch(): Promise<void> {
		const target = `${queuePath}${buildQueueParams({
			page: null,
			search: null
		})}`;

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target, { keepFocus: true, noScroll: true });
	}

	function currentExportFilters(): QueueFilterQuery {
		const filters: QueueFilterQuery = {};

		if (activeSearch) filters.search = activeSearch;
		if (status !== 'all') filters.status = status as RequestStatus;
		if (priority !== 'all') filters.priority = priority as PriorityFilter;
		if (assigneeId !== 'all') filters.assigneeId = assigneeId;

		return filters;
	}

	function startDownload(blob: Blob, filename: string): void {
		const objectUrl = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = objectUrl;
		anchor.download = filename;
		anchor.hidden = true;
		document.body.append(anchor);
		anchor.click();
		anchor.remove();
		// Mantém a URL válida até o navegador efetivamente iniciar o download.
		setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
	}

	async function handleExport(): Promise<void> {
		if (isExporting || !canExport || !hasExportableRows) return;

		isExporting = true;
		const result = await exportQueueCsv(currentExportFilters());
		isExporting = false;

		if (!result.ok) {
			notifyError(result.error.message);
			return;
		}

		startDownload(result.data.blob, result.data.filename);
	}
</script>

<svelte:head>
	<title>Fila Centralizada | {data.portalConfig.platformName}</title>
</svelte:head>

<section class="queue-page">
	<header class="queue-page__header">
		<div>
			<h1>Fila Centralizada</h1>
			<p>Gestão e acompanhamento operacional de demandas</p>
		</div>

		{#if canExport}
			<Button
				variant="outline"
				loading={isExporting}
				disabled={!hasExportableRows}
				onclick={() => void handleExport()}
			>
				{#if !isExporting}
					<Icon iconName="download" />
				{/if}
				{isExporting ? 'Preparando CSV' : 'Exportar CSV'}
			</Button>
		{/if}
	</header>

	{#if data.metricsResult.ok}
		<MetricsSummary {metrics} />
	{:else}
		<div class="metrics-state metrics-state--error" role="alert">
			<p>{data.metricsResult.error.message}</p>

			<Button
				variant="outline"
				loading={isFetching}
				onclick={() => void invalidate('app:queue-metrics')}
			>
				Tentar novamente
			</Button>
		</div>
	{/if}

	<QueueFilters
		{status}
		{priority}
		assignee={assigneeId}
		{statusOptions}
		{priorityOptions}
		{assigneeOptions}
		search={activeSearch}
		onFilterChange={(next) => void handleFilterChange(next.status, next.priority, next.assignee)}
		onSearch={(term) => void handleSearch(term)}
		onClear={() => void handleClearFilters()}
	/>

	<SolicitationTable
		page={data.page}
		result={data.result}
		{isFetching}
		detailRoute="/(admin)/fila/[protocolo]"
		onpagechange={goToPage}
	/>
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
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.queue-page__header > div {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.queue-page__header h1,
	.queue-page__header p {
		margin: 0;
	}

	.metrics-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		margin: 0;
		padding: var(--spacing-lg);
		text-align: center;
		font: var(--paragrafo);
		color: var(--gray);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-lg);
		box-shadow: var(--regular-shadow);
	}

	.metrics-state p {
		margin: 0;
	}

	.metrics-state--error {
		color: var(--status-red);
	}

	@media (max-width: 640px) {
		.queue-page__header {
			flex-direction: column;
		}

		.queue-page__header :global(button) {
			width: 100%;
		}
	}
</style>
