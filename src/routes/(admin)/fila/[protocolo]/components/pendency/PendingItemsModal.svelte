<script lang="ts">
	import { listPendencies } from '$lib/services/pendency.service';
	import { PENDENCY_STATUS_LABELS, type PendingItem } from '$lib/types/pendency';
	import { formatDateTime } from '$lib/utils/dates';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PendencyResponseModal from './PendencyResponseModal.svelte';

	type TabStatus = 'requested' | 'responded' | 'validated';

	interface Props {
		protocol: string;
		onclose: () => void;
		onSaved?: () => void;
	}

	let { protocol, onclose, onSaved }: Props = $props();

	const tabs: { id: TabStatus; label: string }[] = [
		{ id: 'requested', label: 'Solicitadas' },
		{ id: 'responded', label: 'Respondidas' },
		{ id: 'validated', label: 'Validadas' }
	];

	let activeTab = $state<TabStatus>('requested');
	let items = $state<PendingItem[]>([]);
	let isLoading = $state(true);
	let errorMessage = $state('');
	let selectedItem = $state<PendingItem | null>(null);

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

	async function load(): Promise<void> {
		isLoading = true;
		errorMessage = '';
		const result = await listPendencies(protocol, { pageSize: 100 });

		if (result.ok) {
			items = result.data.data;
		} else {
			errorMessage = result.error.message;
		}
		isLoading = false;
	}

	async function reload(): Promise<void> {
		await load();
		onSaved?.();
	}

	function openItem(item: PendingItem): void {
		selectedItem = item;
	}

	function closeResponseModal(): void {
		selectedItem = null;
	}

	$effect(() => {
		load();
	});
</script>

<Modal title="Pendências por campo" {onclose}>
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
	{:else if visibleItems.length === 0}
		<div class="state-box">
			<Icon iconName="inbox" iconSize="lg" />
			<p>Nenhuma pendência {PENDENCY_STATUS_LABELS[activeTab].toLowerCase()}.</p>
		</div>
	{:else}
		<ul class="item-list">
			{#each visibleItems as item (item.id)}
				<li class="item-row">
					{#if item.status === 'responded'}
						<button type="button" class="item-button" onclick={() => openItem(item)}>
							<span class="item-main">
								<span class="item-label">{item.field.fieldLabel}</span>
								<span class="item-value">{item.correctedValue}</span>
							</span>
							<span class="item-meta">
								<span class="item-date">
									Respondido em {formatDateTime(item.respondedAt ?? item.createdAt)}
								</span>
								<span class="responded-hint">
									Abrir para validar
									<Icon iconName="arrowForward" iconSize="sm" />
								</span>
							</span>
						</button>
					{:else}
						<div class="item-content">
							<span class="item-main">
								<span class="item-label">{item.field.fieldLabel}</span>
								<span class="item-value">{item.field.currentValue}</span>
							</span>
							<span class="item-meta">
								<span class="item-date">Solicitada em {formatDateTime(item.createdAt)}</span>
							</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</Modal>

{#if selectedItem}
	<PendencyResponseModal item={selectedItem} onclose={closeResponseModal} onSaved={reload} />
{/if}

<style>
	.tabs {
		display: flex;
		gap: var(--spacing-xs);
		margin-bottom: var(--spacing-md);
		border-bottom: var(--border-default);
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

	.item-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 360px;
		overflow-y: auto;
	}

	.item-row {
		border: var(--border-default);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.item-button {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		padding: 12px;
		background: var(--white);
		border: none;
		text-align: left;
		cursor: pointer;
		transition: var(--transition-default);
	}

	.item-button:hover {
		background: var(--status-blue-bg);
	}

	.item-button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: -2px;
	}

	.item-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		padding: 12px;
		background: var(--white);
	}

	.item-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
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

	.responded-hint {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--secondary-color);
	}

	@media (max-width: 600px) {
		.item-button,
		.item-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.item-meta {
			align-items: flex-start;
		}
	}
</style>
