<script lang="ts">
	import IconBadge from './IconBadge.svelte';
	import type { MetricItem, MetricTone } from '$lib/types/metrics';

	interface Props {
		metrics: MetricItem[];
	}

	let { metrics }: Props = $props();

	const toneStyles: Record<MetricTone, { backgroundColor: string; iconColor: string }> = {
		indigo: {
			backgroundColor: 'rgba(182, 196, 255, 0.2)',
			iconColor: 'var(--primary-color)'
		},
		neutral: {
			backgroundColor: '#e5e7eb',
			iconColor: '#4b5563'
		},
		orange: {
			backgroundColor: '#ffedd5',
			iconColor: '#c2410c'
		},
		danger: {
			backgroundColor: '#fee2e2',
			iconColor: '#b91c1c'
		}
	};
</script>

<div class="metrics-summary">
	{#each metrics as metric (metric.label)}
		<div class="metric-card">
			<IconBadge
				iconName={metric.iconName}
				variant="override"
				backgroundColor={toneStyles[metric.tone].backgroundColor}
				iconColor={toneStyles[metric.tone].iconColor}
			/>

			<div class="metric-content">
				<span class="metric-label">{metric.label}</span>
				<strong class="metric-value">{metric.value}</strong>
			</div>
		</div>
	{/each}
</div>

<style>
	.metrics-summary {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
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
