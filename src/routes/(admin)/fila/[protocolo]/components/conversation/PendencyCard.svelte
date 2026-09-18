<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { Pendency, PendencyStatus } from '$lib/types/conversation';

	interface Props {
		pendency: Pendency;
		onValidate?: (id: string) => void | Promise<void>;
		onRequestAgain?: (id: string) => void | Promise<void>;
	}

	let { pendency, onValidate, onRequestAgain }: Props = $props();

	type PendencyAction = 'validate' | 'requestAgain';

	let expanded = $state(false);
	let pendingAction = $state<PendencyAction | null>(null);

	const STATUS_CONFIG: Record<PendencyStatus, { label: string; summaryStatus?: string }> = {
		requested: { label: 'Pendência solicitada', summaryStatus: 'aguardando resposta' },
		awaiting_approval: { label: 'Resposta a aprovar', summaryStatus: 'aguardando aprovação' },
		answered: { label: 'Pendência respondida' }
	};

	const statusConfig = $derived(STATUS_CONFIG[pendency.status]);
	const fieldCount = $derived(pendency.fields.length);
	const attachmentCount = $derived(pendency.attachments?.length ?? 0);

	function pluralize(value: number, singular: string, pluralform: string): string {
		return value === 1 ? singular : pluralform;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	const summary = $derived.by(() => {
		const parts = [`${fieldCount} ${pluralize(fieldCount, 'campo', 'campos')}`];

		if (pendency.status === 'answered') {
			parts.push(`${attachmentCount} ${pluralize(attachmentCount, 'anexo', 'anexos')}`);
		} else {
			if (attachmentCount > 0) {
				parts.push(pluralize(attachmentCount, 'com anexo', 'com anexos'));
			}
			if (statusConfig.summaryStatus) {
				parts.push(statusConfig.summaryStatus);
			}
		}

		return parts.join(' · ');
	});

	function toggle(): void {
		expanded = !expanded;
	}

	// Ações apenas visuais: disparam callback fornecido pela camada de
	// integração (#123). Bloqueia apenas duplo clique da mesma ação, sem
	// bloquear ações não relacionadas.
	async function runAction(action: PendencyAction): Promise<void> {
		if (pendingAction === action) return;
		pendingAction = action;
		try {
			if (action === 'validate') {
				await onValidate?.(pendency.id);
			} else {
				await onRequestAgain?.(pendency.id);
			}
		} finally {
			pendingAction = null;
		}
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- links de anexo usam URL dinâmica do backend, não rotas do app -->
<li id={`pendency-card-${pendency.id}`} class="pendency-card {pendency.status}">
	<button
		type="button"
		class="card-toggle"
		aria-expanded={expanded}
		aria-controls={`pendency-panel-${pendency.id}`}
		onclick={toggle}
	>
		<span class="status-dot" aria-hidden="true"></span>
		<span class="status-label">{statusConfig.label}</span>
		<span class="summary" aria-hidden="true">{summary}</span>
		<span class="chevron">
			<Icon
				iconName={expanded ? 'expandLess' : 'expandMore'}
				iconSize="sm"
				ariaLabel={expanded ? 'Recolher detalhes da pendência' : 'Expandir detalhes da pendência'}
			/>
		</span>
	</button>

	{#if expanded}
		<div id={`pendency-panel-${pendency.id}`} class="pendency-panel">
			<section class="pendency-section">
				<h4 class="section-title">O que foi solicitado</h4>
				{#if pendency.comment}
					<p class="section-comment">{pendency.comment}</p>
				{/if}
				<ul class="field-chips">
					{#each pendency.fields as field (field.field)}
						<li class="field-chip">{field.label}</li>
					{/each}
				</ul>
				<ul class="field-list">
					{#each pendency.fields as field (field.field)}
						<li class="field-row">
							<span class="field-label">{field.label}</span>
							{#if field.requestedValue}
								<span class="field-value">{field.requestedValue}</span>
							{/if}
						</li>
					{/each}
				</ul>
				{#if pendency.status === 'requested' && pendency.attachments && pendency.attachments.length > 0}
					<ul class="attachment-list">
						{#each pendency.attachments as attachment (attachment.id)}
							<li class="attachment-item">
								<Icon iconName="description" iconSize="sm" ariaLabel="Anexo" />
								<span class="attachment-name">{attachment.name}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			{#if pendency.status === 'awaiting_approval' || pendency.status === 'answered'}
				<section class="pendency-section">
					<h4 class="section-title">O que o solicitante respondeu</h4>
					{#if pendency.responseMessage}
						<p class="section-comment">{pendency.responseMessage}</p>
					{/if}
					<ul class="field-list">
						{#each pendency.fields as field (field.field)}
							<li class="diff-block">
								<span class="diff-label">{field.label}</span>
								<div class="diff" aria-label={`Comparação do campo ${field.label}`}>
									{#if field.requestedValue}
										<span class="diff-removed">- {field.requestedValue}</span>
									{/if}
									{#if field.answeredValue}
										<span class="diff-added">+ {field.answeredValue}</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
					{#if pendency.attachments && pendency.attachments.length > 0}
						<ul class="attachment-list">
							{#each pendency.attachments as attachment (attachment.id)}
								<li class="attachment-item">
									<Icon iconName="description" iconSize="sm" ariaLabel="Anexo" />
									{#if attachment.url && attachment.canDownload}
										<a
											class="attachment-link"
											href={attachment.url}
											download
											title="Baixar anexo {attachment.name}"
										>
											{attachment.name}
										</a>
									{:else}
										<span class="attachment-name">{attachment.name}</span>
									{/if}
									{#if attachment.sizeBytes !== undefined}
										<span class="attachment-size">{formatBytes(attachment.sizeBytes)}</span>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</section>

				{#if pendency.status === 'answered'}
					<div class="pendency-actions" role="group" aria-label="Ações da pendência">
						<Button
							loading={pendingAction === 'validate'}
							disabled={pendingAction === 'validate'}
							onclick={() => void runAction('validate')}
						>
							Validar alteração
						</Button>
						<Button
							variant="outline-neutral"
							loading={pendingAction === 'requestAgain'}
							disabled={pendingAction === 'requestAgain'}
							onclick={() => void runAction('requestAgain')}
						>
							Solicitar novamente
						</Button>
					</div>
				{/if}
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

	.pendency-card.awaiting_approval {
		border-left-color: var(--status-yellow);
		background: var(--status-yellow-bg);
	}

	.pendency-card.answered {
		border-left-color: var(--status-green);
		background: var(--status-green-bg);
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

	.awaiting_approval .status-dot {
		background: var(--status-yellow);
	}

	.answered .status-dot {
		background: var(--status-green);
	}

	.status-label {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		color: var(--rich-black);
	}

	.awaiting_approval .status-label {
		color: var(--status-yellow);
	}

	.answered .status-label {
		color: var(--status-green);
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

	.awaiting_approval .summary {
		color: var(--status-yellow);
	}

	.answered .summary {
		color: var(--status-green);
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

	.field-chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.field-chip {
		padding: 3px 10px;
		border-radius: 999px;
		background: var(--background-color);
		border: var(--border-default);
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 500;
		color: var(--secondary-color);
	}

	.field-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.field-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
		border-left: 2px solid var(--white-gray);
		padding-left: 10px;
		min-width: 0;
	}

	.field-label {
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray);
	}

	.field-value {
		font-family: var(--font-inter);
		font-size: 13px;
		line-height: 1.5;
		color: var(--rich-black);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.diff-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.diff-label {
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray);
	}

	.diff {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.diff-removed,
	.diff-added {
		font-family: var(--font-inter);
		font-size: 13px;
		line-height: 1.5;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		white-space: pre-wrap;
		word-break: break-word;
	}

	.diff-removed {
		background: var(--status-red-bg);
		color: var(--status-red);
	}

	.diff-added {
		background: var(--status-green-bg);
		color: var(--status-green);
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
