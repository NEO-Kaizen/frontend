<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import type { InternalRequestDetail } from '$lib/types/request';
	import InfoSection from './solicitation-info/InfoSection.svelte';

	interface Props {
		solicitation: InternalRequestDetail;
	}

	let { solicitation }: Props = $props();

	type SpecTabId = 'informacoes' | 'triagem' | 'mapeamento' | 'historico' | 'observacoes';

	type SpecTabDefinition = {
		id: SpecTabId;
		label: string;
		icon: 'description' | 'filter' | 'calendarCheck' | 'history' | 'info';
		enabled: boolean;
		badge?: number;
	};

	const SPEC_TABS: readonly SpecTabDefinition[] = [
		{ id: 'informacoes', label: 'Informações', icon: 'description', enabled: true },
		{ id: 'triagem', label: 'Triagem', icon: 'filter', enabled: false },
		{
			id: 'mapeamento',
			label: 'Mapeamento',
			icon: 'calendarCheck',
			enabled: false,
			badge: 1
		},
		{
			id: 'historico',
			label: 'Histórico de Conversa',
			icon: 'history',
			enabled: false,
			badge: 1
		},
		{ id: 'observacoes', label: 'Observações Internas', icon: 'info', enabled: false }
	];

	// Ação da issue #121 (modo de edição) — não é uma aba de conteúdo,
	// por isso fica fora de SpecTabDefinition e do mecanismo de abas.
	type ActionTab = {
		label: string;
		icon: 'edit';
	};

	const rightTab: ActionTab = {
		label: 'Editar',
		icon: 'edit'
	};

	function resolveActiveTab(param: string | null): SpecTabId {
		const tab = SPEC_TABS.find((item) => item.id === param);
		if (tab && tab.enabled) {
			return tab.id;
		}
		return 'informacoes';
	}

	const activeTab = $derived(resolveActiveTab(page.url.searchParams.get('aba')));

	const activeTabLabel = $derived(
		SPEC_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Informações'
	);

	// Botão Editar visível apenas para Administrador ou o responsável pela triagem.
	// TODO: comparar por `assignee.id` quando o contrato do backend fornecer o
	// id do responsável (hoje só há email no mock/contrato).
	const currentUser = $derived(page.data.user);
	const canEdit = $derived(
		currentUser?.role === 'Administrador' ||
			Boolean(currentUser && solicitation.assignee?.email === currentUser.email)
	);

	function handleTabSelect(tab: SpecTabDefinition) {
		if (!tab.enabled) return;

		const url = new URL(page.url);
		url.searchParams.set('aba', tab.id);

		// Plugin não aceita query string após resolve() (eslint-plugin-svelte#1327);
		// o pathname atual já contém o protocolo da rota.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${url.pathname}?${url.searchParams.toString()}`, {
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<div class="tabs-bar" role="tablist" aria-label="Abas da solicitação">
	<div class="tabs-left">
		{#each SPEC_TABS as tab (tab.id)}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tab.id}
				aria-disabled={!tab.enabled ? 'true' : undefined}
				disabled={!tab.enabled}
				class="tab-item"
				class:active={activeTab === tab.id}
				class:disabled={!tab.enabled}
				onclick={() => handleTabSelect(tab)}
			>
				<Icon iconName={tab.icon} iconSize="sm" />
				<span>{tab.label}</span>
				{#if tab.badge}
					<span class="tab-badge" aria-label={`${tab.badge} notificação`}>{tab.badge}</span>
				{/if}
			</button>
		{/each}
	</div>
	{#if canEdit}
		<div class="tabs-right">
			<button
				type="button"
				role="tab"
				aria-selected={false}
				aria-disabled="true"
				disabled
				class="tab-item disabled"
			>
				<Icon iconName={rightTab.icon} iconSize="sm" />
				<span>{rightTab.label}</span>
			</button>
		</div>
	{/if}
</div>

<div class="tab-content">
	{#if activeTab === 'informacoes'}
		<InfoSection {solicitation} />
	{:else}
		<p class="placeholder">Conteúdo de {activeTabLabel} — implementação futura</p>
	{/if}
</div>

<style>
	.tabs-bar {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--white-gray);
		padding-bottom: 12px;
		margin-bottom: 4px;
	}

	.tabs-left {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: wrap;
	}

	.tabs-right {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
	}

	.tab-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		background: transparent;
		color: var(--secondary-color);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background 150ms ease,
			color 150ms ease;
		position: relative;
	}

	.tab-item:hover {
		background: var(--background-color);
	}

	.tab-item:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.tab-item.active {
		background: var(--primary-color);
		color: var(--white);
		border-color: var(--primary-color);
	}

	.tab-item.disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.tab-item.disabled:hover {
		background: transparent;
	}

	.tab-item.active.disabled {
		opacity: 1;
	}

	.tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 999px;
		background: var(--secondary-color);
		color: var(--white);
		font-size: 11px;
		font-weight: 700;
		line-height: 1;
	}

	.tab-item.active .tab-badge {
		background: var(--white);
		color: var(--primary-color);
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		min-height: 200px;
	}

	.placeholder {
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--gray);
		padding: var(--spacing-md) 0;
		margin: 0;
	}

	@media (max-width: 768px) {
		.tabs-right {
			margin-left: 0;
			margin-top: 4px;
		}
	}

	@media (max-width: 640px) {
		.tabs-bar {
			gap: 6px;
		}

		.tab-item {
			padding: 6px 10px;
			font-size: 12px;
		}
	}
</style>
