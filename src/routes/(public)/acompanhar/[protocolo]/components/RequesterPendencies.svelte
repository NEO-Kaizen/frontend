<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { countUnreadRequesterItems, toPendingBatches } from '$lib/services/pendency.service';
	import { getPendingItems } from '$lib/services/requester-tracking.service';
	import type { PendingBatch, PendingItem } from '$lib/types/pendency';
	import type { RequesterIdentity } from '$lib/types/requester-tracking';
	import PendencyCard from './PendencyCard.svelte';

	// Pendências do solicitante (contrato v0.5): GET
	// /requests/:protocol/pending-items → `PendingItem[]`, agrupado por
	// `batchId` em um `PendencyCard` por lote. `unread` = itens `requested`
	// (sem endpoint de "marcar como lido"). Sem chat: a resposta é o PATCH por
	// item dentro de cada card.
	interface Props {
		protocol: string;
		identity: RequesterIdentity | null;
		onUnauthorized: () => void;
		onUnreadChange?: (unread: number) => void;
		onDataChanged?: () => void;
	}

	let { protocol, identity, onUnauthorized, onUnreadChange, onDataChanged }: Props = $props();

	let items = $state<PendingItem[]>([]);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	const batches = $derived<PendingBatch[]>(toPendingBatches(items));

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

		items = result.data;
		reportUnread(items);
		isLoading = false;
	}

	// Revalidação SILENCIOSA após uma resposta: atualiza o estado sem passar
	// por `isLoading` (não troca a tela por skeleton, nem perde scroll/aba).
	// É a única fonte de verdade sobre o status geral da solicitação (o PATCH
	// não devolve `solicitationStatus`).
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
		items = result.data;
		reportUnread(items);
	}

	// Resposta local: aplica o `PendingItem` devolvido pelo PATCH no estado,
	// atualizando o `PendencyCard` (campo vira `responded`) sem reload nem
	// navegação. Em falhas de consistência (ex.: 409) o item chega
	// `undefined` e optamos por revalidar em silêncio.
	function applyUpdatedItem(updated?: PendingItem): void {
		if (updated) {
			items = items.map((item) => (item.id === updated.id ? updated : item));
			reportUnread(items);
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
