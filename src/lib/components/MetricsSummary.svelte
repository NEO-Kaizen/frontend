<script lang="ts">
	import IconBadge from './IconBadge.svelte';
	import type { MetricItem } from '$lib/types/metrics';

	interface Props {
		metrics: MetricItem[];
	}

	let { metrics }: Props = $props();
</script>

<dl class="metrics-summary">
	{#each metrics as metric (metric.label)}
		<div class="metric-card">
			<IconBadge iconName={metric.iconName} variant={metric.tone} />

			<div class="metric-content">
				<dt class="metric-label">{metric.label}</dt>
				<dd class="metric-value">{metric.value}</dd>
			</div>
		</div>
	{/each}
</dl>

<style>
	.metrics-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--spacing-md);
		width: 100%;
	}

	.metric-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--spacing-sm);
		min-width: 0;
		padding: var(--spacing-md);
		background-color: var(--white);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		box-shadow: var(--regular-shadow);
		box-sizing: border-box;
	}

	.metric-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.metric-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.metric-value {
		font-size: 1.25rem;
		font-weight: 700;
		line-height: 1.2;
		color: var(--text-color);
	}

	@media (max-width: 900px) {
		.metrics-summary {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 560px) {
		.metrics-summary {
			grid-template-columns: 1fr;
		}
	}
</style>
