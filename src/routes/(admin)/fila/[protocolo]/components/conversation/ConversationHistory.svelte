<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import { toPendingBatches } from '$lib/services/pendency.service';
	import type { ListPendenciesResponse, PendingBatch } from '$lib/types/pendency';
	import type { Result } from '$lib/types/result';
	import CorrectionAlert from './CorrectionAlert.svelte';
	import PendencyCard from './PendencyCard.svelte';

	interface Props {
		initialBatches: PendingBatch[];
		initialLoading: boolean;
		initialError: string | null;
		/** Lote do `correctionAlert` do detalhe (contrato v0.5 §7) — alvo do scroll. */
		correctionAlertBatchId?: string | null;
		/** `false` enquanto existir lote em aberto (D-P22) — bloqueia nova criação. */
		canRequestCreate?: boolean;
		onRetry?: () => Promise<Result<ListPendenciesResponse>>;
		onReviewBatch?: (batch: PendingBatch) => void;
		onRequestCreate?: () => void;
	}

	let {
		initialBatches,
		initialLoading,
		initialError,
		correctionAlertBatchId = null,
		canRequestCreate = true,
		onRetry,
		onReviewBatch,
		onRequestCreate
	}: Props = $props();

	let batches = $state<PendingBatch[]>(untrack(() => initialBatches));
	let isLoading = $state(untrack(() => initialLoading));
	let loadError = $state<string | null>(untrack(() => initialError));

	// Sincroniza com o server load (ex.: após criar/revisar + invalidateAll).
	// O retry local é preservado enquanto carrega.
	$effect(() => {
		if (!isLoading) {
			batches = initialBatches;
		}
	});

	const respondedCount = $derived(
		batches.reduce((count, batch) => count + batch.respondedCount, 0)
	);

	const correctionAlert = $derived.by(() => {
		if (batches.length === 0 || respondedCount === 0) return null;

		return {
			count: respondedCount,
			message: 'O solicitante respondeu às pendências. Revise as respostas.'
		};
	});

	async function handleRetry(): Promise<void> {
		if (!onRetry) return;

		isLoading = true;
		loadError = null;

		const result = await onRetry();

		if (result.ok) {
			batches = toPendingBatches(result.data);
		} else {
			loadError = result.error.message;
		}

		isLoading = false;
	}

	function scrollToFirstPending(): void {
		const pending =
			batches.find((batch) => batch.batchId === correctionAlertBatchId) ??
			batches.find((batch) => batch.respondedCount > 0) ??
			batches[0];

		if (!pending) return;

		const element = document.getElementById(`pendency-card-${pending.batchId}`);

		element?.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
	}
</script>

<section class="conversation" aria-labelledby="conversation-title">
	<header class="conversation-header">
		<h3 id="conversation-title" class="conversation-title">Histórico de pendências</h3>
		{#if onRequestCreate}
			<Button
				variant="outline-neutral"
				disabled={!canRequestCreate}
				title={canRequestCreate
					? 'Criar uma nova pendência (observação e/ou campos)'
					: 'Há uma pendência em aberto — conclua a revisão para solicitar outra'}
				onclick={onRequestCreate}
			>
				+ Solicitar pendência
			</Button>
		{/if}
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

				<p class="sr-only">Carregando pendências…</p>
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

			{#if batches.length === 0}
				<p class="conversation-empty" role="status">
					Nenhuma pendência registrada para esta solicitação.
				</p>
			{:else}
				<ul class="pendency-list">
					{#each batches as batch (batch.batchId)}
						<PendencyCard {batch} onReview={onReviewBatch} />
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
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
	}

	.pendency-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
		min-width: 0;
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
