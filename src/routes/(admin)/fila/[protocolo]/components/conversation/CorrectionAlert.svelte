<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		message: string;
		count: number;
		onGoToPendency: () => void;
	}

	let { message, count, onGoToPendency }: Props = $props();
</script>

<div class="correction-alert" role="status">
	<span class="alert-text">
		<Icon iconName="warning" iconSize="sm" ariaLabel="Alteração respondida" />
		<span>{message}</span>
	</span>
	<button type="button" class="alert-action" onclick={onGoToPendency}>
		<span>Ver pendência{count === 1 ? '' : 's'}</span>
		<Icon iconName="arrowForward" iconSize="sm" ariaLabel="Ir para a pendência" />
	</button>
</div>

<style>
	.correction-alert {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		flex-wrap: wrap;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		background: var(--status-yellow-bg);
		border: 1px solid var(--status-yellow);
		min-width: 0;
	}

	.alert-text {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		min-width: 0;
		color: var(--status-yellow);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
	}

	.alert-text :global(.material-symbols-outlined) {
		flex-shrink: 0;
	}

	.alert-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--status-yellow);
		background: var(--white);
		color: var(--status-yellow);
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: background 150ms ease;
	}

	.alert-action:hover {
		background: var(--status-yellow-bg);
	}

	.alert-action:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	@media (max-width: 640px) {
		.correction-alert {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
