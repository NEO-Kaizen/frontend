<script lang="ts">
	import { untrack } from 'svelte';
	import type { PendingFieldRef } from '$lib/types/pendency';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';

	interface Props {
		entries: { field: PendingFieldRef; comment: string }[];
		initialObservation?: string;
		initialRequestAttachment?: boolean;
		isSaving?: boolean;
		serverError?: string | null;
		onConfirm: (value: { observation: string; requestAttachment: boolean }) => void;
		onRemoveItem?: (fieldKey: string) => void;
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
		onclose
	}: Props = $props();

	// Cópia de trabalho do lote: observação geral + pedido de anexo. Os campos
	// vêm do `pendingDraft` (seleção por campo) e são só leitura aqui.
	let observation = $state(untrack(() => initialObservation));
	let requestAttachment = $state(untrack(() => initialRequestAttachment));
	let formError = $state('');

	function handleConfirm(): void {
		if (!observation.trim() && entries.length === 0) {
			formError =
				'Informe uma observação ou selecione ao menos um campo para solicitar a pendência.';
			return;
		}
		formError = '';
		onConfirm({ observation: observation.trim(), requestAttachment });
	}
</script>

<Modal title="Solicitar pendência" {onclose}>
	<div class="field">
		<Textarea
			label="Observação geral"
			placeholder="Ex.: Favor complementar a justificativa da solicitação."
			bind:value={observation}
			rows={4}
			maxlength={2000}
		/>
	</div>

	<label class="attachment-check">
		<input type="checkbox" bind:checked={requestAttachment} />
		<span>Solicitar anexo ao solicitante</span>
	</label>

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
	{:else}
		<p class="hint">
			Nenhum campo marcado. A pendência será enviada somente com a observação geral.
		</p>
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
			{isSaving ? 'Enviando…' : 'Confirmar solicitação'}
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
		margin-bottom: var(--spacing-md);
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
		margin: 0 0 var(--spacing-md) 0;
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
