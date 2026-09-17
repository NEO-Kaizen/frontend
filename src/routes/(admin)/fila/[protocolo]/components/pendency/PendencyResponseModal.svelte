<script lang="ts">
	import { requestAgain, validatePendency } from '$lib/services/pendency.service';
	import {
		PENDENCY_STATUS_LABELS,
		type PendingItem,
		type PendencyStatus
	} from '$lib/types/pendency';
	import { formatDateTime } from '$lib/utils/dates';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';

	interface Props {
		item: PendingItem;
		onclose: () => void;
		onSaved?: () => void;
	}

	let { item, onclose, onSaved }: Props = $props();

	let current = $state<PendingItem | null>(null);
	let currentDisplay = $derived(current ?? item);

	let isValidating = $state(false);
	let showReopenInput = $state(false);
	let reopenComment = $state('');
	let reopenError = $state('');
	let actionError = $state('');
	let done = $state<false | 'validated' | 'reopened'>(false);

	function statusTheme(status: PendencyStatus): { bg: string; color: string } {
		switch (status) {
			case 'responded':
				return { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow)' };
			case 'validated':
				return { bg: 'var(--status-green-bg)', color: 'var(--status-green)' };
			default:
				return { bg: 'var(--status-blue-bg)', color: 'var(--status-blue)' };
		}
	}

	let theme = $derived(statusTheme(currentDisplay.status));

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function handleValidate(): Promise<void> {
		if (isValidating) return;
		isValidating = true;
		actionError = '';

		const result = await validatePendency(currentDisplay.protocol, currentDisplay.id);
		isValidating = false;

		if (result.ok) {
			current = result.data;
			done = 'validated';
			onSaved?.();
		} else {
			actionError = result.error.message;
		}
	}

	function handleReopenToggle(): void {
		showReopenInput = !showReopenInput;
		reopenError = '';
	}

	async function handleReopen(): Promise<void> {
		if (isValidating || !reopenComment.trim()) {
			reopenError = 'Informe o motivo para solicitar novamente.';
			return;
		}

		isValidating = true;
		actionError = '';
		reopenError = '';

		const result = await requestAgain(currentDisplay.protocol, currentDisplay.id, {
			comment: reopenComment.trim()
		});
		isValidating = false;

		if (result.ok) {
			current = result.data;
			done = 'reopened';
			onSaved?.();
		} else {
			actionError = result.error.message;
		}
	}
</script>

