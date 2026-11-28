<script lang="ts">
	import { onDestroy } from 'svelte';
	import Button from './Button.svelte';
	import FilterSelect from './FilterSelect.svelte';
	import Icon from './Icon.svelte';
	import Input from './Input.svelte';
	import type { QueueFiltersState, QueueSortField, QueueSortOrder } from '$lib/types/queue';
	import { MAX_SEARCH_LENGTH } from '$lib/utils/queue-filters';

	const SEARCH_DEBOUNCE_MS = 300;

	type FilterOption = {
		value: string;
		label: string;
	};

	interface Props {
		status: string;
		priority: string;
		assignee: string;
		department: string;
		dateFrom: string;
		dateTo: string;
		sortBy: QueueSortField;
		sortOrder: QueueSortOrder;
		statusOptions: FilterOption[];
		priorityOptions: FilterOption[];
		assigneeOptions: FilterOption[];
		departmentOptions: FilterOption[];
		sortByOptions: FilterOption[];
		sortOrderOptions: FilterOption[];
		onFilterChange: (filters: QueueFiltersState) => void;
		onClear?: () => void;
		search?: string;
		isSearching?: boolean;
		onSearch?: (term: string) => void;
	}

	let {
		status,
		priority,
		assignee,
		department,
		dateFrom,
		dateTo,
		sortBy,
		sortOrder,
		statusOptions,
		priorityOptions,
		assigneeOptions,
		departmentOptions,
		sortByOptions,
		sortOrderOptions,
		onFilterChange,
		onClear,
		search = '',
		isSearching = false,
		onSearch
	}: Props = $props();

	function getInitialSearchValue(): string {
		return search;
	}

	const initialSearch = getInitialSearchValue();

	let searchValue = $state(initialSearch);
	let lastSubmitted = initialSearch;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const next = search;
		if (next !== lastSubmitted) {
			lastSubmitted = next;
			searchValue = next;
		}
	});

	onDestroy(() => clearTimeout(debounceTimer));

	function submitSearch(value: string) {
		clearTimeout(debounceTimer);
		const term = value.trim();
		lastSubmitted = term;
		onSearch?.(term);
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => submitSearch(searchValue), SEARCH_DEBOUNCE_MS);
	}

	function emitChange(overrides: Partial<QueueFiltersState> = {}) {
		// Uma troca de filtro/ordenação não pode ser sobrescrita por um debounce
		// de busca que ainda estava pendente. Volta o campo ao termo aplicado
		// para não deixar texto visível divergente dos resultados.
		clearTimeout(debounceTimer);
		searchValue = search;
		lastSubmitted = search;

		onFilterChange({
			status,
			priority,
			assignee,
			department,
			dateFrom,
			dateTo,
			sortBy,
			sortOrder,
			...overrides
		});
	}

	function handleDateFromChange(event: Event) {
		emitChange({ dateFrom: (event.currentTarget as HTMLInputElement).value });
	}

	function handleDateToChange(event: Event) {
		emitChange({ dateTo: (event.currentTarget as HTMLInputElement).value });
	}

	function handleSubmit(event?: Event) {
		event?.preventDefault();
		submitSearch(searchValue);
	}

	function clearFilters() {
		clearTimeout(debounceTimer);
		searchValue = '';
		lastSubmitted = '';
		onClear?.();
	}
</script>

<div class="queue-filters">
	<div class="queue-filters__main">
		<div class="filters">
			<div class="filter-item filter-item--search">
				<form onsubmit={handleSubmit} role="search" aria-busy={isSearching}>
					<Input
						type="search"
						label="Buscar"
						aria-label="Buscar por título, conteúdo, protocolo, solicitante ou e-mail"
						placeholder="Título, conteúdo, protocolo, solicitante ou e-mail"
						maxlength={MAX_SEARCH_LENGTH}
						bind:value={searchValue}
						actionIcon="search"
						actionLabel="Buscar"
						oninput={handleInput}
						onAction={handleSubmit}
					/>
				</form>
			</div>

			<div class="filter-item">
				<FilterSelect
					icon="filterList"
					label="Status"
					ariaLabel="Filtrar por status"
					value={status}
					options={statusOptions}
					clearValue="all"
					onchange={(next) => emitChange({ status: next })}
				/>
			</div>

			<div class="filter-item">
				<FilterSelect
					icon="filterList"
					label="Prioridade"
					ariaLabel="Filtrar por prioridade"
					value={priority}
					options={priorityOptions}
					clearValue="all"
					onchange={(next) => emitChange({ priority: next })}
				/>
			</div>

			<div class="filter-item">
				<FilterSelect
					icon="filterList"
					label="Responsável"
					ariaLabel="Filtrar por responsável"
					value={assignee}
					options={assigneeOptions}
					clearValue="all"
					onchange={(next) => emitChange({ assignee: next })}
				/>
			</div>

			<div class="filter-item">
				<FilterSelect
					icon="filterList"
					label="Departamento"
					ariaLabel="Filtrar por departamento"
					value={department}
					options={departmentOptions}
					clearValue="all"
					onchange={(next) => emitChange({ department: next })}
				/>
			</div>

			<div class="filter-item">
				<Input
					type="date"
					label="Data inicial"
					aria-label="Filtrar por data inicial"
					value={dateFrom}
					max={dateTo || undefined}
					onchange={handleDateFromChange}
				/>
			</div>

			<div class="filter-item">
				<Input
					type="date"
					label="Data final"
					aria-label="Filtrar por data final"
					value={dateTo}
					min={dateFrom || undefined}
					onchange={handleDateToChange}
				/>
			</div>

			<div class="filter-item">
				<FilterSelect
					label="Ordenar por"
					ariaLabel="Ordenar por"
					value={sortBy}
					options={sortByOptions}
					onchange={(next) => emitChange({ sortBy: next as QueueSortField })}
				/>
			</div>

			<div class="filter-item">
				<FilterSelect
					label="Direção"
					ariaLabel="Direção da ordenação"
					value={sortOrder}
					options={sortOrderOptions}
					onchange={(next) => emitChange({ sortOrder: next as QueueSortOrder })}
				/>
			</div>
		</div>

		<div class="clear-action">
			<Button variant="outline-neutral" onclick={clearFilters}>
				<Icon iconName="close" iconSize="md" />
				Limpar
			</Button>
		</div>
	</div>
</div>

<style>
	.queue-filters {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
		padding: var(--spacing-md);
		box-sizing: border-box;
		background-color: var(--white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
	}

	.queue-filters__main {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.filters {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		align-items: flex-end;
		min-width: 0;
		gap: var(--spacing-sm);
		min-width: 0;
	}

	.filter-item {
		flex: 1 1 220px;
		width: 220px;
		min-width: 0;
	}

	.filter-item--search {
		flex-basis: 300px;
		width: 300px;
	}

	.clear-action {
		flex: 0 0 auto;
		margin-left: auto;
	}

	@media (max-width: 900px) {
		.queue-filters__main {
			align-items: stretch;
			flex-direction: column;
		}

		.filters {
			flex-wrap: wrap;
		}

		.filter-item {
			flex: 1 1 250px;
			width: auto;
		}
	}

	@media (max-width: 560px) {
		.filters {
			flex-direction: column;
		}

		.filter-item {
			width: 100%;
			min-width: 0;
			flex-basis: auto;
		}
	}
</style>
