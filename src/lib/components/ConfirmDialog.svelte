<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		/** Conteúdo adicional (ex.: lista de mudanças) entre a descrição e as ações. */
		details?: Snippet;
		confirmLabel?: string;
		cancelLabel?: string;
		onConfirm: () => void;
		onClose: () => void;
	}

	let {
		open,
		title,
		description = '',
		details,
		confirmLabel = 'Confirmar',
		cancelLabel = 'Cancelar',
		onConfirm,
		onClose
	}: Props = $props();

	let dialog = $state<HTMLDialogElement>();

	const uid = $props.id();
	const titleId = `confirm-dialog-title-${uid}`;

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
	class={{ wide: Boolean(details) }}
	role="alertdialog"
	aria-labelledby={titleId}
	oncancel={(e) => {
		e.preventDefault();
		onClose();
	}}
	onkeydown={(e) => {
		// O Esc é tratado pelo `cancel` nativo; impedir o borbulhamento evita
		// que o Modal pai também feche e descarte o formulário em edição.
		if (e.key === 'Escape') e.stopPropagation();
	}}
>
	<div class="content">
		<h2 id={titleId}>{title}</h2>

		{#if description}
			<p>{description}</p>
		{/if}

		{#if details}
			<div class="details">
				{@render details()}
			</div>
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

	dialog.wide {
		width: min(560px, 92vw);
	}

	.details {
		width: 100%;
		text-align: left;
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
		color: var(--heading-color);
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
