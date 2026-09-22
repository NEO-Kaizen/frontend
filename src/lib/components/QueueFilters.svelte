<script lang="ts">
	import Button from './Button.svelte';
	import FilterSelect from './FilterSelect.svelte';
	import Icon from './Icon.svelte';
	import Input from './Input.svelte';

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
		onSearch?: (term: string) => void;
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
		onSearch,
		onClearSearch
	}: Props = $props();

	let searchValue = $state('');

	$effect(() => {
		searchValue = search;
	});

	function handleSubmit(event?: Event) {
		event?.preventDefault();
		onSearch?.(searchValue.trim());
	}

	function clearFilters() {
		searchValue = '';
		onClear?.();
	}
</script>

<div class="queue-filters">
	<div class="queue-filters__main">
		<div class="filters">
			<div class="filter-item filter-item--search">
				<form onsubmit={handleSubmit} role="search">
					<Input
						type="search"
						label="Buscar"
						aria-label="Buscar por protocolo, solicitante, título da demanda ou e-mail"
						placeholder="Protocolo, solicitante, título da demanda ou e-mail"
						bind:value={searchValue}
						actionIcon="search"
						actionLabel="Buscar"
						oninput={handleSubmit}
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
		border-radius: var(--radius-lg);
	}

	.queue-filters__header {
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}

	.queue-filters__main {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-sm);
		width: 100%;
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

	.filter-item--search {
		width: 300px;
		min-width: 260px;
	}

	.clear-action {
		flex-shrink: 0;
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
