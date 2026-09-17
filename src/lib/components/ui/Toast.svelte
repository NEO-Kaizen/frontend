<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { ToastMessage } from '$lib/states/toast.svelte';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		toast: ToastMessage;
		onclose: (id: string) => void;
	}

	let { toast, onclose }: Props = $props();

	let iconName: IconName = $derived.by(() => {
		switch (toast.type) {
			case 'success':
				return 'check';
			case 'error':
				return 'info';
			case 'info':
				return 'info';
			case 'warning':
				return 'warning';
			default:
				return 'info';
		}
	});
</script>

<div
	class="toast-item {toast.type}"
	role={toast.type === 'error' ? 'alert' : 'status'}
	aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
	aria-atomic="true"
>
	<div class="toast-content">
		<Icon {iconName} iconSize="sm" />
		<span class="toast-message">{toast.message}</span>
	</div>

	<button
		type="button"
		class="toast-close-btn"
		onclick={() => onclose(toast.id)}
		aria-label="Fechar notificação"
	>
		<Icon iconName="close" iconSize="sm" />
	</button>
</div>

<style>
	.toast-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 16px;
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
		pointer-events: auto;
		transition: var(--transition-default);
		color: var(--white);
	}

	.toast-item.success {
		background-color: var(--status-green);
	}

	.toast-item.error {
		background-color: var(--status-red);
	}

	.toast-item.info {
		background-color: var(--status-blue);
	}

	.toast-item.warning {
		background-color: var(--status-yellow);
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.toast-message {
		font: var(--paragrafo);
		color: var(--white);
		font-weight: 500;
	}

	.toast-close-btn {
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.toast-close-btn:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.toast-close-btn:focus-visible {
		outline: 2px solid var(--white);
		outline-offset: 2px;
	}
</style>
