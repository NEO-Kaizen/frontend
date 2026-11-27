<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { formatDateTime } from '$lib/utils/dates';

	interface Props {
		calculatedAt: string;
		onRefresh: () => void;
		isRefreshing?: boolean;
	}

	let { calculatedAt, onRefresh, isRefreshing = false }: Props = $props();
</script>

<div class="calculated-header">
	<span class="card-label">Calculado em</span>
	<Button
		variant="outline-neutral"
		title="Atualizar tempos por Status"
		disabled={isRefreshing}
		loading={isRefreshing}
		onclick={onRefresh}
	>
		<Icon iconName="autorenew" iconSize="sm" />
		<span>{isRefreshing ? 'Atualizando…' : 'Atualizar'}</span>
	</Button>
</div>
<time class="card-value card-date" datetime={calculatedAt}>{formatDateTime(calculatedAt)}</time>

<style>
	.calculated-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
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

	.card-date {
		font-size: 15px;
	}
</style>
