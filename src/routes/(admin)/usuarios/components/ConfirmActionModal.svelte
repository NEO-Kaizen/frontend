<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';

	interface Props {
		title: string;
		message: string;
		confirmLabel: string;
		loading?: boolean;
		error?: string;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		title,
		message,
		confirmLabel,
		loading = false,
		error = '',
		onconfirm,
		oncancel
	}: Props = $props();
</script>

<Modal {title} onclose={oncancel}>
	<p class="confirm-message">{message}</p>

	{#if error}
		<p class="confirm-error" role="alert">{error}</p>
	{/if}

	<div class="modal-actions">
		<Button variant="outline-neutral" onclick={oncancel} disabled={loading}>Cancelar</Button>
		<Button variant="primary" onclick={onconfirm} {loading}>
			{confirmLabel}
		</Button>
	</div>
</Modal>

<style>
	.confirm-message {
		margin: 0;
		font: var(--paragrafo);
	}

	.confirm-error {
		margin: var(--spacing-md) 0 0;
		font: var(--paragrafo);
		color: var(--status-red);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-lg);
	}
</style>
