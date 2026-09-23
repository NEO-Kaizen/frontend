<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import { toastState } from '$lib/states/toast.svelte';
	import {
		createInternalNote,
		getInternalNotes,
		markInternalNotesRead,
		validateInternalNoteContent
	} from '$lib/services/internal-note.service';
	import {
		INTERNAL_NOTE_MAX_LENGTH,
		type InternalNotesResponse,
		type MappingHistoryEntry,
		type TimelineEventAction,
		type TimelineItem,
		type TimelineNote,
		type TriageHistoryEntry
	} from '$lib/types/internal-note';
	import type { IconName } from '$lib/types/icons';
	import { formatDateTime } from '$lib/utils/dates';
	import { getRoleDisplayLabel } from '$lib/utils/user';
	import HistoryTables from './HistoryTables.svelte';

	// A timeline chega do servidor em ordem mais-recente-primeiro (D-N7);
	// o componente exibe em ordem canônica (mais antigo primeiro) e prepensa
	// páginas mais antigas carregadas sob demanda via scroll-up (D-N5/D-N8).
	interface Props {
		protocol: string;
		items: TimelineItem[];
		nextCursor: string | null;
		triages: TriageHistoryEntry[];
		mappings: MappingHistoryEntry[];
		loadError: string | null;
		currentUserId: string;
		onNotesLoaded: (response: InternalNotesResponse) => void;
		onOlderLoaded: (olderItems: TimelineItem[], nextCursor: string | null) => void;
		onLoadError: (message: string) => void;
		onNoteCreated: (note: TimelineNote) => void;
		onMarkedRead: () => void;
	}

	let {
		protocol,
		items,
		nextCursor,
		triages,
		mappings,
		loadError,
		currentUserId,
		onNotesLoaded,
		onOlderLoaded,
		onLoadError,
		onNoteCreated,
		onMarkedRead
	}: Props = $props();

	let content = $state('');
	let contentError = $state<string | null>(null);
	let readError = $state<string | null>(null);
	let isSubmitting = $state(false);
	let isReloading = $state(false);
	let isMarkingRead = $state(false);
	let lastMarkedNoteId = $state<string | null>(null);

	// Página mais recente invertida para ordem canônica → última nota dela é a
	// mais nova da timeline (alvo do markThrough, §7).
	let latestNoteId = $derived(
		items.filter((item): item is TimelineNote => item.type === 'note').at(-1)?.id ?? null
	);

	// Scroll-up: sentinel no topo do container carrega a página mais antiga.
	let timelineEl = $state<HTMLElement | null>(null);
	let sentinelEl = $state<HTMLElement | null>(null);
	let isLoadingOlder = $state(false);
	let olderError = $state<string | null>(null);

	const EVENT_ICONS: Record<TimelineEventAction, IconName> = {
		'request.assign': 'person',
		'request.reassign': 'autorenew',
		'request.unassign': 'doNotDisturb',
		'request.status_change': 'history',
		'mapping.assign': 'calendarCheck'
	};

	// Ref de histórico inline — apresentação pura: um por entrada de
	// triage/mapeamento, mesclada na ordem canônica (rank 2: depois de nota e
	// evento no mesmo instante). Nunca participa de paginação/markThrough.
	interface HistoryRef {
		type: 'ref';
		kind: 'triage' | 'mapping';
		id: string;
		occurredAt: string;
		summary: string;
	}

	type DisplayItem = TimelineItem | HistoryRef;

	// Estado controlado das tabelas de histórico — dono é este componente
	// (clique no ref é um handler comum, sem $effect).
	let triagesOpen = $state(false);
	let mappingsOpen = $state(false);
	let openTriageId = $state<string | null>(null);
	let openMappingId = $state<string | null>(null);

	function toggleTriages(): void {
		triagesOpen = !triagesOpen;
		if (!triagesOpen) openTriageId = null;
	}

	function toggleMappings(): void {
		mappingsOpen = !mappingsOpen;
		if (!mappingsOpen) openMappingId = null;
	}

	function toggleTriageRow(id: string): void {
		openTriageId = openTriageId === id ? null : id;
	}

	function toggleMappingRow(id: string): void {
		openMappingId = openMappingId === id ? null : id;
	}

	// Expande disclosure + detail, rola e foca a linha correspondente da
	// tabela abaixo (ids `triage-row-*` / `mapping-row-*` em HistoryTables).
	async function goToHistory(kind: 'triage' | 'mapping', id: string): Promise<void> {
		if (kind === 'triage') {
			triagesOpen = true;
			openTriageId = id;
		} else {
			mappingsOpen = true;
			openMappingId = id;
		}
		await tick();
		const row = document.getElementById(`${kind}-row-${id}`);
		if (!row) return;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		row.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
		row.focus({ preventScroll: true });
	}

	function buildHistoryRefs(): HistoryRef[] {
		const triageRefs: HistoryRef[] = triages.map((entry) => ({
			type: 'ref',
			kind: 'triage',
			id: entry.triage.id,
			occurredAt: entry.occurredAt,
			summary: entry.triage.result || '---'
		}));
		const mappingRefs: HistoryRef[] = mappings.map((entry) => ({
			type: 'ref',
			kind: 'mapping',
			id: entry.mapping.id ?? `mapping-${entry.occurredAt}`,
			occurredAt: entry.occurredAt,
			summary: entry.mapping.scheduledFor
				? formatDateTime(entry.mapping.scheduledFor)
				: 'Sem agendamento'
		}));
		return [...triageRefs, ...mappingRefs];
	}

	function itemTimeMs(item: DisplayItem): number {
		if (item.type === 'ref') return Date.parse(item.occurredAt);
		return item.type === 'note' ? Date.parse(item.createdAt) : Date.parse(item.occurredAt);
	}

	function itemRank(item: DisplayItem): number {
		if (item.type === 'note') return 0;
		if (item.type === 'event') return 1;
		return 2;
	}

	// Ordem canônica (§8): timestamp ↑ → rank (nota 0, evento 1, ref 2) → id.
	function compareDisplay(a: DisplayItem, b: DisplayItem): number {
		const timeDiff = itemTimeMs(a) - itemTimeMs(b);
		if (timeDiff !== 0) return timeDiff;
		const rankDiff = itemRank(a) - itemRank(b);
		if (rankDiff !== 0) return rankDiff;
		if (a.type === 'ref' || b.type === 'ref') {
			// Rank único por tipo — só refs empilham aqui.
			const idA = a.type === 'ref' ? a.id : '';
			const idB = b.type === 'ref' ? b.id : '';
			return idA === idB ? 0 : idA < idB ? -1 : 1;
		}
		const rawA = a.type === 'event' ? a.id.slice('audit:'.length) : a.id;
		const rawB = b.type === 'event' ? b.id.slice('audit:'.length) : b.id;
		const idA = BigInt(rawA);
		const idB = BigInt(rawB);
		return idA === idB ? 0 : idA < idB ? -1 : 1;
	}

	let displayItems = $derived.by(() => [...items, ...buildHistoryRefs()].sort(compareDisplay));

	function getInitials(name: string): string {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		const first = parts[0]?.charAt(0) ?? '';
		const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : '';
		return `${first}${last}`.toUpperCase();
	}

	function isCurrentUser(note: TimelineNote): boolean {
		return note.author.id === currentUserId;
	}

	async function markThrough(noteId: string): Promise<void> {
		if (isMarkingRead || lastMarkedNoteId === noteId) return;
		isMarkingRead = true;
		readError = null;
		const result = await markInternalNotesRead(protocol, noteId);
		isMarkingRead = false;

		if (result.ok) {
			lastMarkedNoteId = noteId;
			onMarkedRead();
			return;
		}
		readError = result.error.message;
	}

	// Buscar/paginar ≠ marcar (§7): só a página inicial dispara o markThrough.
	onMount(() => {
		if (latestNoteId) void markThrough(latestNoteId);
	});

	async function handleReload(): Promise<void> {
		if (isReloading) return;
		isReloading = true;
		const result = await getInternalNotes(protocol);
		isReloading = false;

		if (!result.ok) {
			onLoadError(result.error.message);
			return;
		}

		onNotesLoaded(result.data);
		const newestNoteId = result.data.items
			.filter((item): item is TimelineNote => item.type === 'note')
			.at(-1)?.id;
		if (newestNoteId) await markThrough(newestNoteId);
	}

	async function loadOlderPage(): Promise<void> {
		if (!nextCursor || isLoadingOlder) return;
		isLoadingOlder = true;
		olderError = null;
		const result = await getInternalNotes(protocol, { cursor: nextCursor });
		isLoadingOlder = false;

		if (!result.ok) {
			olderError = result.error.message;
			return;
		}

		// Página chega mais-recente-primeiro → inverte para prepensar na
		// ordem canônica; a posição visual do usuário é preservada.
		const olderItems = [...result.data.items].reverse();
		const container = timelineEl;
		const previousScrollTop = container?.scrollTop ?? 0;
		const previousScrollHeight = container?.scrollHeight ?? 0;
		onOlderLoaded(olderItems, result.data.nextCursor);
		await tick();
		if (container) {
			container.scrollTop = previousScrollTop + (container.scrollHeight - previousScrollHeight);
		}
	}

	function handleRetryOlder(): void {
		void loadOlderPage();
	}

	$effect(() => {
		if (!sentinelEl || !timelineEl || nextCursor === null) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) void loadOlderPage();
			},
			{ root: timelineEl, rootMargin: '80px 0px 0px 0px' }
		);
		observer.observe(sentinelEl);
		return () => observer.disconnect();
	});

	function handleRetryMarkRead(): void {
		if (latestNoteId) void markThrough(latestNoteId);
	}

	function handleContentInput(): void {
		contentError = null;
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (isSubmitting) return;

		contentError = validateInternalNoteContent(content);
		if (contentError) return;

		isSubmitting = true;
		const result = await createInternalNote(protocol, content);
		isSubmitting = false;

		if (!result.ok) {
			toastState.add(result.error.message, 'error');
			return;
		}

		onNoteCreated(result.data);
		content = '';
		contentError = null;
		toastState.add('Observação adicionada com sucesso.', 'success');
	}
