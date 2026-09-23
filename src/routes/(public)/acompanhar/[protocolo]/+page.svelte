<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import {
		clearRequesterIdentity,
		loadRequesterIdentity,
		saveRequesterIdentity
	} from '$lib/services/requester-identity.service';
	import {
		getPublicTracking,
		getSessionTracking,
		getPendingItems,
		isAuthenticatedDetails
	} from '$lib/services/requester-tracking.service';
	import { countUnreadRequesterItems } from '$lib/services/pendency.service';
	import { toastState } from '$lib/states/toast.svelte';
	import type {
		DetailsState,
		RequesterIdentity,
		TrackingAccessState,
		TrackingDetailsResponse
	} from '$lib/types/requester-tracking';
	import { formatDate, formatDateTime } from '$lib/utils/dates';
	import { isClosingStatus, statusThemeVars } from '$lib/utils/status';
	import type { PageProps } from './$types';
	import PublicValidationForm from './components/PublicValidationForm.svelte';
	import RequesterDetails from './components/RequesterDetails.svelte';
	import RequesterPendencies from './components/RequesterPendencies.svelte';

	let { data }: PageProps = $props();

	const protocol = $derived(data.protocol);
	const solicitationMode = $derived(data.solicitationMode);
	const user = $derived(data.user);
	const statuses = $derived(data.portalConfig.statuses);

	const needsValidation = $derived(solicitationMode === 'PUBLIC' && !user);
	// Transporte fixo da página: sessão (autenticado ou PUBLIC logado como
	// solicitante) ou identidade pública (`X-Requester-Identity`). A diferença
	// fica só na autenticação/transporte — a UI de pendências é a mesma.
	const viaSession = $derived(!needsValidation);

	// `needsValidation` vem do server load (modo + sessão) e só muda com
	// navegação (que remonta a página): capturar o valor inicial é correto.
	// svelte-ignore state_referenced_locally
	let accessState = $state<TrackingAccessState>(
		needsValidation ? 'validation-required' : 'checking'
	);
	// svelte-ignore state_referenced_locally
	let detailsState = $state<DetailsState>(needsValidation ? 'empty' : 'loading');
	let tracking = $state<TrackingDetailsResponse | null>(null);
	let detailsError = $state<string | null>(null);
	let notFound = $state(false);
	// Identidade pública (sessionStorage): só existe no fluxo público, só
	// durante a permanência nesta página e só para este protocolo.
	let identity = $state<RequesterIdentity | null>(null);
	let unreadCount = $state(0);

	type TrackingTabId = 'solicitacao' | 'pendencias';
	let activeTab = $state<TrackingTabId>('solicitacao');

	const details = $derived(tracking?.details ?? null);
	const detailsMode = $derived(tracking?.mode ?? null);
	const prazoDesejado = $derived(
		tracking && isAuthenticatedDetails(tracking)
			? formatDate(tracking.details.operational.desiredDeadline)
			: details && 'impacts' in details
				? formatDate(details.impacts.desiredDeadline)
				: '---'
	);

	const badgeLabel = $derived(
		details && isClosingStatus(details.status, statuses)
			? 'SOLICITAÇÃO ENCERRADA'
			: 'SOLICITAÇÃO ATIVA'
	);

	const tabLabelId = $derived(
		activeTab === 'solicitacao' ? 'tracking-tab-solicitacao' : 'tracking-tab-pendencias'
	);

	async function loadDetails(session: boolean): Promise<void> {
		// Fluxo público sem identidade (expirada/limpa) → validação novamente.
		if (!session && !identity) {
			accessState = 'validation-required';
			detailsState = 'empty';
			tracking = null;
			return;
		}

		detailsState = 'loading';
		detailsError = null;
		notFound = false;

		const result = session
			? await getSessionTracking(protocol)
			: await getPublicTracking(protocol, identity!);

		if (!result.ok) {
			if (result.error.status === 404) {
				detailsState = 'empty';
				notFound = true;
				return;
			}
			if (result.error.status === 401 && !session) {
				// Identidade ausente/divergente/expirada (ou protocolo trocado
				// na URL — anti-IDOR): volta para a validação sem expor dados.
				handleUnauthorized();
				return;
			}
			detailsState = 'error';
			detailsError = result.error.message;
			return;
		}

		tracking = result.data;
		detailsState = 'loaded';
		accessState = 'authorized';
		void refreshUnread();
	}

	// Badge da aba Pendências (`unread` = itens `requested`, sem "marcar como
	// lido"). A lista completa é carregada pela aba; aqui só o contador.
	async function refreshUnread(): Promise<void> {
		if (!viaSession && !identity) return;
		const result = await getPendingItems(protocol, viaSession ? null : identity);
		if (!result.ok) {
			if (result.error.status === 401 && !viaSession) handleUnauthorized();
			return;
		}
		unreadCount = countUnreadRequesterItems(result.data.items);
	}

	function handleVerified(verified: { name: string; email: string }): void {
		identity = saveRequesterIdentity({ protocol, ...verified });
		accessState = 'validating';
		void loadDetails(false);
	}

	// 401 público: descarta a identidade e volta para a validação com mensagem
	// genérica (sem revelar qual dado divergiu ou se o protocolo existe).
	function handleUnauthorized(): void {
		clearRequesterIdentity();
		identity = null;
		tracking = null;
		accessState = 'validation-required';
		detailsState = 'empty';
		unreadCount = 0;
		toastState.add('Valide seus dados para acompanhar esta solicitação.', 'error');
	}

	// Revalidação silenciosa: o PATCH de resposta não devolve
	// `solicitationStatus`, então o status geral é observado pelo tracking em
	// segundo plano — SEM tocar em `detailsState`/`activeTab`, para não
	// desmontar a tela, perder scroll nem fechar accordions (contrato v0.5 §9).
	async function refreshDetails(): Promise<void> {
		if (!viaSession && !identity) return;

		const result = viaSession
			? await getSessionTracking(protocol)
			: await getPublicTracking(protocol, identity!);

		if (!result.ok) {
			// 401 público: identidade expirada/divergente — volta à validação.
			if (result.error.status === 401 && !viaSession) {
				handleUnauthorized();
			}
			return;
		}

		tracking = result.data;
		accessState = 'authorized';
	}

	function handleDataChanged(): void {
		void refreshDetails();
	}

	function selectTab(tab: TrackingTabId): void {
		activeTab = tab;
	}

	onMount(() => {
		if (needsValidation) {
			// Reaproveita a validação da sessão da página (sessionStorage) —
			// ela continua valendo só para este protocolo.
			const stored = loadRequesterIdentity(protocol);
			if (stored) {
				identity = stored;
				accessState = 'checking';
				void loadDetails(false);
			}
			return;
		}
		void loadDetails(true);
	});

	onDestroy(() => {
		// A identidade pública morre com a página (saída/troca de protocolo).
		clearRequesterIdentity();
	});
