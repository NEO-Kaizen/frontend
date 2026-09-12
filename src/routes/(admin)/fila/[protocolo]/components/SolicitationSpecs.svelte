<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { InternalRequestDetail, RequestStatus } from '$lib/types/request';
	import InfoSection from './solicitation-info/InfoSection.svelte';
	import QuickActions from './quickActions.svelte';

	interface Props {
		solicitation: InternalRequestDetail;
	}

	let { solicitation }: Props = $props();

	let activeTab = $state('informacoes');

	function getStatusTheme(status: RequestStatus): { bg: string; color: string; border: string } {
		switch (status) {
			case 'Concluído':
			case 'Elegível':
				return {
					bg: 'var(--status-green-bg)',
					color: 'var(--status-green)',
					border: 'var(--status-green)'
				};
			case 'Pendente de informações':
			case 'Aguardando triagem':
			case 'Aguardando mapeamento':
				return {
					bg: 'var(--status-yellow-bg)',
					color: 'var(--status-yellow)',
					border: 'var(--status-yellow)'
				};
			case 'Cancelado':
			case 'Não elegível':
				return {
					bg: 'var(--status-red-bg)',
					color: 'var(--status-red)',
					border: 'var(--status-red)'
				};
			default:
				return {
					bg: 'var(--status-blue-bg)',
					color: 'var(--status-blue)',
					border: 'var(--status-blue)'
				};
		}
	}

	let statusTheme = $derived(getStatusTheme(solicitation.status));
	let displayScore = $derived(
		solicitation.prioritization.score === null ? '-' : String(solicitation.prioritization.score)
	);
	let priorityLabel = $derived(solicitation.prioritization.label ?? 'Prioridade a ser calculada');
	let isPriorityCalculated = $derived(solicitation.prioritization.score !== null);

	type TabItem = {
		id: string;
		label: string;
		icon: 'description' | 'edit' | 'filter' | 'calendarCheck' | 'history' | 'info';
		badge?: number;
		disabled?: boolean;
	};

	const leftTabs: TabItem[] = [
		{ id: 'informacoes', label: 'Informações', icon: 'description' },
		{ id: 'triagem', label: 'Triagem', icon: 'filter', disabled: true },
		{ id: 'mapeamento', label: 'Mapeamento', icon: 'calendarCheck', badge: 1, disabled: true },
		{ id: 'historico', label: 'Histórico de Conversa', icon: 'history', badge: 1, disabled: true },
		{ id: 'observacoes', label: 'Observações Internas', icon: 'info', disabled: true }
	];

	const rightTab: TabItem = { id: 'editar', label: 'Editar', icon: 'edit', disabled: true };

	function handleTabClick(tab: TabItem) {
		if (tab.disabled) {
			return;
		}
		activeTab = tab.id;
	}

	function priorityBadgeTheme(
		label: string | null,
		hasScore: boolean
	): { bg: string; color: string; border: string } {
		if (!hasScore || !label) {
			return { bg: '#f3f4f6', color: 'var(--gray)', border: 'var(--white-gray)' };
		}
		switch (label) {
			case 'Crítica':
				return {
					bg: 'var(--status-red-bg)',
					color: 'var(--status-red)',
					border: 'var(--status-red)'
				};
			case 'Alta':
				return {
					bg: 'var(--status-yellow-bg)',
					color: 'var(--status-yellow)',
					border: 'var(--status-yellow)'
				};
			case 'Média':
				return {
					bg: 'var(--status-blue-bg)',
					color: 'var(--status-blue)',
					border: 'var(--status-blue)'
				};
			default:
				return {
					bg: 'var(--status-green-bg)',
					color: 'var(--status-green)',
					border: 'var(--status-green)'
				};
		}
	}

	let badgeTheme = $derived(
		priorityBadgeTheme(solicitation.prioritization.label, isPriorityCalculated)
	);
</script>

