<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import MetricsSummary from '$lib/components/MetricsSummary.svelte';
	import SolicitationTable from '$lib/components/tables/SolicitationTable.svelte';
	import Button from '$lib/components/Button.svelte';

	import type { MetricItem } from '$lib/types/metrics';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Navegação pendente para a própria rota: estado de carregamento da tabela.
	const isFetching = $derived(navigating.to?.route?.id === page.route.id);

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

	function goToPage(nextPage: number) {
		const searchParams = new SvelteURLSearchParams();

		if (nextPage > 1) {
			searchParams.set('page', String(nextPage));
		}

		const query = searchParams.toString();
		const base = resolve('/(admin)/fila');
		const target = query ? `${base}?${query}` : base;

		// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
		// a navegação é validada em runtime pelo SvelteKit.
		// Sem invalidateAll: o load da lista já reroda ao mudar ?page; forçá-lo
		// refaria também o load das métricas.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(target, {
			keepFocus: true,
			replaceState: true
		});
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

			<Button
				variant="outline"
				loading={isFetching}
				onclick={() => void invalidate('app:queue-metrics')}
			>
				Tentar novamente
			</Button>
		</div>
	{/if}

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
