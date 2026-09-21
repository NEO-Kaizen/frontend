<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		doesBatchRequireAttachment,
		isBatchCompleteForRequester,
		isPendingItemOverdue,
		uploadPendingItemAttachmentAsRequester,
		validateAttachmentFile
	} from '$lib/services/pendency.service';
	import { toastState } from '$lib/states/toast.svelte';
	import type { PendingBatch, PendingItem } from '$lib/types/pendency';
	import type { RequesterIdentity } from '$lib/types/requester-tracking';
	import { formatDate, formatDateTime } from '$lib/utils/dates';
	import PendencyItemBlock from './PendencyItemBlock.svelte';

	// Um card por `batchId` (contrato v0.5 §5): observação + campos do mesmo
	// lote no mesmo bloco. Cada item tem seu próprio Confirmar (PATCH
	// individual, sem resposta em lote); o anexo é do lote (POST dedicado em
	// qualquer item) e o progresso deriva dos estados individuais.
	interface Props {
		protocol: string;
		batch: PendingBatch;
		identity: RequesterIdentity | null;
		/** Aplica o item respondido no estado local (sem reload). */
		onItemResponded: (updated?: PendingItem) => void;
		/** Revalidação silenciosa — usada após anexo e em 409. */
		onRevalidate: () => void;
		onUnauthorized: () => void;
	}

	let { protocol, batch, identity, onItemResponded, onRevalidate, onUnauthorized }: Props =
		$props();

	// Accordion dos campos já validados: fechados por padrão para reduzir a
	// poluição visual. Estado puramente de UI — o status vem do backend.
	let expandedValidatedItems = $state<Record<string, boolean>>({});

	function toggleValidatedItem(itemId: string): void {
		expandedValidatedItems = {
			...expandedValidatedItems,
			[itemId]: !expandedValidatedItems[itemId]
		};
	}

	function isFieldExpanded(item: PendingItem): boolean {
		if (item.status !== 'validated') return true;
		return expandedValidatedItems[item.id] === true;
	}

	const requiresAttachment = $derived(doesBatchRequireAttachment(batch));
	const isComplete = $derived(isBatchCompleteForRequester(batch));
	const hasOverdue = $derived(batch.items.some((item) => isPendingItemOverdue(item)));
	const batchStatus = $derived(
		batch.resolved ? 'validated' : batch.requestedCount > 0 ? 'requested' : 'responded'
	);
	const statusLabel = $derived(
		batchStatus === 'validated'
			? 'Validada'
			: batchStatus === 'responded'
				? 'Aguardando validação'
				: 'Pendente de resposta'
	);
	const answeredCount = $derived(batch.respondedCount + batch.validatedCount);
	const progressLabel = $derived(
		`${answeredCount} de ${batch.items.length} respondidos` +
			(batch.validatedCount > 0 ? ` · ${batch.validatedCount} validados` : '')
	);
	const batchAttachments = $derived(
		batch.items.flatMap((item) =>
			item.responseAttachments.map((attachment) => ({ itemId: item.id, attachment }))
		)
	);
	// O upload pode acontecer em qualquer item do lote: usa o primeiro ainda
	// não validado como destino.
	const uploadTargetId = $derived(
		batch.items.find((item) => item.status !== 'validated')?.id ?? null
	);
	const deadlines = $derived(
		batch.items.map((item) => item.deadline).filter((value) => value != null)
	);

	let fileInput: HTMLInputElement | null = $state(null);
	let uploadError = $state<string | null>(null);
	let isUploading = $state(false);

	function openFilePicker(): void {
		uploadError = null;
		fileInput?.click();
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function handleFileChange(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		input.value = '';
		if (!file || !uploadTargetId || isUploading) return;

		const validation = validateAttachmentFile(file);
		if (validation) {
			uploadError = validation;
			return;
		}

		isUploading = true;
		uploadError = null;
		const result = await uploadPendingItemAttachmentAsRequester(
			protocol,
			uploadTargetId,
			file,
			identity
		);
		isUploading = false;

		if (!result.ok) {
			if (result.error.status === 401) {
				onUnauthorized();
				return;
			}
			if (result.error.status === 409) {
				toastState.add(result.error.message, 'error');
				onRevalidate();
				return;
			}
			uploadError = result.error.message;
			toastState.add(result.error.message, 'error');
			return;
		}

		toastState.add('Anexo enviado com sucesso.', 'success');
		onRevalidate();
	}
</script>

<article class="pendency-card" data-status={batchStatus} aria-label="Pendência solicitada">
	<header class="pendency-header">
		<span class="pendency-title">Pendência solicitada</span>
		<span class="header-pills">
			<span class="pendency-status" data-status={batchStatus}>{statusLabel}</span>
			{#if hasOverdue && batchStatus === 'requested'}
				<span class="pendency-status" data-status="overdue">Em atraso</span>
			{/if}
		</span>
	</header>

	<p class="batch-progress" aria-label="Progresso do lote">
		{progressLabel}{#if batch.requestedCount > 0}
			· {batch.requestedCount}
			{batch.requestedCount === 1 ? 'aguardando resposta' : 'aguardando resposta'}{/if}
	</p>

	{#if batch.observation}
		<div class="observation-block">
			<p class="observation-label">Solicitação de alteração</p>
			<p class="observation-text">{batch.observation.comment}</p>
		</div>
	{/if}

	<div class="items-block">
		{#if batch.observation}
			<PendencyItemBlock
				{protocol}
				item={batch.observation}
				{identity}
				showComment={false}
				onResponded={onItemResponded}
				{onUnauthorized}
			/>
		{/if}
		{#each batch.fields as item (item.id)}
			{@const isValidated = item.status === 'validated'}
			{@const isExpanded = isFieldExpanded(item)}
			{#if isValidated}
				<div class="field-accordion" data-status="validated">
					<button
						type="button"
						class="field-accordion-toggle"
						aria-expanded={isExpanded}
						aria-controls={`requester-field-${item.id}`}
						onclick={() => toggleValidatedItem(item.id)}
					>
						<span class="field-accordion-chevron" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
						<span class="field-accordion-label">{item.field?.fieldLabel ?? 'Campo'}</span>
						<span class="field-accordion-note">validado</span>
					</button>
					{#if isExpanded}
						<div id={`requester-field-${item.id}`} class="field-accordion-panel">
							<PendencyItemBlock
								{protocol}
								{item}
								{identity}
								onResponded={onItemResponded}
								{onUnauthorized}
							/>
						</div>
					{/if}
				</div>
			{:else}
				<PendencyItemBlock
					{protocol}
					{item}
					{identity}
					onResponded={onItemResponded}
					{onUnauthorized}
				/>
			{/if}
		{/each}
	</div>

	{#if batch.fields.length > 0}
		{@const pendingFields = batch.items.filter(
			(item) => item.type === 'field_edit' && item.status === 'requested'
		).length}
		<p class="field-count">
			{pendingFields === 1
				? '1 campo aguardando resposta'
				: `${pendingFields} campos aguardando resposta`}
			{#if batch.validatedCount > 0}
				· {batch.validatedCount} validado{batch.validatedCount === 1 ? '' : 's'}
			{/if}
		</p>
	{/if}

	<div class="attachments-block">
		<p class="attachments-title">
			<Icon iconName="cloudUpload" iconSize="sm" />
			<span>Anexos do lote</span>
			{#if requiresAttachment}
				<span class="required-tag">Solicitado pelo analista</span>
			{/if}
		</p>
		{#if batchAttachments.length === 0}
			<p class="attachments-empty">Nenhum anexo enviado neste lote.</p>
		{:else}
			<ul class="attachments-list">
				{#each batchAttachments as entry (entry.itemId + entry.attachment.fileName)}
					<li class="attachment-item">
						<span class="attachment-name">{entry.attachment.fileName}</span>
						<span class="attachment-meta">
							{entry.attachment.mimeType} • {formatBytes(entry.attachment.sizeBytes)}
						</span>
						{#if entry.attachment.canDownload && entry.attachment.downloadUrl}
							<a
								href={entry.attachment.downloadUrl}
								target="_blank"
								rel="external noopener noreferrer"
								class="attachment-link"
							>
								Visualizar
							</a>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if uploadTargetId}
			<input
				bind:this={fileInput}
				type="file"
				accept=".pdf,.docx,.xlsx,.png,.jpg"
				onchange={handleFileChange}
				aria-hidden="true"
				tabindex="-1"
				hidden
			/>
			<div class="upload-row">
				<Button variant="outline" disabled={isUploading} onclick={openFilePicker}>
					{isUploading ? 'Enviando…' : 'Anexar arquivo'}
				</Button>
				<span class="upload-hint">PDF, DOCX, XLSX, PNG ou JPG (Máx. 10 MB)</span>
			</div>
			{#if uploadError}
				<p class="upload-error" role="alert">{uploadError}</p>
			{/if}
		{/if}
	</div>

	<footer class="pendency-meta">
		<span>{progressLabel}</span>
		{#if deadlines.length > 0}
			<span>Prazo: {formatDate(deadlines[0])}</span>
		{/if}
		<span>Solicitada em {formatDateTime(batch.createdAt)}</span>
	</footer>

	{#if isComplete}
		<p class="complete-note" role="status">
			{#if batch.resolved}
				Lote validado pelo analista.
			{:else if requiresAttachment && batchAttachments.length === 0}
				Falta anexar ao menos 1 arquivo para concluir o lote.
			{:else}
				Todas as respostas foram enviadas. Aguardando validação do analista.
			{/if}
		</p>
	{/if}
</article>

<style>
	.pendency-card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: var(--spacing-md);
		background: var(--white);
		border: var(--border-default);
		border-left: 3px solid var(--status-yellow);
		border-radius: var(--radius-sm);
	}

	.pendency-card[data-status='responded'] {
		border-left-color: var(--secondary-color);
	}

	.pendency-card[data-status='validated'] {
		border-left-color: var(--status-green);
	}

	.pendency-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}

	.pendency-title {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: var(--secondary-color);
		text-transform: uppercase;
	}

	.header-pills {
		display: inline-flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.batch-progress {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray);
	}

	.pendency-status {
		padding: 3px 10px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
	}

	.pendency-status[data-status='requested'] {
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
	}

	.pendency-status[data-status='overdue'] {
		background: var(--status-red-bg);
		color: var(--status-red);
	}

	.pendency-status[data-status='responded'] {
		background: var(--tint);
		color: var(--secondary-color);
	}

	.pendency-status[data-status='validated'] {
		background: var(--status-green-bg);
		color: var(--status-green);
	}

	.observation-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px 12px;
		background: var(--background-color);
		border-radius: var(--radius-sm);
	}

	.observation-label {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--gray);
	}

	.observation-text {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 600;
		color: var(--black);
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.items-block {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.field-accordion {
		display: flex;
		flex-direction: column;
		border: var(--border-default);
		border-left: 3px solid var(--status-green);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.field-accordion-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 12px;
		background: var(--status-green-bg);
		border: none;
		cursor: pointer;
		text-align: left;
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		color: var(--status-green);
	}

	.field-accordion-toggle:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: -2px;
	}

	.field-accordion-chevron {
		flex-shrink: 0;
		font-size: 11px;
		line-height: 1;
	}

	.field-accordion-label {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.field-accordion-note {
		margin-left: auto;
		font-weight: 600;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.field-accordion-panel {
		padding: 0;
	}

	.field-accordion-panel :global(.item-block) {
		border: none;
		border-radius: 0;
	}

	.field-count {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--gray);
	}

	.attachments-block {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 12px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.attachments-title {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--black);
	}

	.required-tag {
		padding: 2px 8px;
		border-radius: var(--radius-md);
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
		font-size: 11px;
	}

	.attachments-empty {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--gray);
	}

	.attachments-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.attachment-item {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-family: var(--font-inter);
		font-size: 13px;
	}

	.attachment-name {
		font-weight: 600;
		color: var(--black);
	}

	.attachment-meta {
		font-size: 12px;
		color: var(--gray);
	}

	.attachment-link {
		font-size: 13px;
		font-weight: 600;
		color: var(--secondary-color);
		text-decoration: none;
	}

	.attachment-link:hover {
		text-decoration: underline;
	}

	.upload-row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.upload-hint {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.upload-error {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--status-red);
	}

	.pendency-meta {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.complete-note {
		margin: 0;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		background: var(--status-green-bg);
		color: var(--status-green);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
	}
</style>
