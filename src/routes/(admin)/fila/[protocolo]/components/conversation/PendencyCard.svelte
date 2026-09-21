<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { PendingBatch, PendingItem } from '$lib/types/pendency';
	import { formatDateTime } from '$lib/utils/dates';

	interface Props {
		batch: PendingBatch;
		onReview?: (batch: PendingBatch) => void | Promise<void>;
	}

	let { batch, onReview }: Props = $props();

	// O card-folha de cada lote fica expandido por padrão; o analista pode
	// recolher manualmente. O accordion de itens `validated` (recolhidos por
	// padrão) é estado de UI puro — não vai ao backend.
	let isExpanded = $state(true);

	let expandedValidatedItems = $state<Record<string, boolean>>({});
	let isReviewing = $state(false);

	type BatchState = 'resolved' | 'responded' | 'requested';

	// Estado agregado do lote (contrato v0.5 §6): "Resposta a aprovar" somente
	// quando TODOS os itens estão `responded`; mistura `requested` + `responded`
	// continua pendência aberta ("Pendência solicitada"); tudo `validated` fecha.
	const batchState = $derived<BatchState>(
		batch.resolved
			? 'resolved'
			: batch.respondedCount > 0 && batch.respondedCount === batch.items.length
				? 'responded'
				: 'requested'
	);

	const STATUS_CONFIG: Record<BatchState, { label: string; summaryStatus?: string }> = {
		requested: { label: 'Pendência solicitada', summaryStatus: 'aguardando resposta' },
		responded: { label: 'Resposta a aprovar', summaryStatus: 'aguardando aprovação' },
		resolved: { label: 'Pendência validada' }
	};

	// CTAs de aprovação só aparecem com o lote COMPLETO respondido (contrato
	// v0.5 §8: todos os itens `responded` + anexo satisfeito). A revisão parcial
	// de subconjuntos (D-P23) continua disponível no modal de revisão.
	const canApprove = $derived(
		batch.respondedCount > 0 && batch.respondedCount === batch.items.length
	);

	const statusConfig = $derived(STATUS_CONFIG[batchState]);

	const attachmentCount = $derived(
		batch.items.reduce((count, item) => count + item.responseAttachments.length, 0)
	);

	function pluralize(value: number, singular: string, plural: string): string {
		return value === 1 ? singular : plural;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function displayValue(value: string | number | boolean | null | undefined): string {
		if (value === null || value === undefined) return '---';
		return String(value);
	}

	const summary = $derived.by(() => {
		const parts: string[] = [];
		if (batch.fieldCount > 0) {
			parts.push(`${batch.fieldCount} ${pluralize(batch.fieldCount, 'campo', 'campos')}`);
		} else {
			parts.push('somente instrução');
		}
		if (batch.respondedCount > 0) {
			parts.push(
				`${batch.respondedCount} ${pluralize(batch.respondedCount, 'resposta a aprovar', 'respostas a aprovar')}`
			);
		} else if (statusConfig.summaryStatus) {
			parts.push(statusConfig.summaryStatus);
		}
		if (attachmentCount > 0) {
			parts.push(`${attachmentCount} ${pluralize(attachmentCount, 'anexo', 'anexos')}`);
		}
		return parts.join(' · ');
	});

	function toggle(): void {
		isExpanded = !isExpanded;
	}

	function toggleValidatedItem(itemId: string): void {
		expandedValidatedItems = {
			...expandedValidatedItems,
			[itemId]: !expandedValidatedItems[itemId]
		};
	}

	async function runReview(): Promise<void> {
		if (isReviewing) return;
		isReviewing = true;
		try {
			await onReview?.(batch);
		} finally {
			isReviewing = false;
		}
	}

	function fieldStateLabel(item: PendingItem): string {
		if (item.status === 'validated') return 'Validado';
		if (item.status === 'responded') return 'Respondido';
		return 'Solicitado';
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- links de anexo usam URL dinâmica do backend, não rotas do app -->
<li id={`pendency-card-${batch.batchId}`} class="pendency-card {batchState}">
	<button
		type="button"
		class="card-toggle"
		aria-expanded={isExpanded}
		aria-controls={`pendency-panel-${batch.batchId}`}
		onclick={toggle}
	>
		<span class="status-dot" aria-hidden="true"></span>
		<span class="status-label">{statusConfig.label}</span>
		<span class="summary" aria-hidden="true">{summary}</span>
		<span class="chevron">
			<Icon
				iconName={isExpanded ? 'expandLess' : 'expandMore'}
				iconSize="sm"
				ariaLabel={isExpanded ? 'Recolher detalhes da pendência' : 'Expandir detalhes da pendência'}
			/>
		</span>
	</button>

	{#if isExpanded}
		<div id={`pendency-panel-${batch.batchId}`} class="pendency-panel">
			{#if batch.observation}
				{@const observation = batch.observation}
				<section class="pendency-section" aria-label="Observação da pendência">
					<div class="field-head">
						<h4 class="section-title">Observação</h4>
						<span class="field-chip {observation.status}">{fieldStateLabel(observation)}</span>
					</div>
					<p class="section-comment">{observation.comment}</p>
					{#if observation.status === 'responded' || observation.status === 'validated'}
						{#if observation.responseText}
							<p class="response-note">{observation.responseText}</p>
						{/if}
					{/if}
					{#if observation.responseAttachments.length > 0}
						<ul class="attachment-list">
							{#each observation.responseAttachments as attachment (attachment.fileName)}
								<li class="attachment-item">
									<Icon iconName="description" iconSize="sm" ariaLabel="Anexo" />
									{#if attachment.downloadUrl && attachment.canDownload}
										<a
											class="attachment-link"
											href={attachment.downloadUrl}
											download
											title="Baixar anexo {attachment.fileName}"
										>
											{attachment.fileName}
										</a>
									{:else}
										<span class="attachment-name">{attachment.fileName}</span>
									{/if}
									<span class="attachment-size">{formatBytes(attachment.sizeBytes)}</span>
								</li>
							{/each}
						</ul>
					{/if}
					<span class="item-date">
						{#if observation.status === 'validated'}
							Validada em {formatDateTime(observation.validatedAt ?? observation.createdAt)}
						{:else if observation.status === 'responded'}
							Respondida em {formatDateTime(observation.respondedAt ?? observation.createdAt)}
						{:else}
							Solicitada em {formatDateTime(observation.createdAt)}
						{/if}
					</span>
				</section>
			{/if}

			{#if batch.fields.length > 0}
				<section class="pendency-section" aria-label="Campos solicitados">
					<h4 class="section-title">Campos solicitados</h4>
					<ul class="field-list">
						{#each batch.fields as item (item.id)}
							{@const isValidated = item.status === 'validated'}
							{@const isItemExpanded = !isValidated || expandedValidatedItems[item.id] === true}
							<li class="field-block" class:is-validated={isValidated}>
								{#if isValidated}
									<button
										type="button"
										class="field-toggle"
										aria-expanded={isItemExpanded}
										aria-controls={`field-panel-${item.id}`}
										onclick={() => toggleValidatedItem(item.id)}
									>
										<span class="field-label">{item.field?.fieldLabel ?? 'Campo'}</span>
										<span class="field-chip validated">{fieldStateLabel(item)}</span>
										<span class="field-chevron">
											<Icon
												iconName={isItemExpanded ? 'expandLess' : 'expandMore'}
												iconSize="sm"
												ariaLabel={isItemExpanded
													? 'Recolher campo validado'
													: 'Expandir campo validado'}
											/>
										</span>
									</button>
								{:else}
									<div class="field-head">
										<span class="field-label">{item.field?.fieldLabel ?? 'Campo'}</span>
										<span class="field-chip {item.status}">{fieldStateLabel(item)}</span>
									</div>
								{/if}

								{#if isItemExpanded}
									<div id={`field-panel-${item.id}`} class="field-content">
										<p class="field-comment">{item.comment}</p>
										{#if item.status === 'responded' || item.status === 'validated'}
											{#if item.type === 'field_edit'}
												<div
													class="diff"
													aria-label={`Comparação do campo ${item.field?.fieldLabel}`}
												>
													<div class="diff-line diff-old">
														<span class="diff-glyph" aria-hidden="true">−</span>
														<span class="diff-value">{displayValue(item.field?.currentValue)}</span>
													</div>
													<div class="diff-line diff-new">
														<span class="diff-glyph" aria-hidden="true">＋</span>
														<span class="diff-value">{displayValue(item.correctedValue)}</span>
													</div>
												</div>
											{/if}
											{#if item.responseText}
												<p class="response-note">{item.responseText}</p>
											{/if}
										{/if}
										{#if item.responseAttachments.length > 0}
											<ul class="attachment-list">
												{#each item.responseAttachments as attachment (attachment.fileName)}
													<li class="attachment-item">
														<Icon iconName="description" iconSize="sm" ariaLabel="Anexo" />
														{#if attachment.downloadUrl && attachment.canDownload}
															<a
																class="attachment-link"
																href={attachment.downloadUrl}
																download
																title="Baixar anexo {attachment.fileName}"
															>
																{attachment.fileName}
															</a>
														{:else}
															<span class="attachment-name">{attachment.fileName}</span>
														{/if}
														<span class="attachment-size">{formatBytes(attachment.sizeBytes)}</span>
													</li>
												{/each}
											</ul>
										{/if}
										{#if item.status === 'validated'}
											<span class="item-date">
												Validado em {formatDateTime(item.validatedAt ?? item.createdAt)}
											</span>
										{:else if item.status === 'responded'}
											<span class="item-date">
												Respondido em {formatDateTime(item.respondedAt ?? item.createdAt)}
											</span>
										{/if}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if batch.resolved}
				<p class="resolved-note" role="status">
					Todas as decisões desta pendência foram concluídas.
				</p>
			{:else if canApprove && onReview}
				<div class="pendency-actions" role="group" aria-label="Ações da pendência">
					<Button loading={isReviewing} disabled={isReviewing} onclick={() => void runReview()}>
						Revisar pendência
					</Button>
				</div>
			{:else if batch.respondedCount > 0}
				<p class="waiting-note" role="status">
					Aguardando resposta dos demais itens para aprovar o lote. A revisão parcial está
					disponível no modal de pendências.
				</p>
			{:else}
				<p class="waiting-note" role="status">Aguardando resposta do solicitante.</p>
			{/if}
		</div>
	{/if}
</li>

<style>
	.pendency-card {
		list-style: none;
		border: 1px solid var(--white-gray);
		border-left: 4px solid var(--gray);
		border-radius: var(--radius-sm);
		background: var(--white);
		min-width: 0;
		transition:
			border-color 150ms ease,
			box-shadow 150ms ease;
	}

	.pendency-card.responded {
		border-left-color: var(--status-yellow);
		background: var(--status-yellow-bg);
	}

	.pendency-card.resolved {
		border-left-color: var(--gray);
		background: var(--white);
	}

	.card-toggle {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
		background: none;
		border: none;
		border-radius: inherit;
		padding: 12px 14px;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
	}

	.card-toggle:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	.card-toggle:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: -2px;
	}

	.status-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--gray);
		flex-shrink: 0;
	}

	.responded .status-dot {
		background: var(--status-yellow);
	}

	.resolved .status-dot {
		background: var(--gray);
	}

	.status-label {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		color: var(--rich-black);
	}

	.responded .status-label {
		color: var(--status-yellow);
	}

	.resolved .status-label {
		color: var(--gray);
	}

	.summary {
		margin-left: auto;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 500;
		color: var(--gray);
		white-space: nowrap;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.responded .summary {
		color: var(--status-yellow);
	}

	.resolved .summary {
		color: var(--gray);
	}

	.chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--gray);
		flex-shrink: 0;
	}

	.pendency-panel {
		border-top: 1px solid var(--white-gray);
		padding: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.pendency-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		min-width: 0;
	}

	.section-title {
		margin: 0;
		font-family: var(--font-montserrat);
		font-size: 13px;
		font-weight: 700;
		color: var(--primary-color);
	}

	.section-comment {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		line-height: 1.5;
		color: var(--rich-black);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.item-date {
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
	}

	.field-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.field-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
		border-left: 2px solid var(--white-gray);
		padding-left: 10px;
		min-width: 0;
	}

	.field-block.is-validated {
		border-left-color: var(--status-green);
		gap: 0;
	}

	.field-head {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.field-toggle {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		width: 100%;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
	}

	.field-toggle:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.field-chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--gray);
		margin-left: auto;
		flex-shrink: 0;
	}

	.field-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 6px;
		min-width: 0;
	}

	.field-label {
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray);
	}

	.field-chip {
		padding: 2px 8px;
		border-radius: 999px;
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		background: var(--background-color);
		color: var(--gray);
		border: var(--border-default);
		white-space: nowrap;
	}

	.field-chip.responded {
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
		border-color: var(--status-yellow);
	}

	.field-chip.validated {
		background: var(--status-green-bg);
		color: var(--status-green);
		border-color: var(--status-green);
	}

	.field-comment {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		line-height: 1.5;
		color: var(--rich-black);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.diff {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.diff-line {
		display: flex;
		gap: var(--spacing-sm);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		align-items: baseline;
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

	.diff-value {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.diff-old .diff-value {
		text-decoration: line-through;
		color: var(--status-red);
	}

	.diff-new .diff-value {
		color: var(--status-green);
	}

	.response-note {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.attachment-list {
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
		gap: 6px;
		min-width: 0;
		color: var(--secondary-color);
	}

	.attachment-link,
	.attachment-name {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 500;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.attachment-link {
		color: var(--secondary-color);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.attachment-link:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.attachment-name {
		color: var(--gray);
	}

	.attachment-size {
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
		white-space: nowrap;
		margin-left: auto;
	}

	.resolved-note,
	.waiting-note {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.pendency-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	@media (max-width: 640px) {
		.card-toggle {
			padding: 10px 12px;
			gap: 6px;
		}

		.summary {
			display: none;
		}

		.pendency-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.pendency-actions :global(button) {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pendency-card {
			transition: none;
		}
	}
</style>
