<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { StatusInterval } from '$lib/types/status-time';
	import { formatDateTime } from '$lib/utils/dates';
	import { formatDuration, intervalDurationMilliseconds } from '$lib/utils/durations';

	interface Props {
		intervals: StatusInterval[];
		calculatedAt: string;
	}

	let { intervals, calculatedAt }: Props = $props();
</script>

<section class="timeline-section" aria-labelledby="status-time-timeline-title">
	<h4 id="status-time-timeline-title" class="section-title">Linha do tempo por Status</h4>

	<ol class="timeline">
		{#each intervals as interval (interval.enteredAt)}
			<li class={{ 'timeline-item': true, current: interval.exitedAt === null }}>
				<span class="timeline-marker" aria-hidden="true"></span>

				<div class="timeline-body">
					<div class="timeline-header">
						<h5 class="status-name">{interval.status}</h5>
						{#if interval.exitedAt === null}
							<span class="badge current-badge">
								<Icon iconName="check" iconSize="sm" ariaLabel="Status atual" />
								Status atual
							</span>
						{/if}
						{#if interval.isPaused}
							<span class="badge paused-badge">
								<Icon iconName="pending" iconSize="sm" ariaLabel="Período pausado" />
								Pausado — aguardando informação
							</span>
						{/if}
					</div>

					<dl class="interval-details">
						<dt>Entrada</dt>
						<dd>
							<time datetime={interval.enteredAt}>{formatDateTime(interval.enteredAt)}</time>
						</dd>

						<dt>Saída</dt>
						<dd>
							{#if interval.exitedAt}
								<time datetime={interval.exitedAt}>{formatDateTime(interval.exitedAt)}</time>
							{:else}
								Em andamento — calculado em
								<time datetime={calculatedAt}>{formatDateTime(calculatedAt)}</time>
							{/if}
						</dd>

						<dt>Duração</dt>
						<dd>{formatDuration(intervalDurationMilliseconds(interval, calculatedAt))}</dd>

						<dt>Ativo</dt>
						<dd>{formatDuration(interval.activeMilliseconds)}</dd>

						<dt>Pausado</dt>
						<dd>{formatDuration(interval.pausedMilliseconds)}</dd>
					</dl>
				</div>
			</li>
		{/each}
	</ol>
</section>

<style>
	.timeline-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.section-title {
		margin: 0;
		font: var(--label);
		color: var(--secondary-color);
	}

	.timeline {
		list-style: none;
		margin: 0;
		padding: 0 0 0 var(--spacing-lg);
		border-left: 2px solid var(--white-gray);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.timeline-item {
		position: relative;
	}

	.timeline-marker {
		position: absolute;
		left: calc(-1 * var(--spacing-lg) - 6px);
		top: 4px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--secondary-color);
	}

	.timeline-item.current {
		background: var(--status-green-bg);
		border: 1px solid var(--status-green);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm) var(--spacing-md);
	}

	.timeline-item.current .timeline-marker {
		left: calc(-1 * var(--spacing-lg) - 6px + var(--spacing-md));
		background: var(--status-green);
	}

	.timeline-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		min-width: 0;
	}

	.timeline-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.status-name {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 700;
		color: var(--black);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 999px;
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
	}

	.current-badge {
		background: var(--status-green);
		color: var(--white);
	}

	.paused-badge {
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
		border: 1px solid var(--status-yellow);
	}

	.interval-details {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		column-gap: var(--spacing-md);
		row-gap: 4px;
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
	}

	.interval-details dt {
		font-weight: 600;
		color: var(--secondary-color);
	}

	.interval-details dd {
		margin: 0;
		color: var(--black);
	}
</style>