</script>

<section class="internal-notes" aria-labelledby="internal-notes-title">
	<header class="section-header">
		<div class="header-icon" aria-hidden="true">
			<Icon iconName="info" iconSize="md" />
		</div>
		<div>
			<h2 id="internal-notes-title">Observações Internas</h2>
			<p>Notas da equipe e eventos da solicitação em uma única linha do tempo.</p>
		</div>
	</header>

	{#if loadError}
		<div class="load-state error-state" role="alert">
			<Icon iconName="warning" iconSize="lg" />
			<p>{loadError}</p>
			<Button variant="outline" loading={isReloading} onclick={handleReload}>
				Tentar novamente
			</Button>
		</div>
	{:else}
		<div class="notes-timeline" bind:this={timelineEl} aria-live="polite">
			{#if displayItems.length === 0}
				<div class="load-state empty-state">
					<Icon iconName="description" iconSize="xl" />
					<h3>Nenhuma observação interna</h3>
					<p>Use o campo abaixo para registrar a primeira informação para a equipe.</p>
				</div>
			{:else}
				{#if nextCursor !== null || isLoadingOlder || olderError}
					<div class="older-loader" bind:this={sentinelEl}>
						{#if olderError}
							<span>{olderError}</span>
							<button
								type="button"
								class="loader-retry"
								disabled={isLoadingOlder}
								onclick={handleRetryOlder}
							>
								Tentar novamente
							</button>
						{:else if isLoadingOlder}
							<span class="loader-spinner" aria-hidden="true"></span>
							<span>Carregando observações anteriores…</span>
						{:else}
							<span class="sr-only">Role para cima para carregar observações anteriores</span>
						{/if}
					</div>
				{/if}

				<ol class="notes-list" aria-label="Histórico de observações internas">
					{#each displayItems as item (item.id)}
						{#if item.type === 'note'}
							<li class="note-row" class:current-user={isCurrentUser(item)}>
								<div class="avatar" aria-hidden="true">{getInitials(item.author.name)}</div>
								<article class="note-entry">
									<div class="note-meta">
										<strong>{item.author.name}</strong>
										<span>({getRoleDisplayLabel(item.author.role)})</span>
										{#if isCurrentUser(item)}<span>· você</span>{/if}
										<time datetime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
									</div>
									<p class="note-bubble">{item.content}</p>
								</article>
							</li>
						{:else if item.type === 'event'}
							<li class="event-row">
								<span class="event-icon" aria-hidden="true">
									<Icon iconName={EVENT_ICONS[item.action]} iconSize="sm" />
								</span>
								<div class="event-entry">
									<p class="event-text">{item.text}</p>
									<div class="event-meta">
										{#if item.actor}
											<strong>{item.actor.name}</strong>
											<span>({getRoleDisplayLabel(item.actor.role)})</span>
										{:else}
											<span>Sistema</span>
										{/if}
										<time datetime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
									</div>
								</div>
							</li>
						{:else}
							<li class="ref-row">
								<button
									type="button"
									class="history-ref"
									onclick={() => goToHistory(item.kind, item.id)}
								>
									<span class="ref-icon" aria-hidden="true">
										<Icon
											iconName={item.kind === 'triage' ? 'filter' : 'calendarCheck'}
											iconSize="sm"
										/>
									</span>
									<span class="ref-label">
										{item.kind === 'triage' ? 'Triagem registrada' : 'Mapeamento registrado'}
									</span>
									<span class="ref-summary">{item.summary}</span>
									<time datetime={item.occurredAt}>{formatDateTime(item.occurredAt)}</time>
									<Icon iconName="arrowForward" iconSize="sm" />
								</button>
							</li>
						{/if}
					{/each}
				</ol>
			{/if}
		</div>

		{#if readError}
			<div class="read-feedback" role="alert">
				<span>{readError}</span>
				{#if latestNoteId}
					<button type="button" disabled={isMarkingRead} onclick={handleRetryMarkRead}>
						Tentar novamente
					</button>
				{/if}
			</div>
		{/if}

		<HistoryTables
			{triages}
			{mappings}
			{triagesOpen}
			{mappingsOpen}
			{openTriageId}
			{openMappingId}
			onToggleTriages={toggleTriages}
			onToggleMappings={toggleMappings}
			onToggleTriageRow={toggleTriageRow}
			onToggleMappingRow={toggleMappingRow}
		/>

		<form class="composer" onsubmit={handleSubmit}>
			<Textarea
				label="Adicionar observação"
				placeholder="Escreva uma informação para a equipe interna"
				rows={4}
				maxlength={INTERNAL_NOTE_MAX_LENGTH}
				disabled={isSubmitting}
				error={contentError ?? ''}
				bind:value={content}
				oninput={handleContentInput}
			/>

			<div class="composer-footer">
				<Button type="submit" loading={isSubmitting} disabled={!content.trim()}>
					<Icon iconName="send" iconSize="sm" />
					{isSubmitting ? 'Publicando…' : 'Adicionar observação'}
				</Button>
			</div>
		</form>
	{/if}
</section>

<style>
	.internal-notes {
		display: flex;
		flex-direction: column;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--white);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border-bottom: var(--border-default);
		background: var(--background-color);
	}

	.header-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--status-blue-bg);
		color: var(--primary-color);
		flex-shrink: 0;
	}

	h2,
	h3,
	p {
		margin: 0;
	}

	h2 {
		font-family: var(--font-montserrat);
		font-size: 15px;
		color: var(--primary-color);
	}

	.section-header p {
		margin-top: 3px;
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.notes-timeline {
		padding: var(--spacing-lg) var(--spacing-md);
		background: var(--white);
		min-height: 260px;
		max-height: 560px;
		overflow-y: auto;
	}

	.older-loader {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		min-height: 32px;
		margin-bottom: var(--spacing-sm);
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.loader-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--white-gray);
		border-top-color: var(--primary-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loader-retry {
		border: 0;
		background: transparent;
		color: var(--primary-color);
		font: inherit;
		font-weight: 700;
		text-decoration: underline;
		cursor: pointer;
	}

	.loader-retry:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.notes-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.note-row {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		max-width: 82%;
	}

	.note-row.current-user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--white-gray);
		color: var(--primary-color);
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.current-user .avatar {
		background: var(--primary-color);
		color: var(--on-primary);
	}

	.note-entry {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.current-user .note-entry {
		align-items: flex-end;
	}

	.note-meta {
		display: flex;
		align-items: baseline;
		gap: 4px;
		flex-wrap: wrap;
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
	}

	.current-user .note-meta {
		justify-content: flex-end;
	}

	.note-meta strong {
		color: var(--primary-color);
		font-weight: 700;
	}

	.note-meta time {
		margin-left: 4px;
	}

	.note-bubble {
		padding: 12px 14px;
		border-radius: 4px 14px 14px 14px;
		border: var(--border-default);
		background: var(--background-color);
		color: var(--black);
		font-family: var(--font-inter);
		font-size: 13px;
		line-height: 1.6;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.current-user .note-bubble {
		border-color: var(--primary-color);
		border-radius: 14px 4px 14px 14px;
		background: var(--primary-color);
		color: var(--on-primary);
	}

	.event-row {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: var(--spacing-sm);
		max-width: 100%;
	}

	.event-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--background-color);
		border: var(--border-default);
		color: var(--secondary-color);
		flex-shrink: 0;
	}

	.event-entry {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
		max-width: 520px;
		padding-top: 3px;
	}

	.event-text {
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--black);
		overflow-wrap: anywhere;
	}

	.event-meta {
		display: flex;
		align-items: baseline;
		gap: 4px;
		flex-wrap: wrap;
		font-family: var(--font-inter);
		font-size: 11px;
		color: var(--gray);
	}

	.event-meta strong {
		color: var(--primary-color);
		font-weight: 700;
	}

	.event-meta time {
		margin-left: 4px;
	}

	.ref-row {
		display: flex;
		justify-content: center;
		max-width: 100%;
	}

	.history-ref {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		max-width: 100%;
		padding: 6px 14px;
		border: var(--border-default);
		border-radius: 999px;
		background: var(--background-color);
		color: var(--primary-color);
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		text-align: left;
	}

	.history-ref:hover {
		border-color: var(--primary-color);
	}

	.history-ref:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.ref-icon {
		display: inline-flex;
		align-items: center;
		color: var(--primary-color);
		flex-shrink: 0;
	}

	.ref-label {
		white-space: nowrap;
	}

	.ref-summary {
		font-weight: 400;
		color: var(--black);
		overflow-wrap: anywhere;
	}

	.history-ref time {
		font-size: 11px;
		font-weight: 400;
		color: var(--gray);
	}

	.load-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		min-height: 260px;
		padding: var(--spacing-lg);
		text-align: center;
		font-family: var(--font-inter);
	}

	.load-state h3 {
		font-size: 15px;
		color: var(--primary-color);
	}

	.load-state p {
		max-width: 440px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--gray);
	}

	.empty-state {
		color: var(--gray);
	}

	.error-state {
		color: var(--status-red);
	}

	.read-feedback {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 8px var(--spacing-md);
		background: var(--status-yellow-bg);
		color: var(--status-yellow);
		font-family: var(--font-inter);
		font-size: 12px;
	}

	.read-feedback button {
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 700;
		text-decoration: underline;
		cursor: pointer;
	}

	.read-feedback button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.composer {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		border-top: var(--border-default);
		background: var(--background-color);
	}

	.composer-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--spacing-md);
	}

	@media (max-width: 640px) {
		.notes-timeline {
			padding: var(--spacing-md) var(--spacing-sm);
		}

		.note-row,
		.event-row {
			max-width: 96%;
		}

		.composer-footer {
			align-items: stretch;
			flex-direction: column;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loader-spinner {
			animation: none;
			border-top-color: var(--white-gray);
		}
	}
</style>
