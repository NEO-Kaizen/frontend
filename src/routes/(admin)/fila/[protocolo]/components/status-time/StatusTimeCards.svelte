<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { StatusTimesResponse } from '$lib/types/status-time';
	import { formatDuration } from '$lib/utils/durations';
	import StatusTimeRefresh from './StatusTimeRefresh.svelte';

	interface Props {
		times: StatusTimesResponse;
		onRefresh: () => void;
		isRefreshing?: boolean;
	}

	let { times, onRefresh, isRefreshing = false }: Props = $props();
</script>

<div class="summary-cards">
	<div class="summary-card">
		<span class="card-label">Tempo ativo total</span>
		<strong class="card-value">{formatDuration(times.totalActiveMilliseconds)}</strong>
	</div>

	<div class="summary-card paused-card">
		<span class="card-label">
			<Icon iconName="pending" iconSize="sm" ariaLabel="Tempo pausado" />
			Tempo pausado total
		</span>
		<strong class="card-value">{formatDuration(times.totalPausedMilliseconds)}</strong>
		<span class="card-hint">Aguardando informação</span>
	</div>

	<div class="summary-card">
		<StatusTimeRefresh calculatedAt={times.calculatedAt} {onRefresh} {isRefreshing} />
		<span class="card-hint">Snapshot do cálculo do sistema</span>
	</div>
</div>

<style>
	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-md);
	}

	.summary-card {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: var(--spacing-md);
		background: var(--background-color, #f9fafb);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		min-width: 0;
	}

	.paused-card {
		border-color: var(--status-yellow);
	}

	.card-label {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font: var(--label);
		color: var(--secondary-color);
	}

	.card-value {
		font-family: var(--font-inter);
		font-size: 22px;
		font-weight: 700;
		color: var(--black);
		line-height: 1.3;
	}

	.card-hint {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	@media (max-width: 640px) {
		.summary-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
