<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import Button from '$lib/components/Button.svelte';
	import FilterSelect from '$lib/components/FilterSelect.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import Pagination from '$lib/components/tables/Pagination.svelte';
	import { AUDIT_ENTITY_OPTIONS } from '$lib/audit/audit-labels';

	import LogDetailModal from './components/LogDetailModal.svelte';
	import LogsTable from './components/LogsTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const logsPath = resolve('/(admin)/historico-de-logs');

	const isFetching = $derived(navigating.to?.route?.id === page.route.id);

	const result = $derived(data.result);
	const logs = $derived(result.ok ? result.data.items : []);
	const total = $derived(result.ok ? result.data.total : 0);
	const limit = $derived(result.ok ? result.data.limit : data.pageSize);
	const currentPage = $derived(result.ok ? result.data.page : data.page);
	const totalPages = $derived(limit > 0 ? Math.ceil(total / limit) : 0);
	const loadError = $derived(result.ok ? '' : result.error.message);

	// A URL é a fonte de verdade do filtro: `data.entityType` volta do load a
	// cada navegação (inclusive back/forward), então não há estado local a
	// ressincronizar.
	const entityOptions = [
		{ value: 'all', label: 'Todos os tipos' },
		...AUDIT_ENTITY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))
	];

	let selectedAuditId = $state<number | null>(null);

	const startItem = $derived(total === 0 ? 0 : (currentPage - 1) * limit + 1);
	const endItem = $derived(Math.min(currentPage * limit, total));

	function buildParams(overrides: Record<string, string | null>): string {
		const params = new SvelteURLSearchParams(page.url.searchParams);

		for (const [key, value] of Object.entries(overrides)) {
			if (value === null || value === 'all') {
				params.delete(key);
			} else {
				params.set(key, value);
			}
		}

		const query = params.toString();

		return query ? `?${query}` : '';
	}

	function goToPage(nextPage: number) {
		const target = `${logsPath}${buildParams({
			page: nextPage > 1 ? String(nextPage) : null
		})}`;

		// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
		// a navegação é validada em runtime pelo SvelteKit.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(target, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function handleFilterChange(nextEntityType: string) {
		const target = `${logsPath}${buildParams({ page: null, entityType: nextEntityType })}`;

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(target, { keepFocus: true, noScroll: true });
	}
</script>

<svelte:head>
	<title>Histórico de Logs | {data.portalConfig.platformName}</title>
</svelte:head>

<main class="content-container logs-page">
	<header class="page-header">
		<h1>Histórico de Logs</h1>

		<p class="page-subtitle">
			Acompanhe os eventos administrativos registrados em {data.portalConfig.platformName}.
		</p>
	</header>

	<section class="logs-card">
		<div class="toolbar">
			<div class="filter-box">
				<FilterSelect
					icon="filterList"
					label="Tipo de log"
					ariaLabel="Filtrar por tipo de log"
					value={data.entityType}
					options={entityOptions}
					clearValue="all"
					onchange={handleFilterChange}
				/>
			</div>
		</div>

		<div class="panel" class:refreshing={isFetching} aria-busy={isFetching}>
			{#if !result.ok && logs.length === 0}
				<div class="state-card error" role="alert">
					<p>{loadError}</p>

					<Button variant="outline" onclick={() => void invalidateAll()}>Tentar novamente</Button>
				</div>
			{:else if logs.length === 0}
				<NotFoundState
					title="Nenhum log encontrado"
					message="Não há eventos de auditoria para o filtro selecionado."
					hint="Ajuste o tipo de log ou aguarde novas ações no sistema."
				/>
			{:else}
				<LogsTable {logs} onselect={(auditId) => (selectedAuditId = auditId)} />

				<div class="table-footer">
					<p class="count">
						Exibindo
						{startItem}-{endItem}
						de {total}
						log{total === 1 ? '' : 's'}
					</p>

					<Pagination {currentPage} {totalPages} onpagechange={goToPage} />
				</div>
			{/if}
		</div>
	</section>
</main>

{#if selectedAuditId !== null}
	<LogDetailModal auditId={selectedAuditId} onclose={() => (selectedAuditId = null)} />
{/if}

<style>
	.logs-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.page-header h1 {
		margin: 0;
		font: var(--h1);
		color: var(--heading-color);
	}

	.page-subtitle {
		margin: 0;
		font: var(--paragrafo);
		color: var(--black);
	}

	.logs-card {
		width: 100%;

		display: flex;
		flex-direction: column;

		background-color: var(--white);

		border: var(--border-default);

		border-radius: var(--radius-md);

		box-shadow: var(--regular-shadow);

		overflow: hidden;
	}

	.logs-card :global(.table-wrapper) {
		width: 100%;
		max-width: 100%;

		border: none;
		border-radius: 0;
		box-shadow: none;
	}

	.toolbar {
		width: 100%;

		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: var(--spacing-md);

		padding: var(--spacing-sm);

		background-color: var(--background-color);

		flex-shrink: 0;
	}

	.filter-box {
		flex: 0 1 320px;
		width: 100%;
		max-width: 320px;
		min-width: 0;
	}

	.panel {
		width: 100%;

		display: flex;
		flex-direction: column;

		min-height: 0;

		transition: opacity 0.15s ease;
	}

	.panel.refreshing {
		opacity: 0.55;

		pointer-events: none;
	}

	.state-card {
		width: 100%;

		min-height: 250px;

		display: flex;
		flex-direction: column;

		align-items: center;
		justify-content: center;

		gap: var(--spacing-md);

		padding: var(--spacing-xl);

		text-align: center;
	}

	.state-card p {
		margin: 0;

		color: var(--gray);
	}

	.state-card.error p {
		color: var(--status-red);
	}

	.table-footer {
		width: 100%;

		min-height: 62px;

		display: flex;
		align-items: center;
		justify-content: space-between;

		gap: var(--spacing-md);

		padding: var(--spacing-sm) var(--spacing-md);

		background-color: var(--white);

		border-top: var(--border-default);

		flex-shrink: 0;
	}

	.count {
		margin: 0;

		font: var(--label);

		font-size: 11px;

		color: var(--gray);

		white-space: nowrap;
	}

	@media (max-width: 800px) {
		.toolbar {
			flex-direction: column;

			align-items: stretch;
		}

		.filter-box {
			flex: none;
			max-width: none;
		}

		.table-footer {
			flex-direction: column;

			align-items: flex-start;
		}
	}
</style>
