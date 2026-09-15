<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { ToastMessage } from '$lib/states/toast.svelte';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		toast: ToastMessage;
		onClose: (id: string) => void;
	}

	let { toast, onClose }: Props = $props();

	let isSuccess = $derived(toast.type === 'success');

	// Seleção de ícones corretos baseados no dicionário src/lib/types/icons.ts
	let iconName: IconName = $derived(isSuccess ? 'check' : 'info');
</script>

<div class="toast-item {toast.type}" role="alert" aria-live="polite">
	<div class="toast-content">
		<Icon {iconName} iconSize="sm" />
		<span class="toast-message">{toast.message}</span>
	</div>

	<button
		type="button"
		class="toast-close-btn"
		onclick={() => onClose(toast.id)}
		aria-label="Close toast"
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
		border-radius: 8px;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -4px rgba(0, 0, 0, 0.1);
		pointer-events: auto;
		transition: all 0.3s ease;
		color: #ffffff;
	}

	.toast-item.success {
		background-color: #059669;
	}

	.toast-item.error {
		background-color: #dc2626;
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.toast-message {
		font-size: 0.875rem;
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
		outline: 2px solid white;
		outline-offset: 2px;
	}
</style>
