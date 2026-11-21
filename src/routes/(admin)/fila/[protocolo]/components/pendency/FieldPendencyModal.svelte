<script lang="ts">
	import { untrack } from 'svelte';
	import type { PendingFieldRef } from '$lib/types/pendency';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';

	interface Props {
		field: PendingFieldRef;
		existing?: { comment: string } | null;
		onConfirm: (value: { comment: string }) => void;
		onRemove?: () => void;
		onclose: () => void;
	}

	let { field, existing = null, onConfirm, onRemove, onclose }: Props = $props();

	// O modal é montado por abertura de campo (desmontado ao fechar), então a
	// cópia de trabalho pode ser inicializada direto do estado atual (`untrack`
	// deixa explícita a leitura única, sem reatividade).
	let comment = $state(untrack(() => existing?.comment ?? ''));
	let commentError = $state('');

	function handleSave(): void {
		if (!comment.trim()) {
			commentError = 'Informe o motivo da alteração deste campo.';
			return;
		}
		onConfirm({ comment: comment.trim() });
		onclose();
	}

	function handleRemove(): void {
		onRemove?.();
		onclose();
	}
</script>

<Modal title={field.fieldLabel} {onclose}>
	<div class="block">
		<p class="block-title">Valor atual</p>
		<p class="current-value">{field.currentValue}</p>
	</div>

	<div class="field">
		<Textarea
			label="Justificativa da alteração"
			placeholder="Descreva o que precisa ser corrigido neste campo."
			bind:value={comment}
			error={commentError}
			rows={4}
			maxlength={1000}
		/>
	</div>

	<div class="modal-actions">
		{#if existing}
			<Button variant="outline" onclick={handleRemove}>Remover marcação</Button>
		{/if}
		<Button variant="outline-neutral" onclick={onclose}>Cancelar</Button>
		<Button variant="primary" onclick={handleSave}>Salvar</Button>
	</div>
</Modal>

<style>
	.block {
		margin-bottom: var(--spacing-md);
	}

	.block-title {
		margin: 0 0 var(--spacing-sm) 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--black);
		letter-spacing: 0.02em;
	}

	.current-value {
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--status-blue-bg);
		border-left: 3px solid var(--secondary-color);
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--black);
		line-height: 1.5;
		word-break: break-word;
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}

	.field {
		margin-bottom: var(--spacing-md);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	@media (max-width: 600px) {
		.modal-actions {
			flex-direction: column-reverse;
		}
	}
</style>
