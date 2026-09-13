<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import MetricsSummary from '$lib/components/MetricsSummary.svelte';
	import QueueFilters from '$lib/components/QueueFilters.svelte';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import Button from '$lib/components/Button.svelte';

	import type { MetricItem } from '$lib/types/metrics';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Navegação pendente para a própria rota: estado de carregamento da tabela.
	const isFetching = $derived(navigating.to?.route?.id === page.route.id);

	const queuePath = resolve('/(admin)/fila');

	// A URL é a fonte de verdade: filtros e paginação vivem nos search params,
	// e cada mudança dispara nova navegação (load server-side reexecuta).
	const filters = $derived.by(() => {
		const params = page.url.searchParams;

		return {
			status: params.get('status') ?? 'all',
			priority: params.get('priority') ?? 'all',
			assignee: params.get('assigneeId') ?? 'all'
		};
	});

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
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(target, {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	async function handleFilterChange(status: string, priority: string, assigneeId: string) {
		const target = `${queuePath}${buildQueueParams({ page: null, status, priority, assigneeId })}`;

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target, { keepFocus: true, noScroll: true });
	}

	async function handleClearFilters(): Promise<void> {
		const target = `${queuePath}${buildQueueParams({
			page: null,
			status: null,
			priority: null,
			assigneeId: null
		})}`;

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(target, { keepFocus: true, noScroll: true });
	}
</script>

<svelte:head>
	<title>Fila Centralizada | MAAT Flow</title>
</svelte:head>

<section class="queue-page">
	<header class="queue-page__header">
		<h1>Fila Centralizada</h1>
		<p>Gestão e acompanhamento operacional de demandas</p>
	</header>

	{#if data.metricsResult.ok}
		<MetricsSummary {metrics} />
	{:else}
		<div class="metrics-state metrics-state--error" role="alert">
			<p>{data.metricsResult.error.message}</p>

			<Button variant="outline" loading={isFetching} onclick={() => void invalidateAll()}>
				Tentar novamente
			</Button>
		</div>
	{/if}

	<QueueFilters
		{...filters}
		{statusOptions}
		{priorityOptions}
		{assigneeOptions}
		onFilterChange={(next) => void handleFilterChange(next.status, next.priority, next.assignee)}
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
</style>
