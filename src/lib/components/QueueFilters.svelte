<script lang="ts">
	import Button from './Button.svelte';
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
		<div class="filter-control">
			<Icon iconName="filterList" iconSize="md" />

			<span class="filter-label">Status:</span>

			<select
				name="status"
				aria-label="Filtrar por status"
				value={status}
				onchange={(event) =>
					onFilterChange({ status: event.currentTarget.value, priority, assignee })}
			>
				{#each statusOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<div class="filter-control">
			<Icon iconName="filterList" iconSize="md" />

			<span class="filter-label">Prioridade:</span>

			<select
				name="priority"
				aria-label="Filtrar por prioridade"
				value={priority}
				onchange={(event) =>
					onFilterChange({ status, priority: event.currentTarget.value, assignee })}
			>
				{#each priorityOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<div class="filter-control">
			<span class="filter-label">Responsável:</span>

			<select
				name="assignee"
				aria-label="Filtrar por responsável"
				value={assignee}
				onchange={(event) =>
					onFilterChange({ status, priority, assignee: event.currentTarget.value })}
			>
				{#each assigneeOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
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
		align-items: center;
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

	.filter-control {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		width: 250px;
		min-width: 250px;
		padding: var(--spacing-sm);
		box-sizing: border-box;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
	}

	.filter-control :global(.material-symbols-outlined) {
		flex-shrink: 0;
		color: var(--primary-color);
	}

	.filter-label {
		flex-shrink: 0;
		font: var(--paragrafo);
	}

	select {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		background-color: transparent;
		color: var(--rich-black);
		font: var(--paragrafo);
		outline: none;
		cursor: pointer;
	}

	select:focus-visible {
		outline: 1px solid var(--secondary-color);
		outline-offset: 2px;
	}
	.clear-action {
		flex-shrink: 0;
	}

	.clear-action :global(button) {
		background-color: rgba(0, 51, 153, 0.08);
		color: var(--primary-color);
		border-color: transparent;
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

		.filter-control {
			flex: 1 1 250px;
		}
	}

	@media (max-width: 560px) {
		.filters {
			flex-direction: column;
		}

		.filter-control {
			width: 100%;
			min-width: 0;
			flex-basis: auto;
		}
	}
</style>
