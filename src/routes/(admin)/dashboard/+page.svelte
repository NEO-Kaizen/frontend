<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import MetricsSummary from '$lib/components/MetricsSummary.svelte';
	import DashboardChart from '$lib/components/dashboard/DashboardChart.svelte';
	import DashboardPanel from '$lib/components/dashboard/DashboardPanel.svelte';
	import { getThemeMode } from '$lib/states/theme.svelte';
	import type { DashboardPriorityMetric, DashboardStatusTone } from '$lib/types/dashboard';
	import type { MetricItem } from '$lib/types/metrics';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Navegação pendente para a própria rota: estado de carregamento dos resultados.
	const isFetching = $derived(navigating.to?.route?.id === page.route.id);

	let resultsEl = $state<HTMLDivElement>();

	const dashboard = $derived(data.result.ok ? data.result.data : null);
	const activePalette = $derived(data.portalConfig.theme[getThemeMode()]);

	// Assinatura do conjunto de resultados: quando muda, a altura do bloco é
	// animada do valor antigo ao novo em vez de saltar.
	const resultKey = $derived(
		[
			data.filters.from,
			data.filters.to,
			data.filters.situation,
			data.filters.statusId,
			data.filters.categoryId,
			data.filters.priorityId,
			dashboard?.summary.total
		].join('|')
	);

	const prefersReducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Handoff entre o efeito pre (antes da troca do DOM) e o efeito pós
	// (depois): altura antiga em px e a assinatura aplicada. Variáveis simples
	// (não reativas) para não dispararem novos efeitos ao serem escritas.
	let pendingHeight: number | undefined;
	let appliedKey: string | undefined;

	$effect.pre(() => {
		const key = resultKey;
		const element = resultsEl;

		if (appliedKey === undefined) {
			appliedKey = key;
			return;
		}

		if (appliedKey === key || !element || prefersReducedMotion) return;

		appliedKey = key;
		pendingHeight = element.offsetHeight;
		element.style.height = `${pendingHeight}px`;
		// Força o reflow para que a altura fixada valha antes da troca do DOM.
		void element.offsetHeight;
	});

	$effect(() => {
		const key = resultKey;
		const element = resultsEl;
		const from = pendingHeight;

		if (from === undefined || !element || prefersReducedMotion || key !== appliedKey) return;

		pendingHeight = undefined;

		// Revela o conteúdo novo subindo (bottom→up). Reinicia a animação
		// removendo a classe e forçando um reflow antes de reaplicá-la.
		element.classList.remove('is-entering');
		void element.offsetHeight;
		element.classList.add('is-entering');

		const clearEnter = () => element.classList.remove('is-entering');
		element.addEventListener('animationend', clearEnter, { once: true });

		const clearPinnedHeight = (event: TransitionEvent) => {
			if (event.propertyName !== 'height') return;
			element.style.height = '';
			element.removeEventListener('transitionend', clearPinnedHeight);
		};

		element.addEventListener('transitionend', clearPinnedHeight);

		element.style.height = 'auto';
		const to = element.offsetHeight;

		if (to !== from) {
			element.style.height = `${from}px`;
			void element.offsetHeight;
			requestAnimationFrame(() => {
				element.style.height = `${to}px`;
			});
		} else {
			element.style.height = '';
		}

		return () => {
			element.removeEventListener('animationend', clearEnter);
			element.removeEventListener('transitionend', clearPinnedHeight);
		};
	});

	const metrics = $derived.by<MetricItem[]>(() => {
		if (!dashboard) return [];

		return [
			{
				label: 'Total de solicitações',
				value: dashboard.summary.total,
				iconName: 'queueSummary',
				tone: 'indigo'
			},
			{
				label: 'Abertas',
				value: dashboard.summary.open,
				iconName: 'queueChart',
				tone: 'blue'
			},
			{
				label: 'Encerradas',
				value: dashboard.summary.closed,
				iconName: 'check',
				tone: 'green'
			},
			{
				label: 'Atrasadas',
				value: dashboard.summary.overdue,
				iconName: 'warning',
				tone: 'danger'
			},
			{
				label: 'Sem responsável',
				value: dashboard.summary.unassigned,
				iconName: 'person',
				tone: 'orange'
			}
		];
	});

	const statusColors = $derived.by<Record<DashboardStatusTone, string>>(() => ({
		error: activePalette.statuses.error.color,
		success: activePalette.statuses.success.color,
		info: activePalette.statuses.info.color,
		warning: activePalette.statuses.warning.color,
		neutral: activePalette.statuses.neutral.color
	}));

	const priorityColors = $derived.by<Record<DashboardPriorityMetric['label'], string>>(() => ({
		Crítica: statusColors.error,
		Alta: statusColors.warning,
		Média: statusColors.info,
		Baixa: statusColors.success,
		'Não priorizada': statusColors.neutral
	}));

	const categoryColors = $derived([
		activePalette.secondary,
		statusColors.success,
		statusColors.warning,
		statusColors.error,
		activePalette.primary,
		statusColors.neutral
	]);

	const priorityOrder: Record<DashboardPriorityMetric['label'], number> = {
		Crítica: 0,
		Alta: 1,
		Média: 2,
		Baixa: 3,
		'Não priorizada': 4
	};

	const situationLabels = {
		open: 'Abertas',
		closed: 'Encerradas',
		overdue: 'Atrasadas',
		unassigned: 'Sem responsável'
	} as const;

	const categoriesByVolume = $derived.by(() =>
		dashboard
			? [...dashboard.byCategory].sort(
					(left, right) => right.count - left.count || left.name.localeCompare(right.name)
				)
			: []
	);

	const prioritiesBySeverity = $derived.by(() =>
		dashboard
			? [...dashboard.byPriority].sort(
					(left, right) => priorityOrder[left.label] - priorityOrder[right.label]
				)
			: []
	);

	const priorityFilterOptions = $derived.by(() =>
		dashboard
			? [...dashboard.filterOptions.priorities].sort(
					(left, right) => priorityOrder[left.label] - priorityOrder[right.label]
				)
			: []
	);

	const activeFilters = $derived.by(() => {
		const filters: string[] = [];

		if (data.filters.from) filters.push(`A partir de ${formatDate(data.filters.from)}`);
		if (data.filters.to) filters.push(`Até ${formatDate(data.filters.to)}`);
		if (data.filters.situation) {
			filters.push(`Situação: ${situationLabels[data.filters.situation]}`);
		}

		const selectedStatus = dashboard?.filterOptions.statuses.find(
			(option) => String(option.id) === data.filters.statusId
		);
		if (selectedStatus) filters.push(`Status: ${selectedStatus.name}`);

		const selectedCategory = dashboard?.filterOptions.categories.find(
			(option) => String(option.id) === data.filters.categoryId
		);
		if (selectedCategory) filters.push(`Categoria: ${selectedCategory.name}`);

		if (data.filters.priorityId === 'unassigned') {
			filters.push('Prioridade: Não priorizada');
		} else {
			const selectedPriority = dashboard?.filterOptions.priorities.find(
				(option) => String(option.id) === data.filters.priorityId
			);
			if (selectedPriority) filters.push(`Prioridade: ${selectedPriority.label}`);
		}

		return filters;
	});

	function repeatPalette(palette: string[], count: number): string[] {
		return Array.from({ length: count }, (_, index) => palette[index % palette.length]);
	}

	function formatPeriod(period: string): string {
		const [year, month] = period.split('-');
		return `${month}/${year}`;
	}

	function formatDate(date: string): string {
		const [year, month, day] = date.split('-');
		return `${day}/${month}/${year}`;
	}
