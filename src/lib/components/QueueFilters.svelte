<script lang="ts">
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	type FilterOption = {
		value: string;
		label: string;
	};

	interface Props {
		status?: string;
		priority?: string;
		assignee?: string;
		statusOptions: FilterOption[];
		priorityOptions: FilterOption[];
		assigneeOptions: FilterOption[];
		onFilterChange?: () => void;
		onClear?: () => void;
	}

	let {
		status = $bindable('all'),
		priority = $bindable('all'),
		assignee = $bindable('all'),
		statusOptions,
		priorityOptions,
		assigneeOptions,
		onFilterChange,
		onClear
	}: Props = $props();

	function clearFilters() {
		status = 'all';
		priority = 'all';
		assignee = 'all';
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
				bind:value={status}
				onchange={onFilterChange}
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
				bind:value={priority}
				onchange={onFilterChange}
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
				bind:value={assignee}
				onchange={onFilterChange}
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
	.clear-action :global(button) {
		background-color: rgba(0, 51, 153, 0.08);
		color: var(--primary-color);
		border-color: transparent;
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