<Modal title={done ? 'Pendência atualizada' : currentDisplay.field.fieldLabel} {onclose}>
	{#if done}
		<div class="success-content">
			<span class="success-icon" aria-hidden="true">
				<Icon iconName={done === 'validated' ? 'check' : 'reopen'} iconSize="lg" />
			</span>
			<p class="success-title">
				{done === 'validated'
					? 'Alteração validada com sucesso.'
					: 'Solicitação reenviada ao solicitante.'}
			</p>
			<div class="modal-actions">
				<Button variant="primary" onclick={onclose}>Concluir</Button>
			</div>
		</div>
	{:else}
		<p class="status-row">
			<span class="status-badge" style:background-color={theme.bg} style:color={theme.color}>
				{PENDENCY_STATUS_LABELS[currentDisplay.status]}
			</span>
			<span class="date">Solicitada em {formatDateTime(currentDisplay.createdAt)}</span>
		</p>

		<div class="block">
			<p class="block-title">Solicitado</p>
			<div class="diff">
				<div class="diff-line diff-old">
					<span class="diff-glyph" aria-hidden="true">−</span>
					<span class="diff-content">
						<span class="diff-label">Valor atual</span>
						<span class="diff-value">{currentDisplay.field.currentValue}</span>
					</span>
				</div>
			</div>
			<p class="block-note">{currentDisplay.comment}</p>
			{#if currentDisplay.attachments.length > 0}
				<ul class="attachments-list">
					{#each currentDisplay.attachments as attachment (attachment.fileName)}
						<li class="attachment-item">
							<Icon iconName="description" iconSize="sm" />
							<span class="attachment-name">{attachment.fileName}</span>
							<span class="attachment-meta">{formatBytes(attachment.sizeBytes)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if currentDisplay.responseComment !== null || currentDisplay.correctedValue !== null}
			<div class="block">
				<p class="block-title">Resposta do solicitante</p>
				<div class="diff">
					<div class="diff-line diff-new">
						<span class="diff-glyph" aria-hidden="true">＋</span>
						<span class="diff-content">
							<span class="diff-label">Valor corrigido</span>
							<span class="diff-value">{currentDisplay.correctedValue}</span>
						</span>
					</div>
				</div>
				{#if currentDisplay.responseComment}
					<p class="block-note">{currentDisplay.responseComment}</p>
				{/if}
				{#if currentDisplay.responseAttachments.length > 0}
					<ul class="attachments-list">
						{#each currentDisplay.responseAttachments as attachment (attachment.fileName)}
							<li class="attachment-item">
								<Icon iconName="description" iconSize="sm" />
								<span class="attachment-name">{attachment.fileName}</span>
								<span class="attachment-meta">{formatBytes(attachment.sizeBytes)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		{#if actionError}
			<p class="form-error" role="alert">
				{actionError}
			</p>
		{/if}

		{#if currentDisplay.status === 'responded' && !showReopenInput}
			<div class="modal-actions">
				<Button variant="outline" onclick={handleReopenToggle} disabled={isValidating}>
					<Icon iconName="reopen" iconSize="sm" />
					Solicitar novamente
				</Button>
				<Button variant="primary" onclick={handleValidate} loading={isValidating}>
					<Icon iconName="validate" iconSize="sm" />
					Validar alteração
				</Button>
			</div>
		{:else if currentDisplay.status === 'responded' && showReopenInput}
			<div class="reopen-block">
				<Textarea
					label="Motivo para solicitar novamente"
					placeholder="O solicitante precisa corrigir os dados novamente."
					bind:value={reopenComment}
					error={reopenError}
					rows={3}
					maxlength={1000}
				/>
				<div class="modal-actions">
					<Button variant="outline-neutral" onclick={handleReopenToggle} disabled={isValidating}>
						Cancelar
					</Button>
					<Button variant="primary" onclick={handleReopen} loading={isValidating}>
						Enviar novamente
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</Modal>

<style>
	.success-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--spacing-sm);
	}

	.success-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--status-green-bg);
		color: var(--status-green);
	}

	.success-title {
		margin: 0;
		font-family: var(--font-montserrat);
		font-size: 16px;
		font-weight: 700;
		color: var(--primary-color);
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		margin: 0 0 var(--spacing-md) 0;
	}

	.status-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.date {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.block {
		margin-bottom: var(--spacing-lg);
	}

	.block-title {
		margin: 0 0 var(--spacing-sm) 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--black);
		letter-spacing: 0.02em;
	}

	.diff {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: var(--spacing-sm);
	}

	.diff-line {
		display: flex;
		gap: var(--spacing-sm);
		padding: 8px 10px;
		border-radius: var(--radius-sm);
	}

	.diff-old {
		background: var(--status-red-bg);
	}

	.diff-new {
		background: var(--status-green-bg);
	}

	.diff-glyph {
		font-weight: 700;
		flex-shrink: 0;
	}

	.diff-old .diff-glyph {
		color: var(--status-red);
	}

	.diff-new .diff-glyph {
		color: var(--status-green);
	}

	.diff-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.diff-label {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray);
	}

	.diff-old .diff-value {
		text-decoration: line-through;
		color: var(--status-red);
	}

	.diff-new .diff-value {
		color: var(--status-green);
	}

	.diff-value {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.block-note {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.attachments-list {
		list-style: none;
		margin: var(--spacing-sm) 0 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.attachment-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 6px 10px;
		background: var(--background-color);
		border-radius: var(--radius-sm);
		color: var(--gray);
	}

	.attachment-name {
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.attachment-meta {
		font-family: var(--font-inter);
		font-size: 12px;
		margin-left: auto;
		flex-shrink: 0;
	}

	.form-error {
		margin: 0 0 var(--spacing-md) 0;
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--status-red-bg);
		border-radius: var(--radius-sm);
		color: var(--status-red);
		font: var(--label);
	}

	.reopen-block {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
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
