<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { countUnreadRequesterItems, toPendingBatches } from '$lib/services/pendency.service';
	import { getPendingItems } from '$lib/services/requester-tracking.service';
	import type {
		ListPendingItemsResponse,
		PendingBatch,
		PendingItem
	} from '$lib/types/pendency';
	import type { RequesterIdentity } from '$lib/types/requester-tracking';
	import PendencyCard from './PendencyCard.svelte';

	interface Props {
		protocol: string;
		identity: RequesterIdentity | null;
		onUnauthorized: () => void;
		onUnreadChange?: (unread: number) => void;
		onDataChanged?: () => void;
	}

	let { protocol, identity, onUnauthorized, onUnreadChange, onDataChanged }: Props = $props();

	let response = $state<ListPendingItemsResponse | null>(null);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	const batches = $derived<PendingBatch[]>(toPendingBatches(response));

	function reportUnread(value: PendingItem[]): void {
		onUnreadChange?.(countUnreadRequesterItems(value));
	}

	async function load(): Promise<void> {
		isLoading = true;
		loadError = null;
		const result = await getPendingItems(protocol, identity);

		if (!result.ok) {
			// 401 público: identidade ausente/divergente/expirada — volta para
			// a validação com mensagem genérica.
			if (result.error.status === 401 && identity) {
				onUnauthorized();
				return;
			}
			isLoading = false;
			loadError = result.error.message;
			return;
		}

		response = result.data;
		reportUnread(result.data.items);
		isLoading = false;
	}

	async function revalidate(): Promise<void> {
		if (!identity) {
			// Fluxo autenticado: mantém a mesma busca com sessão.
			await load();
			return;
		}
		const result = await getPendingItems(protocol, identity);
		if (!result.ok) {
			if (result.error.status === 401) onUnauthorized();
			return;
		}
		response = result.data;
		reportUnread(result.data.items);
	}

	function applyUpdatedItem(updated?: PendingItem): void {
		if (updated && response) {
			response = {
				...response,
				items: response.items.map((item) => (item.id === updated.id ? updated : item))
			};
			reportUnread(response.items);
		} else {
			void revalidate();
		}
		onDataChanged?.();
	}

	$effect(() => {
		void load();
	});
</script>

<section class="requester-pendencies" aria-labelledby="requester-pendencies-title">
	<h2 id="requester-pendencies-title" class="section-title">Pendências</h2>

	{#if isLoading}
		<div class="load-state" role="status" aria-live="polite">
			<p>Carregando pendências…</p>
		</div>
	{:else if loadError}
		<div class="load-state error-state" role="alert">
			<p>{loadError}</p>
			<Button variant="outline" onclick={() => void load()}>Tentar novamente</Button>
		</div>
	{:else if batches.length === 0}
		<div class="load-state empty-state">
			<h3>Nenhuma pendência</h3>
			<p>Não há solicitações de ajuste para esta solicitação no momento.</p>
		</div>
	{:else}
		<div class="batches-block">
			{#each batches as batch (batch.batchId)}
				<PendencyCard
					{protocol}
					{batch}
					{identity}
					onItemResponded={applyUpdatedItem}
					onRevalidate={() => void revalidate()}
					{onUnauthorized}
				/>
			{/each}
		</div>
	{/if}
</section>

<style>
	.requester-pendencies {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.section-title {
		margin: 0;
		font-family: var(--font-montserrat);
		font-size: 16px;
		font-weight: 700;
		color: var(--heading-color);
	}

	.load-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		min-height: 160px;
		padding: var(--spacing-lg);
		text-align: center;
		font-family: var(--font-inter);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.load-state h3 {
		margin: 0;
		font-size: 15px;
		color: var(--primary-color);
	}

	.load-state p {
		margin: 0;
		max-width: 440px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--gray);
	}

	.error-state p {
		color: var(--status-red);
	}

	.batches-block {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}
</style>
