<script lang="ts">
	import Button from './Button.svelte';
	import FilterSelect from './FilterSelect.svelte';
	import Icon from './Icon.svelte';

	type FilterOption = {
		value: string;
		label: string;
	};

	interface Props {
		status: string;
		priority: string;
		assignee: string;
		statusOptions: FilterOption[];
		priorityOptions: FilterOption[];
		assigneeOptions: FilterOption[];
		onFilterChange: (filters: { status: string; priority: string; assignee: string }) => void;
		onClear?: () => void;
		search?: string;
		onClearSearch?: () => void;
	}

	let {
		status,
		priority,
		assignee,
		statusOptions,
		priorityOptions,
		assigneeOptions,
		onFilterChange,
		onClear,
		search = '',
		onClearSearch
	}: Props = $props();

	function clearFilters() {
		onClear?.();
	}
</script>

<div class="queue-filters">
	<div class="filters">
		<div class="filter-item">
			<FilterSelect
				icon="filterList"
				label="Status"
				ariaLabel="Filtrar por status"
				value={status}
				options={statusOptions}
				clearValue="all"
				onchange={(next) => onFilterChange({ status: next, priority, assignee })}
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
				onchange={(next) => onFilterChange({ status, priority: next, assignee })}
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
				onchange={(next) => onFilterChange({ status, priority, assignee: next })}
			/>
		</div>
	</div>

	<div class="clear-action">
		<Button variant="outline-neutral" onclick={clearFilters}>
			<Icon iconName="close" iconSize="md" />
			Limpar
		</Button>
	</div>

	{#if search}
		<div class="search-chip">
			<span title={search}>Busca: &ldquo;{search}&rdquo;</span>
			<button type="button" aria-label="Limpar busca" onclick={onClearSearch}>
				<Icon iconName="close" iconSize="md" />
			</button>
		</div>
	{/if}
</div>

<style>
	.queue-filters {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-sm);
		width: 100%;
		padding: var(--spacing-md);
		box-sizing: border-box;
		background-color: var(--white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
	}

	.filters {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.filter-item {
		width: 250px;
		min-width: 250px;
		flex-shrink: 0;
	}

	.clear-action {
		flex-shrink: 0;
	}

	.search-chip {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		min-width: 0;
		max-width: 300px;
		flex-shrink: 1;
		padding: var(--spacing-xs) var(--spacing-sm);
		background-color: rgba(0, 51, 153, 0.08);
		color: var(--primary-color);
		border-radius: var(--radius-sm);
		font: var(--paragrafo);
	}

	.search-chip span {
		min-width: 0;
		padding: 0 var(--spacing-sm);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.search-chip button {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		cursor: pointer;
	}
	@media (max-width: 900px) {
		.queue-filters {
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