</script>

<svelte:head>
	<title>Dashboard Gerencial - MAAT</title>
</svelte:head>

<div class="content-container dashboard-page">
	<header class="page-heading">
		<div>
			<p class="eyebrow">Visão gerencial</p>
			<h1>Dashboard de solicitações</h1>
			<p>Acompanhe volume, situação e distribuição das demandas registradas no MAAT.</p>
		</div>
	</header>

	<form
		method="GET"
		action={resolve('/(admin)/dashboard')}
		class="filters"
		data-sveltekit-noscroll
		data-sveltekit-keepfocus
	>
		<label>
			<span>Data inicial</span>
			<input type="date" name="from" value={data.filters.from ?? ''} />
		</label>

		<label>
			<span>Data final</span>
			<input type="date" name="to" value={data.filters.to ?? ''} />
		</label>

		<label>
			<span>Situação</span>
			<select name="situation">
				<option value="">Todas as situações</option>
				<option value="open" selected={data.filters.situation === 'open'}>Abertas</option>
				<option value="closed" selected={data.filters.situation === 'closed'}>Encerradas</option>
				<option value="overdue" selected={data.filters.situation === 'overdue'}>Atrasadas</option>
				<option value="unassigned" selected={data.filters.situation === 'unassigned'}>
					Sem responsável
				</option>
			</select>
		</label>

		<label>
			<span>Status</span>
			<select name="statusId">
				<option value="">Todos os status</option>
				{#each dashboard?.filterOptions.statuses ?? [] as option (option.id)}
					<option value={option.id} selected={data.filters.statusId === String(option.id)}>
						{option.name}
					</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Categoria</span>
			<select name="categoryId">
				<option value="">Todas as categorias</option>
				{#each dashboard?.filterOptions.categories ?? [] as option (option.id)}
					<option value={option.id} selected={data.filters.categoryId === String(option.id)}>
						{option.name}
					</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Prioridade</span>
			<select name="priorityId">
				<option value="">Todas as prioridades</option>
				{#each priorityFilterOptions as option (option.id)}
					<option value={option.id} selected={data.filters.priorityId === String(option.id)}>
						{option.label}
					</option>
				{/each}
				<option value="unassigned" selected={data.filters.priorityId === 'unassigned'}>
					Não priorizada
				</option>
			</select>
		</label>

		<div class="filter-actions">
			<Button type="submit" loading={isFetching}>Aplicar</Button>
			<a class="clear-filter" href={resolve('/(admin)/dashboard')} data-sveltekit-noscroll>
				Limpar
			</a>
		</div>
	</form>

	<div
		class="dashboard-results"
		class:is-loading={isFetching}
		aria-busy={isFetching}
		bind:this={resultsEl}
	>
		<div
			class="active-filters"
			class:has-filters={activeFilters.length > 0}
			aria-label="Filtros ativos"
			aria-hidden={activeFilters.length === 0}
		>
			<div class="active-filters-inner">
				<span class="active-filters-label">Filtros ativos</span>
				{#each activeFilters as filter, index (filter)}
					<span class="filter-chip" style:animation-delay={`${index * 40}ms`}>{filter}</span>
				{/each}
			</div>
		</div>

		{#if !data.result.ok}
			<section class="state-card error" role="alert">
				<h2>Não foi possível carregar o dashboard</h2>
				<p>{data.result.error.message}</p>
				<Button variant="outline" onclick={() => invalidateAll()}>Tentar novamente</Button>
			</section>
		{:else if dashboard && dashboard.summary.total === 0}
			<section class="state-card" aria-live="polite">
				<h2>Nenhuma solicitação encontrada</h2>
				<p>Não há solicitações para os filtros informados. Ajuste ou limpe os filtros.</p>
				<a class="clear-filter" href={resolve('/(admin)/dashboard')} data-sveltekit-noscroll>
					Limpar filtros
				</a>
			</section>
		{:else if dashboard}
			<MetricsSummary {metrics} />

			<div class="dashboard-charts">
				<DashboardPanel
					title="Solicitações abertas por mês"
					description="Evolução do volume de novas solicitações ao longo do tempo."
				>
					<DashboardChart
						type="line"
						height={300}
						labels={dashboard.openedOverTime.map((metric) => formatPeriod(metric.period))}
						values={dashboard.openedOverTime.map((metric) => metric.count)}
						colors={[activePalette.secondary]}
						textColor={activePalette.textSecondary}
						gridColor={activePalette.border}
						ariaLabel="Quantidade de solicitações abertas por mês"
					/>
				</DashboardPanel>

				<DashboardPanel
					title="Solicitações por status"
					description="Distribuição atual das solicitações no período selecionado, na ordem do fluxo."
				>
					<DashboardChart
						type="bar"
						horizontal
						height={Math.max(360, dashboard.byStatus.length * 34)}
						labels={dashboard.byStatus.map((metric) => metric.name)}
						values={dashboard.byStatus.map((metric) => metric.count)}
						colors={dashboard.byStatus.map((metric) => statusColors[metric.tone])}
						textColor={activePalette.textSecondary}
						gridColor={activePalette.border}
						ariaLabel="Quantidade de solicitações por status"
					/>
				</DashboardPanel>

				<div class="demand-profile-grid">
					<DashboardPanel
						title="Solicitações por categoria"
						description="Categorias mais frequentes entre as solicitações do período."
					>
						<DashboardChart
							type="bar"
							horizontal
							height={Math.max(340, categoriesByVolume.length * 36)}
							labels={categoriesByVolume.map((metric) => metric.name)}
							values={categoriesByVolume.map((metric) => metric.count)}
							colors={repeatPalette(categoryColors, categoriesByVolume.length)}
							textColor={activePalette.textSecondary}
							gridColor={activePalette.border}
							ariaLabel="Quantidade de solicitações por categoria"
						/>
					</DashboardPanel>

					<DashboardPanel
						title="Distribuição por prioridade"
						description="Inclui as solicitações que ainda não foram priorizadas."
					>
						<DashboardChart
							type="doughnut"
							height={Math.max(340, categoriesByVolume.length * 36)}
							labels={prioritiesBySeverity.map((metric) => metric.label)}
							values={prioritiesBySeverity.map((metric) => metric.count)}
							colors={prioritiesBySeverity.map((metric) => priorityColors[metric.label])}
							textColor={activePalette.textSecondary}
							gridColor={activePalette.border}
							ariaLabel="Quantidade de solicitações por prioridade"
						/>
					</DashboardPanel>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		padding-bottom: var(--spacing-xl);
	}

	.page-heading {
		display: block;
	}

	.page-heading > div:first-child {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.page-heading h1 {
		color: var(--heading-color);
	}

	.page-heading p:not(.eyebrow) {
		max-width: 640px;
		color: var(--gray);
	}

	.eyebrow {
		font: var(--label);
		color: var(--secondary-color);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.filters {
		display: grid;
		grid-template-columns: repeat(6, minmax(125px, 1fr)) auto;
		align-items: flex-end;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
	}

	.filters label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		color: var(--text-color-primary);
	}

	.filters input,
	.filters select {
		width: 100%;
		min-height: 42px;
		padding: var(--spacing-sm);
		font: var(--paragrafo);
		color: var(--text-color-primary);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.filters input:focus-visible,
	.filters select:focus-visible,
	.clear-filter:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.filter-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		min-height: 42px;
	}

	.clear-filter {
		padding: var(--spacing-sm);
		font: var(--button);
		color: var(--primary-color);
		text-decoration: none;
		border-radius: var(--radius-sm);
	}

	.clear-filter:hover {
		text-decoration: underline;
	}

	.dashboard-results {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		transition:
			opacity 220ms ease,
			transform 220ms ease,
			height 280ms ease;
	}

	.dashboard-results.is-loading {
		opacity: 0.3;
	}

	:global(.dashboard-results.is-entering) {
		animation: resultsIn 260ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	@keyframes resultsIn {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.active-filters {
		display: grid;
		grid-template-rows: 0fr;
		opacity: 0;
		transition:
			grid-template-rows 240ms ease,
			opacity 200ms ease,
			margin 240ms ease;
	}

	.active-filters.has-filters {
		grid-template-rows: 1fr;
		opacity: 1;
		margin-top: calc(var(--spacing-sm) * -1);
	}

	.active-filters:not(.has-filters) {
		margin-bottom: calc(var(--spacing-lg) * -1);
	}

	.active-filters-inner {
		overflow: hidden;
		min-height: 0;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.active-filters-label {
		font: var(--label);
		color: var(--gray);
	}

	.filter-chip {
		padding: 4px 10px;
		font-size: 0.875rem;
		color: var(--primary-color);
		background: var(--status-blue-bg);
		border: 1px solid color-mix(in srgb, var(--secondary-color) 25%, transparent);
		border-radius: 999px;
		animation: chipIn 240ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	@keyframes chipIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dashboard-results {
			transition: none;
		}

		:global(.dashboard-results.is-entering) {
			animation: none;
		}

		.active-filters {
			transition: none;
		}

		.filter-chip {
			animation: none;
		}
	}

	.dashboard-charts {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.demand-profile-grid {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
		gap: var(--spacing-md);
		align-items: stretch;
	}

	.demand-profile-grid :global(.panel) {
		height: 100%;
	}

	.state-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-md);
	}

	.state-card h2 {
		font: var(--h3);
		color: var(--heading-color);
	}

	.state-card.error {
		border-color: var(--status-red);
	}

	@media (max-width: 1100px) {
		.filters {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.filter-actions {
			grid-column: 1 / -1;
			justify-content: flex-end;
		}
	}

	@media (max-width: 760px) {
		.demand-profile-grid {
			grid-template-columns: 1fr;
		}

		.filters {
			grid-template-columns: 1fr;
		}

		.filter-actions {
			flex-direction: column;
		}

		.filter-actions :global(button),
		.clear-filter {
			width: 100%;
			text-align: center;
		}
	}
</style>
