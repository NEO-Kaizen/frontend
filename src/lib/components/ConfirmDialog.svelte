<script lang="ts">
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onConfirm: () => void;
		onClose: () => void;
	}

	let {
		open,
		title,
		description = '',
		confirmLabel = 'Confirmar',
		cancelLabel = 'Cancelar',
		onConfirm,
		onClose
	}: Props = $props();

	let dialog = $state<HTMLDialogElement>();

	const titleId = `confirm-dialog-title-${Math.random().toString(36).slice(2, 8)}`;

	$effect(() => {
		if (!dialog) return;

		if (open && !dialog.open) {
			try {
				dialog.showModal();
			} catch {
				// já aberto — ignora
			}
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});
</script>

<dialog
	bind:this={dialog}
	role="alertdialog"
	aria-labelledby={titleId}
	oncancel={(e) => {
		e.preventDefault();
		onClose();
	}}
>
	<div class="content">
		<h2 id={titleId}>{title}</h2>

		{#if description}
			<p>{description}</p>
		{/if}

		<div class="actions">
			<Button variant="outline-neutral" onclick={onClose}>{cancelLabel}</Button>
			<Button variant="primary" onclick={onConfirm}>{confirmLabel}</Button>
		</div>
	</div>
</dialog>

<style>
	dialog {
		margin: auto;
		border: none;
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		background-color: var(--white);
		box-shadow: var(--regular-shadow);
		width: min(420px, 90vw);
	}

	dialog::backdrop {
		background-color: rgba(15, 26, 42, 0.5);
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		text-align: center;
	}

	h2 {
		margin: 0;
		font: var(--h4);
		color: var(--text-color-primary);
	}

	p {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--gray);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-md);
		margin-top: var(--spacing-lg);
	}
</style>
