<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		doesBatchRequireAttachment,
		isBatchCompleteForRequester,
		isPendingItemOverdue,
		MAX_ATTACHMENTS,
		uploadPendingItemAttachmentAsRequester,
		validatePendingAttachmentSelection
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

	// Accordion do card: segue o status do lote — validado (`resolved`)
	// inicia fechado; a responder (`requested`) ou a validar (`responded`)
	// inicia aberto. Após o toggle manual, a escolha do usuário prevalece
	// (`null` = sem override manual). Estado puramente de UI.
	let manualExpanded = $state<boolean | null>(null);
	const isExpanded = $derived(manualExpanded ?? !batch.resolved);

	function toggle(): void {
		manualExpanded = !isExpanded;
	}

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

	interface PendingUploadEntry {
		id: string;
		file: File;
		error: string | null;
	}

	let fileInput: HTMLInputElement | null = $state(null);
	let pendingFiles = $state<PendingUploadEntry[]>([]);
	let selectionErrors = $state<{ fileName: string; message: string }[]>([]);
	let isUploading = $state(false);
	let uploadSequence = $state(0);

	const sentCount = $derived(batchAttachments.length);
	const attachmentCounter = $derived(`${sentCount}/${MAX_ATTACHMENTS}`);
	const remainingSlots = $derived(MAX_ATTACHMENTS - sentCount - pendingFiles.length);
	const canUpload = $derived(requiresAttachment && uploadTargetId !== null);
	const limitReached = $derived(sentCount + pendingFiles.length >= MAX_ATTACHMENTS);

	function openFilePicker(): void {
		fileInput?.click();
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function handleFilesSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const files = input.files ? Array.from(input.files) : [];
		input.value = '';
		if (files.length === 0 || isUploading) return;

		const { valid, rejected } = validatePendingAttachmentSelection(files, {
			sentAttachments: batchAttachments.map((entry) => entry.attachment),
			alreadySelected: pendingFiles.map((entry) => entry.file)
		});

		selectionErrors = rejected.map(({ file, message }) => ({
			fileName: file.name,
			message
		}));

		if (valid.length > 0) {
			pendingFiles = [
				...pendingFiles,
				...valid.map((file) => {
					uploadSequence += 1;
					return { id: `pending-${uploadSequence}`, file, error: null };
				})
			];
		}
	}

	function removePendingFile(id: string): void {
		if (isUploading) return;
		pendingFiles = pendingFiles.filter((entry) => entry.id !== id);
	}

	async function handleSendPending(): Promise<void> {
		if (isUploading || pendingFiles.length === 0 || !uploadTargetId) return;

		isUploading = true;
		let sent = 0;

		for (const entry of pendingFiles) {
			pendingFiles = pendingFiles.map((candidate) =>
				candidate.id === entry.id ? { ...candidate, error: null } : candidate
			);

			const result = await uploadPendingItemAttachmentAsRequester(
				protocol,
				uploadTargetId,
				entry.file,
				identity
			);

			if (result.ok) {
				sent += 1;
				pendingFiles = pendingFiles.filter((candidate) => candidate.id !== entry.id);
				continue;
			}

			if (result.error.status === 401) {
				onUnauthorized();
				break;
			}
			if (result.error.status === 409) {
				toastState.add(result.error.message, 'error');
				onRevalidate();
				break;
			}
			pendingFiles = pendingFiles.map((candidate) =>
				candidate.id === entry.id ? { ...candidate, error: result.error.message } : candidate
			);
			toastState.add(`“${entry.file.name}”: ${result.error.message}`, 'error');
		}

		isUploading = false;

		if (sent > 0) {
			toastState.add(
				sent === 1 ? 'Anexo enviado com sucesso.' : `${sent} anexos enviados com sucesso.`,
				'success'
			);
			selectionErrors = [];
			onRevalidate();
		}
	}
</script>

