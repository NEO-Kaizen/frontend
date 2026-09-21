<script lang="ts">
	import { untrack } from 'svelte';
	import { isRequired } from '$lib/utils/validations';
	import type { PendingFieldRef } from '$lib/types/pendency';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';

	export interface PendencyRequestItem {
		fieldKey: string;
		comment: string;
	}

	interface Props {
		/** Itens pré-selecionados (fluxo de marcação por campo do Quick Action). */
		entries: { field: PendingFieldRef; comment: string }[];
		initialObservation?: string;
		initialRequestAttachment?: boolean;
		isSaving?: boolean;
		serverError?: string | null;
		onConfirm: (value: {
			observation: string;
			requestAttachment: boolean;
			items: PendencyRequestItem[];
		}) => void;
		onRemoveItem?: (fieldKey: string) => void;
		/**
		 * Abre o fluxo de alteração de campos do Quick Action (marcação por
		 * campo). Quando informado, o modal exibe o botão correspondente e
		 * fecha para dar lugar àquele fluxo — sem duplicar a implementação.
		 */
		onRequestFieldChange?: () => void;
		onclose: () => void;
	}

	let {
		entries,
		initialObservation = '',
		initialRequestAttachment = false,
		isSaving = false,
		serverError = null,
		onConfirm,
		onRemoveItem,
		onRequestFieldChange,
		onclose
	}: Props = $props();

	// Cópia de trabalho do lote: observação geral + pedido de anexo. Os campos
	// (fluxo de marcação) chegam prontos via `entries` e são só leitura aqui.
	let observation = $state(untrack(() => initialObservation));
	let requestAttachment = $state(untrack(() => initialRequestAttachment));
	let formError = $state('');

	function handleFieldChangeRequest(): void {
		onclose();
		onRequestFieldChange?.();
	}

	function handleConfirm(): void {
		const items = entries.map(({ field, comment }) => ({
			fieldKey: field.fieldKey,
			comment: comment.trim()
		}));
		// Contrato v0.5 §6: pelo menos `observation` (trim não vazio) OU itens.
		// Sem campos, a observação passa a ser obrigatória. Só-anexo não
		// existe no contrato (`requestAttachment` sozinho não forma payload).
		if (!isRequired(observation) && items.length === 0) {
			formError = 'Informe uma observação ou solicite alterações de campos para criar a pendência.';
			return;
		}
		if (items.some((item) => !isRequired(item.comment))) {
			formError = 'Informe o comentário de cada campo selecionado.';
			return;
		}
		formError = '';
		onConfirm({ observation: observation.trim(), requestAttachment, items });
	}
</script>

<Modal title="Solicitar pendência" {onclose}>
	<div class="field">
		<Textarea
			label="Observação"
			required={entries.length === 0}
			placeholder="Descreva o que precisa ser corrigido ou informado..."
			bind:value={observation}
			rows={4}
			maxlength={2000}
		/>
	</div>

	<label class="attachment-check">
		<input type="checkbox" bind:checked={requestAttachment} />
		<span>Solicitar anexo</span>
	</label>
	<p class="hint">O anexo é solicitado para a pendência inteira, não por campo.</p>

	{#if entries.length > 0}
		<div class="block">
			<p class="block-title">Campos marcados ({entries.length})</p>
			<ul class="entry-list">
				{#each entries as entry (entry.field.fieldKey)}
					<li class="entry-row">
						<div class="entry-text">
							<span class="entry-label">{entry.field.fieldLabel}</span>
							<span class="entry-comment">{entry.comment}</span>
						</div>
						{#if onRemoveItem}
							<button
								type="button"
								class="entry-remove"
								onclick={() => onRemoveItem(entry.field.fieldKey)}
								aria-label={`Remover a marcação do campo "${entry.field.fieldLabel}".`}
								title="Remover marcação"
							>
								Remover
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if onRequestFieldChange}
		<Button
			variant="outline-neutral"
			size="full"
			disabled={isSaving}
			onclick={handleFieldChangeRequest}
		>
			Solicitar alterações de campos
		</Button>
	{/if}

	{#if formError}
		<p class="form-error" role="alert">{formError}</p>
	{/if}
	{#if serverError}
		<p class="form-error" role="alert">{serverError}</p>
	{/if}

	<div class="modal-actions">
		<Button variant="outline-neutral" onclick={onclose} disabled={isSaving}>Cancelar</Button>
		<Button variant="primary" onclick={handleConfirm} loading={isSaving}>
			{isSaving ? 'Enviando…' : 'Solicitar pendência'}
		</Button>
	</div>
</Modal>

<style>
	.field {
		margin-bottom: var(--spacing-md);
	}

	.attachment-check {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--black);
		cursor: pointer;
	}

	.attachment-check input {
		width: 16px;
		height: 16px;
		accent-color: var(--secondary-color);
	}

	.block {
		margin: var(--spacing-md) 0;
	}

	.block-title {
		margin: 0 0 var(--spacing-sm) 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--black);
		letter-spacing: 0.02em;
	}

	.entry-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 220px;
		overflow-y: auto;
	}

	.entry-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-sm);
		padding: 8px 10px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
	}

	.entry-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.entry-label {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--black);
	}

	.entry-comment {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
		word-break: break-word;
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}

	.entry-remove {
		background: none;
		border: none;
		padding: 2px 4px;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--status-red);
		cursor: pointer;
		flex-shrink: 0;
	}

	.entry-remove:hover {
		text-decoration: underline;
	}

	.entry-remove:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.hint {
		margin: 0 0 var(--spacing-md) 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--gray);
		line-height: 1.5;
	}

	.form-error {
		margin: var(--spacing-md) 0 0 0;
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--status-red-bg);
		border-radius: var(--radius-sm);
		color: var(--status-red);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
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
