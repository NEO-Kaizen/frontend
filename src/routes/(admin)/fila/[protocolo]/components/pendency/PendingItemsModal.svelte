<script lang="ts">
	import { listPendencies, reviewPendingItems } from '$lib/services/pendency.service';
	import { PENDENCY_STATUS_LABELS, type PendingItem } from '$lib/types/pendency';
	import type { SessionUser } from '$lib/types/auth';
	import { formatDateTime } from '$lib/utils/dates';
	import { SvelteMap } from 'svelte/reactivity';
	import { tick, untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';

	type TabStatus = 'requested' | 'responded' | 'validated';
	type DecisionChoice = 'validate' | 'reopen';

	interface Props {
		protocol: string;
		currentUser?: SessionUser | null;
		assigneeId?: string | null;
		initialTab?: TabStatus;
		/** Lote a destacar: abre na aba de respondidas e rola até a seção do lote. */
		focusBatchId?: string | null;
		onclose: () => void;
		onSaved?: () => void;
	}

	let {
		protocol,
		currentUser = null,
		assigneeId = null,
		initialTab = 'requested',
		focusBatchId = null,
		onclose,
		onSaved
	}: Props = $props();

	// §3: revisar exige Administrador ou o responsável atribuído à tratativa.
	const canReview = $derived(
		currentUser?.role === 'Administrador' || Boolean(currentUser && currentUser.id === assigneeId)
	);

	const tabs: { id: TabStatus; label: string }[] = [
		{ id: 'requested', label: 'Solicitadas' },
		{ id: 'responded', label: 'Respondidas' },
		{ id: 'validated', label: 'Validadas' }
	];

	// O modal é montado a cada abertura (`{#if}`), então a aba inicial pode ser
	// lida uma única vez (`untrack` deixa explícita a leitura sem reatividade).
	let activeTab = $state<TabStatus>(untrack(() => initialTab));
	let items = $state<PendingItem[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let isSubmitting = $state(false);
	let reviewError = $state('');
	// Decisão explícita por item (`responded` → `validated`/`requested`). Itens
	// sem decisão ficam "para depois": permanecem `responded` e a pendência
	// continua aberta (§7–§9). O submit envia SOMENTE os decididos.
	let reviewDecisions = new SvelteMap<string, DecisionChoice>();
	let reopenComments = $state<Record<string, string>>({});

	const counts = $derived.by(() => {
		const result: Record<TabStatus, number> = { requested: 0, responded: 0, validated: 0 };
		for (const item of items) {
			if (
				item.status === 'requested' ||
				item.status === 'responded' ||
				item.status === 'validated'
			) {
				result[item.status] += 1;
			}
		}
		return result;
	});

	const visibleItems = $derived(items.filter((item) => item.status === activeTab));

	// A revisão decide cada item `responded` de um LOTE (§3) — agrupa por batchId.
	const respondedBatches = $derived.by(() => {
		const batches: { batchId: string; items: PendingItem[] }[] = [];
		for (const item of items) {
			if (item.status !== 'responded') continue;
			const group = batches.find((candidate) => candidate.batchId === item.batchId);
			if (group) group.items.push(item);
			else batches.push({ batchId: item.batchId, items: [item] });
		}
		return batches;
	});

	async function load(): Promise<void> {
		isLoading = true;
		errorMessage = '';
		const result = await listPendencies(protocol);

		if (result.ok) {
			items = result.data;
		} else {
			errorMessage = result.error.message;
		}
		isLoading = false;

		if (focusBatchId) {
			activeTab = 'responded';
			await tick();
			document
				.getElementById(`review-batch-${focusBatchId}`)
				?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	async function reload(): Promise<void> {
		await load();
		onSaved?.();
	}

	function setDecision(itemId: string, choice: DecisionChoice | null): void {
		if (choice === null) {
			reviewDecisions.delete(itemId);
			return;
		}
		reviewDecisions.set(itemId, choice);
		if (choice === 'reopen' && reopenComments[itemId] === undefined) {
			reopenComments[itemId] = '';
		}
	}

	function decisionFor(itemId: string): DecisionChoice | null {
		return reviewDecisions.get(itemId) ?? null;
	}

	function isDecisionReady(item: PendingItem): boolean {
		const decision = reviewDecisions.get(item.id);
		if (!decision) return false;
		if (decision === 'validate') return true;
		return (reopenComments[item.id] ?? '').trim() !== '';
	}

	function decidedItems(batchItems: PendingItem[]): PendingItem[] {
		return batchItems.filter((item) => isDecisionReady(item));
	}

	async function handleReviewSubmit(batchId: string): Promise<void> {
		if (isSubmitting) return;
		reviewError = '';
		const batch = respondedBatches.find((group) => group.batchId === batchId);
		if (!batch) return;
		// Revisão parcial (§8): envia só os itens decididos; os demais
		// ("decidir depois") permanecem `responded` e o lote continua aberto.
		const decided = decidedItems(batch.items);
		if (decided.length === 0) return;

		const decisions = decided.map((item) => {
			const decision = reviewDecisions.get(item.id) ?? 'validate';
			return decision === 'reopen'
				? {
						id: item.id,
						decision: 'reopen' as const,
						comment: (reopenComments[item.id] ?? '').trim()
					}
				: { id: item.id, decision: 'validate' as const };
		});

		isSubmitting = true;
		const result = await reviewPendingItems(protocol, { batchId, items: decisions });
		isSubmitting = false;

		if (result.ok) {
			reviewDecisions.clear();
			reopenComments = {};
			await reload();
		} else {
			reviewError = result.error.message;
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function displayValue(value: string | number | boolean | null | undefined): string {
		if (value === null || value === undefined) return '---';
		return String(value);
	}

	$effect(() => {
		load();
	});
</script>

<Modal title="Pendências por campo" size="large" {onclose}>
	<div class="pendency-view">
		<div class="tabs" role="tablist" aria-label="Status das pendências">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					class="tab"
					class:active={activeTab === tab.id}
					role="tab"
					aria-selected={activeTab === tab.id}
					onclick={() => (activeTab = tab.id)}
				>
					{tab.label}
					<span class="tab-count">{counts[tab.id]}</span>
				</button>
			{/each}
		</div>

		<div class="scroll-area">
			{#if isLoading}
				<div class="state-box" role="status">
					<span class="spinner" aria-hidden="true"></span>
					<p>Carregando pendências...</p>
				</div>
			{:else if errorMessage}
				<div class="state-box" role="alert">
					<Icon iconName="error" iconSize="lg" />
					<p>{errorMessage}</p>
					<Button variant="outline" onclick={load}>Tentar novamente</Button>
				</div>
			{:else if activeTab !== 'responded'}
				{#if visibleItems.length === 0}
					<div class="state-box">
						<Icon iconName="inbox" iconSize="lg" />
						<p>Nenhuma pendência {PENDENCY_STATUS_LABELS[activeTab].toLowerCase()}.</p>
					</div>
				{:else}
					<ul class="item-list">
						{#each visibleItems as item (item.id)}
							<li class="item-row">
								<div class="item-content">
									<span class="item-main">
										<span class="item-label">{item.field?.fieldLabel ?? 'Observação geral'}</span>
										<span class="item-value">
											{displayValue(
												item.status === 'validated' ? item.correctedValue : item.field?.currentValue
											)}
										</span>
									</span>
									<span class="item-meta">
										<span class="item-date">
											{item.status === 'validated'
												? `Validada em ${formatDateTime(item.validatedAt ?? item.createdAt)}`
												: `Solicitada em ${formatDateTime(item.createdAt)}`}
										</span>
									</span>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			{:else}
				{#if respondedBatches.length === 0}
					<div class="state-box">
						<Icon iconName="inbox" iconSize="lg" />
						<p>Nenhuma pendência respondida.</p>
					</div>
				{:else}
					<div class="batches">
						{#each respondedBatches as batch (batch.batchId)}
							<section class="batch" id={`review-batch-${batch.batchId}`}>
								{#each batch.items as item (item.id)}
									<article class="item-card">
										<header class="card-head">
											<span class="item-label">{item.field?.fieldLabel ?? 'Observação geral'}</span>
											<span class="item-date">
												Respondida em {formatDateTime(item.respondedAt ?? item.createdAt)}
											</span>
										</header>

										{#if item.type === 'observation'}
											<p class="requested-note">{item.comment}</p>
										{:else}
											<div class="diff" aria-label="Comparação do valor">
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

										{#if item.responseAttachments.length > 0}
											<ul class="attachments-list">
												{#each item.responseAttachments as attachment (attachment.fileName)}
													<li class="attachment-item">
														<Icon iconName="description" iconSize="sm" />
														<span class="attachment-name">{attachment.fileName}</span>
														<span class="attachment-meta">{formatBytes(attachment.sizeBytes)}</span>
													</li>
												{/each}
											</ul>
										{/if}

										{#if canReview}
											<div class="decision">
												<div
													class="decision-toggle"
													role="group"
													aria-label={`Decisão para ${item.field?.fieldLabel ?? 'observação'}`}
												>
													<button
														type="button"
														class="decision-option"
														class:selected={decisionFor(item.id) === 'validate'}
														aria-pressed={decisionFor(item.id) === 'validate'}
														onclick={() => setDecision(item.id, 'validate')}
													>
														<Icon iconName="validate" iconSize="sm" />
														Validar
													</button>
													<button
														type="button"
														class="decision-option"
														class:selected={decisionFor(item.id) === 'reopen'}
														aria-pressed={decisionFor(item.id) === 'reopen'}
														onclick={() => setDecision(item.id, 'reopen')}
													>
														<Icon iconName="reopen" iconSize="sm" />
														Solicitar novamente
													</button>
													<button
														type="button"
														class="decision-option"
														class:selected={decisionFor(item.id) === null}
														aria-pressed={decisionFor(item.id) === null}
														title="Deixar este item para revisão posterior"
														onclick={() => setDecision(item.id, null)}
													>
														<Icon iconName="history" iconSize="sm" />
														Depois
													</button>
												</div>

												{#if decisionFor(item.id) === 'reopen'}
													<div class="reopen-input">
														<Textarea
															label="Motivo para solicitar novamente"
															placeholder="O solicitante precisa corrigir este campo novamente."
															bind:value={reopenComments[item.id]}
															rows={2}
															maxlength={1000}
														/>
													</div>
												{/if}
											</div>
										{:else}
											<p class="no-action">
												Apenas o responsável pela tratativa ou um Administrador pode revisar.
											</p>
										{/if}
									</article>
								{/each}

								{#if canReview}
									{@const decided = decidedItems(batch.items)}
									<div class="batch-actions">
										{#if reviewError}
											<p class="form-error" role="alert">{reviewError}</p>
										{/if}
										{#if decided.length < batch.items.length}
											<p class="pending-hint" role="status">
												{batch.items.length - decided.length}
												{batch.items.length - decided.length === 1
													? 'item ficará para revisão posterior'
													: 'itens ficarão para revisão posterior'}.
											</p>
										{/if}
										<Button
											variant="primary"
											loading={isSubmitting}
											disabled={decided.length === 0}
											title={decided.length === 0
												? 'Decida ao menos um item'
												: 'Enviar revisão dos itens decididos'}
											onclick={() => handleReviewSubmit(batch.batchId)}
										>
											{isSubmitting
												? 'Enviando…'
												: decided.length === 0
													? 'Enviar revisão'
													: `Enviar revisão (${decided.length})`}
										</Button>
									</div>
								{/if}
							</section>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</Modal>

<style>
	.pendency-view {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.tabs {
		display: flex;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-md);
		border-bottom: var(--border-default);
		flex-shrink: 0;
	}

	.tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border: none;
		background: transparent;
		border-bottom: 2px solid transparent;
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--gray);
		cursor: pointer;
		transition: var(--transition-default);
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--black);
	}

	.tab.active {
		color: var(--secondary-color);
		border-bottom-color: var(--secondary-color);
	}

	.tab:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: var(--radius-sm);
	}

	.tab-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 10px;
		background: var(--background-color);
		font-size: 12px;
		font-weight: 700;
		color: var(--black);
	}

	.tab.active .tab-count {
		background: var(--status-blue-bg);
		color: var(--status-blue);
	}

	.state-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xl) var(--spacing-md);
		text-align: center;
		color: var(--gray);
		font: var(--paragrafo);
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid var(--background-color);
		border-top-color: var(--secondary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.scroll-area {
		overflow-y: auto;
		min-height: 0;
		max-height: min(60dvh, 600px);
		padding-right: 2px;
	}

	.item-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.item-row {
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.item-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		padding: 14px 16px;
		background: var(--white);
	}

	.item-main {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.item-label {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--black);
	}

	.item-value {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.item-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
		flex-shrink: 0;
	}

	.item-date {
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
		white-space: nowrap;
	}

	.batches {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.batch {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-bottom: var(--spacing-md);
		border-bottom: var(--border-default);
	}

	.batch:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.item-card {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.diff {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.diff-line {
		display: flex;
		gap: var(--spacing-sm);
		padding: 6px 8px;
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
	}

	.requested-note {
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--status-blue-bg);
		border-left: 3px solid var(--secondary-color);
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.pending-hint {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
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

	.decision {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.decision-toggle {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.decision-option {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--white);
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		color: var(--gray);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.decision-option:hover {
		color: var(--black);
	}

	.decision-option:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.decision-option.selected {
		border-color: var(--secondary-color);
		color: var(--secondary-color);
		background: var(--status-blue-bg);
	}

	.reopen-input :global(textarea) {
		min-height: 64px;
	}

	.no-action {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.batch-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-sm);
		position: sticky;
		bottom: 0;
		background: var(--white);
		padding: 12px 0 4px;
		border-top: var(--border-default);
	}

	.form-error {
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--status-red-bg);
		border-radius: var(--radius-sm);
		color: var(--status-red);
		font: var(--label);
	}

	@media (max-width: 600px) {
		.tabs {
			overflow-x: auto;
		}

		.scroll-area {
			max-height: min(64dvh, 560px);
		}

		.item-content {
			flex-direction: column;
			align-items: flex-start;
			padding: 12px 14px;
		}

		.item-meta {
			align-items: flex-start;
		}

		.card-head {
			flex-direction: column;
			align-items: flex-start;
		}

		.item-card {
			padding: 14px;
		}

		.batch-actions {
			align-items: stretch;
		}
	}
</style>
