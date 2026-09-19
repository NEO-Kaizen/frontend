<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import {
		createInternalNote,
		getInternalNotes,
		markInternalNotesRead,
		validateInternalNoteContent
	} from '$lib/services/internal-note.service';
	import {
		INTERNAL_NOTE_MAX_LENGTH,
		type InternalNote,
		type InternalNotesResponse
	} from '$lib/types/internal-note';
	import { formatDateTime } from '$lib/utils/dates';

	interface Props {
		protocol: string;
		notes: InternalNote[];
		loadError: string | null;
		currentUserId: string;
		onNotesLoaded: (response: InternalNotesResponse) => void;
		onLoadError: (message: string) => void;
		onNoteCreated: (note: InternalNote) => void;
		onMarkedRead: () => void;
	}

	let {
		protocol,
		notes,
		loadError,
		currentUserId,
		onNotesLoaded,
		onLoadError,
		onNoteCreated,
		onMarkedRead
	}: Props = $props();

	let content = $state('');
	let contentError = $state<string | null>(null);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state<string | null>(null);
	let readError = $state<string | null>(null);
	let isSubmitting = $state(false);
	let isReloading = $state(false);
	let isMarkingRead = $state(false);
	let lastMarkedNoteId = $state<string | null>(null);
	let latestNoteId = $derived(notes.at(-1)?.id ?? null);

	const SUCCESS_TIMEOUT_MS = 4000;
	let successTimer: ReturnType<typeof setTimeout> | undefined;

	function clearSubmitSuccess(): void {
		if (successTimer !== undefined) {
			clearTimeout(successTimer);
			successTimer = undefined;
		}
		submitSuccess = null;
	}

	onDestroy(clearSubmitSuccess);

	function getInitials(name: string): string {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		if (parts.length === 0) return '?';
		const first = parts[0]?.charAt(0) ?? '';
		const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : '';
		return `${first}${last}`.toUpperCase();
	}

	function isCurrentUser(note: InternalNote): boolean {
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

	onMount(() => {
		const latestNoteId = notes.at(-1)?.id;
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
		const latestNoteId = result.data.items.at(-1)?.id;
		if (latestNoteId) await markThrough(latestNoteId);
	}

	function handleRetryMarkRead(): void {
		if (latestNoteId) void markThrough(latestNoteId);
	}

	function handleContentInput(): void {
		contentError = null;
		submitError = null;
		clearSubmitSuccess();
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (isSubmitting) return;

		contentError = validateInternalNoteContent(content);
		if (contentError) return;

		isSubmitting = true;
		submitError = null;
		clearSubmitSuccess();
		const result = await createInternalNote(protocol, content);
		isSubmitting = false;

		if (!result.ok) {
			submitError = result.error.message;
			return;
		}

		onNoteCreated(result.data);
		content = '';
		contentError = null;
		submitSuccess = 'Observação adicionada com sucesso.';
		successTimer = setTimeout(() => {
			submitSuccess = null;
			successTimer = undefined;
		}, SUCCESS_TIMEOUT_MS);
	}
</script>

<section class="internal-notes" aria-labelledby="internal-notes-title">
	<header class="section-header">
		<div class="header-icon" aria-hidden="true">
			<Icon iconName="info" iconSize="md" />
		</div>
		<div>
			<h2 id="internal-notes-title">Observações Internas</h2>
			<p>Estas anotações ficam disponíveis somente para a equipe interna.</p>
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
		<div class="notes-timeline" aria-live="polite">
			{#if notes.length === 0}
				<div class="load-state empty-state">
					<Icon iconName="description" iconSize="xl" />
					<h3>Nenhuma observação interna</h3>
					<p>Use o campo abaixo para registrar a primeira informação para a equipe.</p>
				</div>
			{:else}
				<ol class="notes-list" aria-label="Histórico de observações internas">
					{#each notes as note (note.id)}
						<li class="note-row" class:current-user={isCurrentUser(note)}>
							<div class="avatar" aria-hidden="true">{getInitials(note.author.name)}</div>
							<article class="note-entry">
								<div class="note-meta">
									<strong>{note.author.name}</strong>
									<span>({note.author.role})</span>
									{#if isCurrentUser(note)}<span>· você</span>{/if}
									<time datetime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
								</div>
								<p class="note-bubble">{note.content}</p>
							</article>
						</li>
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
				<div class="submit-feedback" aria-live="polite">
					{#if submitError}<p class="feedback-error" role="alert">{submitError}</p>{/if}
					{#if submitSuccess}<p class="feedback-success" role="status">{submitSuccess}</p>{/if}
				</div>
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
		color: var(--white);
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
		color: var(--rich-black);
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
		color: var(--white);
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
		justify-content: space-between;
		gap: var(--spacing-md);
	}

	.submit-feedback {
		min-height: 20px;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 600;
	}

	.feedback-error {
		color: var(--status-red);
	}

	.feedback-success {
		color: var(--status-green);
	}

	@media (max-width: 640px) {
		.notes-timeline {
			padding: var(--spacing-md) var(--spacing-sm);
		}

		.note-row {
			max-width: 96%;
		}

		.composer-footer {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
