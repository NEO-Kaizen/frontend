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
	import { has } from '$lib/services/access.service';
	import { notifyError } from '$lib/utils/feedback';
	import {
		ALL_FILTER,
		DEFAULT_SORT_BY,
		DEFAULT_SORT_ORDER,
		parseQueueFilterQuery
	} from '$lib/utils/queue-filters';

	import type { MetricItem } from '$lib/types/metrics';
	import type {
		PriorityFilter,
		QueueFilterQuery,
		QueueFiltersState,
		QueueSortField,
		QueueSortOrder
	} from '$lib/types/queue';
	import type { RequestStatus } from '$lib/types/request';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Navegação pendente para a própria rota: estado de carregamento da tabela.
	// `invalidate` não popula `navigating`; o estado local cobre o retry.
	let isRetrying = $state(false);
	const isFetching = $derived(navigating.to?.route?.id === page.route.id || isRetrying);
	let isExporting = $state(false);

	const canExport = $derived(has('queue:export', data.user));
	const hasExportableRows = $derived(data.result.ok && data.result.data.total > 0);

	const queuePath = resolve('/(admin)/fila');

	// Filtros com estado local: o select responde na hora, sem esperar a
	// navegação (a URL só muda após o load resolver). A URL continua sendo a
	// fonte de verdade — `afterNavigate` ressincroniza em voltar/avançar e busca.
	const activeSearch = $derived(parseQueueFilterQuery(page.url.searchParams).search ?? '');

	const initial = parseQueueFilterQuery(page.url.searchParams);

	let status = $state<string>(initial.status ?? ALL_FILTER);
	let priority = $state<string>(initial.priority ?? ALL_FILTER);
	let assigneeId = $state(initial.assigneeId ?? ALL_FILTER);
	let department = $state(initial.department ?? ALL_FILTER);
	let dateFrom = $state(initial.createdFrom ?? '');
	let dateTo = $state(initial.createdTo ?? '');
	let sortBy = $state<QueueSortField>(initial.sortBy ?? DEFAULT_SORT_BY);
	let sortOrder = $state<QueueSortOrder>(initial.sortOrder ?? DEFAULT_SORT_ORDER);

	function syncFiltersFromUrl() {
		const current = parseQueueFilterQuery(page.url.searchParams);

		status = current.status ?? ALL_FILTER;
		priority = current.priority ?? ALL_FILTER;
		assigneeId = current.assigneeId ?? ALL_FILTER;
		department = current.department ?? ALL_FILTER;
		dateFrom = current.createdFrom ?? '';
		dateTo = current.createdTo ?? '';
		sortBy = current.sortBy ?? DEFAULT_SORT_BY;
		sortOrder = current.sortOrder ?? DEFAULT_SORT_ORDER;
	}

	afterNavigate(syncFiltersFromUrl);

	const statusOptions = $derived.by(() => [
		{ value: ALL_FILTER, label: 'Todos' },
		...data.portalConfig.statuses
			.filter((item) => item.isActive)
			.map((item) => ({ value: item.name, label: item.name }))
	]);

	const priorityOptions = [
		{ value: ALL_FILTER, label: 'Todas' },
		{ value: 'Baixa', label: 'Baixa' },
		{ value: 'Média', label: 'Média' },
		{ value: 'Alta', label: 'Alta' },
		{ value: 'Crítica', label: 'Crítica' },
		{ value: 'nenhum', label: 'Nenhuma' }
	];

	const sortByOptions = [
		{ value: DEFAULT_SORT_BY, label: 'Data de criação' },
		{ value: 'priority', label: 'Prioridade' },
		{ value: 'status', label: 'Status' },
		{ value: 'protocol', label: 'Protocolo' }
	];

	const sortOrderOptions = [
		{ value: DEFAULT_SORT_ORDER, label: 'Decrescente' },
		{ value: 'asc', label: 'Crescente' }
	];

	// Roster vem do envelope de GET /queue (id + nome), independente dos filtros.
	const assigneeOptions = $derived.by(() => {
		const roster = data.result.ok ? data.result.data.assignees : [];

		return [
			{ value: ALL_FILTER, label: 'Todos' },
			{ value: 'unassigned', label: 'Sem responsável' },
			...roster.map((assignee) => ({
				value: String(assignee.id),
				label: assignee.name
			}))
		];
	});

	// Departamentos também são globais no envelope; o atual entra mesmo fora da lista
	// para não sumir da UI quando o backend ainda não o retorna.
	const departmentOptions = $derived.by(() => {
		const source = data.result.ok ? data.result.data.departments : undefined;
		const list = Array.isArray(source)
			? source.filter((item): item is string => typeof item === 'string')
			: [];
		const unique = Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)))
			.sort((a, b) => a.localeCompare(b, 'pt-BR'))
			.map((value) => ({ value, label: value }));

		if (department !== ALL_FILTER && !unique.some((option) => option.value === department)) {
			unique.push({ value: department, label: department });
			unique.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
		}

		return [{ value: ALL_FILTER, label: 'Todos' }, ...unique];
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
			if (value === null || value === ALL_FILTER) {
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
		}).catch(() => notifyError('Não foi possível carregar a página. Tente novamente.'));
	}

	async function handleFilterChange(next: QueueFiltersState) {
		status = next.status;
		priority = next.priority;
		assigneeId = next.assignee;
		department = next.department;
		dateFrom = next.dateFrom;
		dateTo = next.dateTo;
		sortBy = next.sortBy;
		sortOrder = next.sortOrder;

		const target = `${queuePath}${buildQueueParams({
			page: null,
			status: next.status,
			priority: next.priority,
			assigneeId: next.assignee,
			department: next.department,
			createdFrom: next.dateFrom || null,
			createdTo: next.dateTo || null,
			sortBy: next.sortBy === DEFAULT_SORT_BY ? null : next.sortBy,
			sortOrder: next.sortOrder === DEFAULT_SORT_ORDER ? null : next.sortOrder
		})}`;

		try {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(target, { keepFocus: true, noScroll: true });
		} catch {
			syncFiltersFromUrl();
			notifyError('Não foi possível aplicar os filtros. Tente novamente.');
		}
	}

	async function handleClearFilters(): Promise<void> {
		status = ALL_FILTER;
		priority = ALL_FILTER;
		assigneeId = ALL_FILTER;
		department = ALL_FILTER;
		dateFrom = '';
		dateTo = '';
		sortBy = DEFAULT_SORT_BY;
		sortOrder = DEFAULT_SORT_ORDER;

		try {
			await goto(queuePath, { keepFocus: true, noScroll: true });
		} catch {
			syncFiltersFromUrl();
			notifyError('Não foi possível limpar os filtros. Tente novamente.');
		}
	}

	async function handleSearch(term: string): Promise<void> {
		const target = `${queuePath}${buildQueueParams({
			page: null,
			search: term ? term.trim() : null
		})}`;

		try {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(target, { keepFocus: true, noScroll: true });
		} catch {
			notifyError('Não foi possível aplicar a busca. Tente novamente.');
		}
	}

	async function retryQueue() {
		if (isRetrying) return;

		isRetrying = true;

		try {
			await invalidate('app:queue');
		} catch {
			notifyError('Não foi possível recarregar a fila. Tente novamente.');
		} finally {
			isRetrying = false;
		}
	}

	function currentExportFilters(): QueueFilterQuery {
		const filters: QueueFilterQuery = {};

		if (activeSearch) filters.search = activeSearch;
		if (status !== ALL_FILTER) filters.status = status as RequestStatus;
		if (priority !== ALL_FILTER) filters.priority = priority as PriorityFilter;
		if (assigneeId !== ALL_FILTER) filters.assigneeId = assigneeId;
		if (department !== ALL_FILTER) filters.department = department;
		if (dateFrom) filters.createdFrom = dateFrom;
		if (dateTo) filters.createdTo = dateTo;
		if (sortBy !== DEFAULT_SORT_BY) filters.sortBy = sortBy;
		if (sortOrder !== DEFAULT_SORT_ORDER) filters.sortOrder = sortOrder;

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
		if (isExporting || isFetching || !canExport || !hasExportableRows) return;

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

<main class="content-container queue-page">
	<header class="queue-page__header">
		<div>
			<h1>Fila Centralizada</h1>
			<p>Gestão e acompanhamento operacional de demandas</p>
		</div>

		{#if canExport}
			<Button
				variant="outline"
				loading={isExporting}
				disabled={isFetching || !hasExportableRows}
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
		{department}
		{dateFrom}
		{dateTo}
		{sortBy}
		{sortOrder}
		{statusOptions}
		{priorityOptions}
		{assigneeOptions}
		{departmentOptions}
		{sortByOptions}
		{sortOrderOptions}
		search={activeSearch}
		isSearching={isFetching}
		onFilterChange={(next) => void handleFilterChange(next)}
		onSearch={(term) => void handleSearch(term)}
		onClear={() => void handleClearFilters()}
	/>

	<SolicitationTable
		page={data.page}
		result={data.result}
		{isFetching}
		detailRoute="/(admin)/fila/[protocolo]"
		emptyMessage="Ajuste a busca ou os filtros e tente novamente."
		onretry={() => void retryQueue()}
		onpagechange={goToPage}
	/>
</main>

<style>
	.queue-page {
		display: flex;
		flex-direction: column;
		width: 100%;
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
		border-radius: var(--radius-md);
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
