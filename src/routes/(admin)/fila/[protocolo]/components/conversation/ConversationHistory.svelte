<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import { UNVALIDATED_PENDENCY_STATUSES } from '$lib/services/conversation.service';
	import type {
		ConversationAttachmentInput,
		ConversationHistory as ConversationHistoryEntity,
		ConversationMessage
	} from '$lib/types/conversation';
	import type { Result } from '$lib/types/result';
	import ConversationComposer from './ConversationComposer.svelte';
	import ConversationThread from './ConversationThread.svelte';
	import CorrectionAlert from './CorrectionAlert.svelte';

	interface ConversationSendInput {
		content: string;
		attachments: ConversationAttachmentInput[];
	}

	interface Props {
		initialHistory: ConversationHistoryEntity | null;
		initialLoading: boolean;
		initialError: string | null;
		correctionAlertMessage?: string | null;
		onRetry?: () => Promise<Result<ConversationHistoryEntity>>;
		onSendMessage?: (input: ConversationSendInput) => Promise<Result<ConversationMessage>>;
		onValidatePendency?: (id: string) => void | Promise<void>;
		onRequestAgainPendency?: (id: string) => void | Promise<void>;
	}

	let {
		initialHistory,
		initialLoading,
		initialError,
		correctionAlertMessage = null,
		onRetry,
		onSendMessage,
		onValidatePendency,
		onRequestAgainPendency
	}: Props = $props();

	let history = $state<ConversationHistoryEntity | null>(untrack(() => initialHistory));
	let isLoading = $state(untrack(() => initialLoading));
	let loadError = $state<string | null>(untrack(() => initialError));

	const items = $derived(history?.items ?? []);

	const unvalidatedPendencies = $derived(
		items.filter(
			(item) => item.type === 'pendency' && UNVALIDATED_PENDENCY_STATUSES.includes(item.status)
		)
	);

	const correctionAlert = $derived.by(() => {
		if (!history || unvalidatedPendencies.length === 0) return null;

		return {
			count: unvalidatedPendencies.length,
			message: correctionAlertMessage ?? 'O solicitante respondeu às pendências abertas.'
		};
	});

	async function handleRetry(): Promise<void> {
		if (!onRetry) return;

		isLoading = true;
		loadError = null;

		const result = await onRetry();

		if (result.ok) {
			history = result.data;
		} else {
			loadError = result.error.message;
		}

		isLoading = false;
	}

	async function handleComposerSend(
		input: ConversationSendInput
	): Promise<Result<ConversationMessage>> {
		if (!onSendMessage) {
			return {
				ok: false,
				error: { message: 'O envio de mensagens não está disponível.' }
			};
		}

		const result = await onSendMessage(input);

		if (result.ok && history) {
			history = {
				...history,
				items: [...history.items, { ...result.data, type: 'message' }]
			};
		}

		return result;
	}

	function scrollToFirstPending(): void {
		const unvalidated = unvalidatedPendencies;

		if (unvalidated.length === 0) return;

		const item = unvalidated[0];

		if (item.type !== 'pendency') return;

		const element = document.getElementById(`pendency-card-${item.id}`);

		element?.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
	}
</script>

<section class="conversation" aria-labelledby="conversation-title">
	<header class="conversation-header">
		<h3 id="conversation-title" class="conversation-title">Histórico de Conversa</h3>
	</header>

	<div class="conversation-content">
		{#if isLoading}
			<div class="conversation-loading" aria-busy="true" role="status">
				{#each [0, 1] as i (i)}
					<div class="skeleton-row">
						<span class="skeleton skeleton-avatar" aria-hidden="true"></span>
						<span class="skeleton skeleton-line" aria-hidden="true"></span>
					</div>
				{/each}

				<p class="sr-only">Carregando mensagens…</p>
			</div>
		{:else if loadError}
			<div class="conversation-error" role="alert">
				<p class="error-message">{loadError}</p>

				<Button variant="outline-neutral" loading={isLoading} onclick={() => void handleRetry()}>
					Tentar novamente
				</Button>
			</div>
		{:else}
			{#if correctionAlert}
				<CorrectionAlert
					message={correctionAlert.message}
					count={correctionAlert.count}
					onGoToPendency={scrollToFirstPending}
				/>
			{/if}

			{#if history}
				{#if history.items.length === 0}
					<p class="conversation-empty" role="status">Nenhuma mensagem foi enviada ainda.</p>
				{:else}
					<ConversationThread
						items={history.items}
						onValidate={onValidatePendency}
						onRequestAgain={onRequestAgainPendency}
					/>
				{/if}
			{/if}
		{/if}
	</div>

	{#if !isLoading && !loadError && history && onSendMessage}
		<ConversationComposer onSend={handleComposerSend} />
	{/if}
</section>

<style>
	.conversation {
		display: flex;
		flex-direction: column;
		min-width: 0;
		max-height: 70vh;
	}

	.conversation-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		overflow-y: auto;
		min-height: 0;
		padding: var(--spacing-md);
	}

	.conversation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.conversation-title {
		margin: 0;
		font-family: var(--font-montserrat);
		font-size: 16px;
		font-weight: 700;
		color: var(--rich-black);
	}

	.conversation-loading {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md) 0;
	}

	.skeleton-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.skeleton {
		display: inline-block;
		background: var(--gray);
		opacity: 0.3;
		border-radius: var(--radius-sm);
		overflow: hidden;
		position: relative;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	.skeleton::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
		transform: translateX(-100%);
		animation: shimmer-slide 1.4s ease-in-out infinite;
	}

	.skeleton-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.skeleton-line {
		width: 60%;
		height: 14px;
	}

	.conversation-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xl) var(--spacing-md);
		text-align: center;
	}

	.conversation-empty {
		margin: 0;
		padding: var(--spacing-xl) var(--spacing-md);
		text-align: center;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--gray);
	}

	.error-message {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--rich-black);
	}

	@keyframes shimmer {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.5;
		}
	}

	@keyframes shimmer-slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
		}

		.skeleton::after {
			animation: none;
			display: none;
		}
	}
</style>