</script>

<svelte:head>
	<title>Acompanhar {protocol ?? ''} - {data.portalConfig.platformName}</title>
</svelte:head>

{#if notFound}
	<NotFoundState
		title="Solicitação não encontrada"
		message={`Não encontramos nenhuma solicitação cadastrada com o protocolo "${protocol ?? ''}".`}
		hint="Verifique o número digitado e tente novamente."
	/>
{:else if accessState === 'validation-required'}
	<PublicValidationForm {protocol} onVerified={handleVerified} />
{:else if accessState === 'validating' || accessState === 'checking' || detailsState === 'loading'}
	<div class="load-state" role="status" aria-live="polite">
		<p>Carregando solicitação…</p>
	</div>
{:else if detailsState === 'error'}
	<div class="error-state" role="alert">
		<p>{detailsError}</p>
		<button
			type="button"
			class="btn-retry"
			onclick={() => void loadDetails(viaSession || accessState === 'authorized')}
		>
			Tentar novamente
		</button>
	</div>
{:else if details && detailsMode}
	{@const statusStyle = statusThemeVars(details.status, statuses)}
	<div class="tracking-page">
		<div class="tracking-header">
			<div class="header-left">
				<span class="badge-active">{badgeLabel}</span>
				<h1>{details.demand.title}</h1>
				<span class="protocol-code">{details.protocol}</span>
			</div>
			<div class="right-status">
				<span
					class="status-pill"
					style:background-color={statusStyle.bg}
					style:color={statusStyle.color}
					style:border={`1px solid ${statusStyle.border}`}
				>
					{details.status}
				</span>
			</div>
		</div>

		<hr class="divider" />

		<div class="metadata-row">
			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="manageUsers" iconSize="sm" />
					<span class="meta-label">SOLICITANTE</span>
				</div>
				<span class="meta-value">{details.requester.fullName}</span>
			</div>
			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="calendarCheck" iconSize="sm" />
					<span class="meta-label">DATA DE ABERTURA</span>
				</div>
				<span class="meta-value">{formatDate(details.openedAt)}</span>
			</div>
			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="calendarCheck" iconSize="sm" />
					<span class="meta-label">PRAZO DESEJADO</span>
				</div>
				<span class="meta-value">{prazoDesejado}</span>
			</div>
			<div class="meta-item">
				<div class="meta-header">
					<Icon iconName="history" iconSize="sm" />
					<span class="meta-label">ÚLTIMA ATUALIZAÇÃO</span>
				</div>
				<span class="meta-value">{formatDateTime(details.lastUpdate)}</span>
			</div>
		</div>

		{#if details.meeting}
			<div class="meeting-card">
				<div class="meeting-left">
					<div class="icon-square">
						<Icon iconName="calendarCheck" iconSize="md" />
					</div>
					<div class="meeting-details">
						<span class="meeting-label">REUNIÃO DE ALINHAMENTO</span>
						<span class="meeting-time">{formatDateTime(details.meeting.scheduledFor)}</span>
					</div>
				</div>
				{#if details.meeting.link}
					<a
						href={details.meeting.link}
						target="_blank"
						rel="external noopener noreferrer"
						class="btn-join"
					>
						<Icon iconName="arrowForward" iconSize="sm" />
						<span>Entrar na reunião</span>
					</a>
				{:else}
					<button
						class="btn-join disabled"
						disabled
						title="O link para esta reunião ainda não foi disponibilizado"
					>
						<Icon iconName="block" iconSize="sm" />
						<span>Link indisponível</span>
						<span class="sr-only">: o link será disponibilizado após o agendamento da reunião</span>
					</button>
				{/if}
			</div>
		{/if}

		<div class="tabs-bar" role="tablist" aria-label="Abas do acompanhamento">
			<button
				type="button"
				role="tab"
				id="tracking-tab-solicitacao"
				aria-selected={activeTab === 'solicitacao'}
				aria-controls="tracking-panel"
				class="tab-item"
				class:active={activeTab === 'solicitacao'}
				onclick={() => selectTab('solicitacao')}
			>
				<Icon iconName="description" iconSize="sm" />
				<span>Solicitação</span>
			</button>
			<button
				type="button"
				role="tab"
				id="tracking-tab-pendencias"
				aria-selected={activeTab === 'pendencias'}
				aria-controls="tracking-panel"
				class="tab-item"
				class:active={activeTab === 'pendencias'}
				onclick={() => selectTab('pendencias')}
			>
				<Icon iconName="pending" iconSize="sm" />
				<span>Pendências</span>
				{#if unreadCount > 0}
					<span class="tab-badge" aria-label={`${unreadCount} pendências aguardando resposta`}>
						{unreadCount}
					</span>
				{/if}
			</button>
		</div>

		<div id="tracking-panel" role="tabpanel" aria-labelledby={tabLabelId}>
			{#if activeTab === 'solicitacao'}
				<RequesterDetails {details} mode={detailsMode} />
			{:else}
				<RequesterPendencies
					{protocol}
					identity={viaSession ? null : identity}
					onUnauthorized={handleUnauthorized}
					onUnreadChange={(count) => (unreadCount = count)}
					onDataChanged={handleDataChanged}
				/>
			{/if}
		</div>
	</div>
{/if}

<style>
	.load-state {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		text-align: center;
		box-shadow: var(--regular-shadow);
		margin-top: var(--spacing-lg);
		font-family: var(--font-inter);
		color: var(--gray);
	}

	.error-state {
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		text-align: center;
		box-shadow: var(--regular-shadow);
		margin-top: var(--spacing-lg);
		color: var(--status-red);
	}

	.error-state p {
		margin-bottom: var(--spacing-md);
		font: var(--paragrafo);
		color: var(--status-red);
	}

	.btn-retry {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		background: var(--primary-color);
		color: var(--on-primary);
		border: none;
		border-radius: var(--radius-sm);
		font: var(--button);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.btn-retry:hover {
		background: var(--secondary-color);
	}

	.tracking-page {
		background: var(--white);
		border-radius: var(--radius-sm);
		padding: var(--spacing-lg);
		box-shadow: var(--regular-shadow);
		border: var(--border-default);
		word-break: break-word;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.tracking-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-md);
	}

	.badge-active {
		display: inline-block;
		font-size: 11px;
		font-weight: 700;
		color: var(--secondary-color);
		background: var(--tint);
		padding: 3px 10px;
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-sm);
		letter-spacing: 0.03em;
		font-family: var(--font-inter);
	}

	.header-left h1 {
		margin: 4px 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--heading-color);
		line-height: 1.3;
		font-family: var(--font-montserrat);
	}

	.protocol-code {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray);
		font-family: var(--font-inter);
	}

	.status-pill {
		padding: 6px 14px;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 600;
		display: inline-block;
		white-space: nowrap;
		font-family: var(--font-inter);
	}

	.divider {
		border: none;
		border-top: var(--border-default);
		margin: 0;
	}

	.metadata-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--spacing-md);
	}

	.meta-header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 6px;
		color: var(--gray);
	}

	.meta-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--gray);
		letter-spacing: 0.03em;
		font-family: var(--font-inter);
	}

	.meta-value {
		display: block;
		font-weight: 700;
		font-size: 14px;
		color: var(--black);
		line-height: 1.3;
		font-family: var(--font-inter);
	}

	.meeting-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
	}

	.meeting-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.icon-square {
		width: 40px;
		height: 40px;
		background: var(--secondary-color);
		color: var(--on-primary);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.meeting-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meeting-label {
		font-size: 11px;
		font-weight: 700;
		color: var(--gray);
		letter-spacing: 0.03em;
		font-family: var(--font-inter);
	}

	.meeting-time {
		font-size: 15px;
		font-weight: 700;
		color: var(--black);
		font-family: var(--font-inter);
	}

	.btn-join {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 18px;
		background: var(--secondary-color);
		color: var(--on-primary);
		border-radius: var(--radius-sm);
		text-decoration: none;
		font-weight: 600;
		font-size: 14px;
		border: none;
		white-space: nowrap;
		font-family: var(--font-inter);
		cursor: pointer;
	}

	.btn-join.disabled {
		background: var(--gray);
		opacity: 0.6;
		cursor: not-allowed;
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

	.tabs-bar {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--white-gray);
		padding-bottom: 12px;
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
		color: var(--on-primary);
		border-color: var(--primary-color);
	}

	.tab-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--status-yellow);
		color: var(--white);
		font-size: 11px;
		font-weight: 700;
	}

	.tab-item.active .tab-badge {
		background: var(--white);
		color: var(--primary-color);
	}

	@media (max-width: 768px) {
		.metadata-row {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.tracking-page {
			padding: var(--spacing-md);
		}

		.tracking-header {
			flex-direction: column;
		}

		.metadata-row {
			grid-template-columns: 1fr;
		}

		.meeting-card {
			flex-direction: column;
			align-items: stretch;
		}

		.btn-join {
			width: 100%;
		}

		.tab-item {
			padding: 6px 10px;
			font-size: 12px;
		}
	}
</style>