{#snippet headerSnippet()}
	<div class="header-row">
		<div class="header-left">
			<div class="header-meta">
				<span
					class="status-badge"
					style:background-color={statusTheme.bg}
					style:color={statusTheme.color}
					style:border={`1px solid ${statusTheme.border}`}
				>
					{solicitation.status.toUpperCase()}
				</span>
				<span class="protocol">{solicitation.protocol}</span>
				<span class="notification-skeleton" aria-label="Notificações pendentes">
					<Icon iconName="info" iconSize="sm" />
					<span class="notification-text">0 notificações</span>
				</span>
			</div>
			<h1 class="solicitation-title">{solicitation.demand.title}</h1>
		</div>
		{@render prioritizationCardSnippet()}
	</div>
{/snippet}

{#snippet prioritizationCardSnippet()}
	<div
		class="prio-card"
		role="status"
		aria-label={isPriorityCalculated
			? `Prioridade ${priorityLabel} com pontuação ${displayScore} de 25`
			: 'Prioridade a ser calculada'}
	>
		<span class="prio-label">
			<Icon iconName="security" iconSize="sm" />
			Priorização
		</span>
		<div class="prio-score-row">
			<span class="prio-score" class:muted={!isPriorityCalculated}>
				{displayScore}<span class="prio-max">/25</span>
			</span>
			<span
				class="prio-badge"
				style:background-color={badgeTheme.bg}
				style:color={badgeTheme.color}
				style:border={`1px solid ${badgeTheme.border}`}
			>
				{priorityLabel}
			</span>
		</div>
	</div>
{/snippet}

{#snippet specTabsSnippet()}
	<div class="tabs-bar" role="tablist" aria-label="Abas da solicitação">
		<div class="tabs-left">
			{#each leftTabs as tab (tab.id)}
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === tab.id}
					aria-disabled={tab.disabled ? 'true' : undefined}
					disabled={tab.disabled && tab.id !== 'informacoes' ? true : undefined}
					class="tab-item"
					class:active={activeTab === tab.id}
					class:disabled={tab.disabled}
					onclick={() => handleTabClick(tab)}
				>
					<Icon iconName={tab.icon} iconSize="sm" />
					<span>{tab.label}</span>
					{#if tab.badge}
						<span class="tab-badge" aria-label={`${tab.badge} notificação`}>{tab.badge}</span>
					{/if}
				</button>
			{/each}
		</div>
		<div class="tabs-right">
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === rightTab.id}
				aria-disabled={rightTab.disabled ? 'true' : undefined}
				disabled={rightTab.disabled ? true : undefined}
				class="tab-item"
				class:active={activeTab === rightTab.id}
				class:disabled={rightTab.disabled}
				onclick={() => handleTabClick(rightTab)}
			>
				<Icon iconName={rightTab.icon} iconSize="sm" />
				<span>{rightTab.label}</span>
			</button>
		</div>
	</div>
{/snippet}

<div class="solicitation-specs-page">
	{@render headerSnippet()}

	<section class="details-card" aria-label="Detalhes da solicitação">
		{@render specTabsSnippet()}

		<div class="tab-content">
			{#if activeTab === 'informacoes'}
				<InfoSection {solicitation} />
			{:else}
				<p class="placeholder">Conteúdo de {activeTab} — implementação futura</p>
			{/if}
		</div>

		<QuickActions />
	</section>
</div>

<style>
	.solicitation-specs-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-lg);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
		min-width: 0;
	}

	.header-meta {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.status-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.protocol {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 500;
		color: var(--gray);
	}

	.notification-skeleton {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		border-radius: var(--radius-md);
		background: var(--background-color);
		border: 1px solid var(--white-gray);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 500;
		color: var(--gray);
	}

	.notification-text {
		white-space: nowrap;
	}

	.solicitation-title {
		margin: 0;
		font-family: var(--font-montserrat);
		font-size: 22px;
		font-weight: 700;
		color: var(--primary-color);
		line-height: 1.3;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.prio-card {
		background: linear-gradient(135deg, var(--white) 0%, var(--background-color) 100%);
		border: 1px solid var(--white-gray);
		border-left: 3px solid var(--secondary-color);
		border-radius: var(--radius-sm);
		padding: 14px 18px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		box-shadow: var(--regular-shadow);
		min-width: 220px;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.prio-label {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray);
		letter-spacing: 0.02em;
	}

	.prio-score-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.prio-score {
		font-family: var(--font-montserrat);
		font-size: 26px;
		font-weight: 800;
		color: var(--status-blue);
		line-height: 1;
	}

	.prio-score.muted {
		color: var(--gray);
	}

	.prio-max {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray);
		margin-left: 1px;
	}

	.prio-badge {
		padding: 3px 8px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		white-space: nowrap;
	}

	.details-card {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
		padding: var(--spacing-lg);
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		word-break: break-word;
	}

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
		.header-row {
			flex-direction: column;
		}

		.prio-card {
			width: 100%;
		}

		.details-card {
			padding: var(--spacing-md);
		}

		.tabs-right {
			margin-left: 0;
			margin-top: 4px;
		}
	}

	@media (max-width: 640px) {
		.solicitation-title {
			font-size: 18px;
		}

		.tabs-bar {
			gap: 6px;
		}

		.tab-item {
			padding: 6px 10px;
			font-size: 12px;
		}
	}
</style>