<article class="pendency-card" data-status={batchStatus} aria-label="Pendência solicitada">
	<header class="pendency-header">
		<button
			type="button"
			class="card-toggle"
			aria-expanded={isExpanded}
			aria-controls={`requester-pendency-panel-${batch.batchId}`}
			onclick={toggle}
		>
			<span class="pendency-title">Pendência solicitada</span>
			<span class="header-pills">
				<span class="pendency-status" data-status={batchStatus}>{statusLabel}</span>
				{#if hasOverdue && batchStatus === 'requested'}
					<span class="pendency-status" data-status="overdue">Em atraso</span>
				{/if}
			</span>
			<span class="card-chevron" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
		</button>
	</header>

	{#if isExpanded}
		<div id={`requester-pendency-panel-${batch.batchId}`} class="pendency-panel">
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
					{@const isFieldOpen = isFieldExpanded(item)}
					{#if isValidated}
						<div class="field-accordion" data-status="validated">
							<button
								type="button"
								class="field-accordion-toggle"
								aria-expanded={isFieldOpen}
								aria-controls={`requester-field-${item.id}`}
								onclick={() => toggleValidatedItem(item.id)}
							>
								<span class="field-accordion-chevron" aria-hidden="true"
									>{isFieldOpen ? '▼' : '▶'}</span
								>
								<span class="field-accordion-label">{item.field?.fieldLabel ?? 'Campo'}</span>
								<span class="field-accordion-note">validado</span>
							</button>
							{#if isFieldOpen}
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

			{#if requiresAttachment}
				<div class="attachments-block">
					<p class="attachments-title">
						<Icon iconName="cloudUpload" iconSize="sm" />
						<span>Anexos do lote ({attachmentCounter})</span>
						<span class="required-tag">Solicitado pelo analista</span>
					</p>
					{#if batchAttachments.length === 0}
						<p class="attachments-empty">Nenhum anexo enviado neste lote.</p>
					{:else}
						<ul class="attachments-list">
							{#each batchAttachments as entry (entry.itemId + entry.attachment.fileName + entry.attachment.sizeBytes)}
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
					{#if canUpload}
						<input
							bind:this={fileInput}
							type="file"
							multiple
							accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
							onchange={handleFilesSelected}
							aria-hidden="true"
							tabindex="-1"
							hidden
						/>
						{#if limitReached}
							<p class="upload-hint" role="status">
								Limite de {MAX_ATTACHMENTS} anexos por pendência atingido ({attachmentCounter}).
							</p>
						{:else}
							<div class="upload-row">
								<Button variant="outline" disabled={isUploading} onclick={openFilePicker}>
									{isUploading ? 'Enviando…' : 'Anexar arquivo'}
								</Button>
								<span class="upload-hint">
									PDF, DOCX, XLSX, PNG ou JPG (Máx. 10 MB cada · {attachmentCounter}
									{remainingSlots === 1 ? '· 1 vaga restante' : `· ${remainingSlots} vagas restantes`})
								</span>
							</div>
						{/if}
						{#if selectionErrors.length > 0}
							<ul class="upload-error-list">
								{#each selectionErrors as rejection (rejection.fileName + rejection.message)}
									<li class="upload-error" role="alert">
										“{rejection.fileName}”: {rejection.message}
									</li>
								{/each}
							</ul>
						{/if}
						{#if pendingFiles.length > 0}
							<ul class="pending-list" aria-label="Arquivos aguardando envio">
								{#each pendingFiles as entry (entry.id)}
									<li class="pending-item">
										<span class="pending-name">{entry.file.name}</span>
										<span class="pending-meta">{formatBytes(entry.file.size)}</span>
										<button
											type="button"
											class="pending-remove"
											disabled={isUploading}
											aria-label={`Remover ${entry.file.name} da seleção`}
											onclick={() => removePendingFile(entry.id)}
										>
											Remover
										</button>
										{#if entry.error}
											<span class="pending-error" role="alert">{entry.error}</span>
										{/if}
									</li>
								{/each}
							</ul>
							<div class="upload-row">
								<Button
									variant="primary"
									loading={isUploading}
									disabled={isUploading}
									onclick={() => void handleSendPending()}
								>
									{isUploading
										? 'Enviando…'
										: pendingFiles.length === 1
											? 'Enviar 1 anexo'
											: `Enviar ${pendingFiles.length} anexos`}
								</Button>
							</div>
						{/if}
					{/if}
				</div>
			{/if}

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
		</div>
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

	.card-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		width: 100%;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font: inherit;
	}

	.card-toggle:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.card-chevron {
		margin-left: auto;
		flex-shrink: 0;
		font-size: 11px;
		line-height: 1;
		color: var(--gray);
	}

	.pendency-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.pendency-title {
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: var(--status-yellow);
		text-transform: uppercase;
	}

	.pendency-card[data-status='responded'] .pendency-title {
		color: var(--secondary-color);
	}

	.pendency-card[data-status='validated'] .pendency-title {
		color: var(--status-green);
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

	.upload-error-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.pending-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.pending-item {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding: 6px 10px;
		background: var(--background-color);
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
	}

	.pending-name {
		font-weight: 600;
		color: var(--black);
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.pending-meta {
		font-size: 12px;
		color: var(--gray);
	}

	.pending-remove {
		margin-left: auto;
		padding: 2px 8px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
		color: var(--gray);
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.pending-remove:hover:not(:disabled) {
		color: var(--status-red);
		border-color: var(--status-red);
	}

	.pending-remove:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.pending-error {
		flex-basis: 100%;
		font-size: 12px;
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
