<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import NotFoundState from '$lib/components/NotFoundState.svelte';
	import {
		clearRequesterIdentity,
		loadRequesterIdentity,
		saveRequesterIdentity
	} from '$lib/services/requester-identity.service';
	import {
		cancelRequest,
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
	// navegação. O efeito abaixo reinicializa o estado ao trocar de protocolo.
	// svelte-ignore state_referenced_locally
	let accessState = $state<TrackingAccessState>(
		needsValidation ? 'validation-required' : 'checking'
	);
	// svelte-ignore state_referenced_locally
	let detailsState = $state<DetailsState>(needsValidation ? 'empty' : 'loading');
	let tracking = $state<TrackingDetailsResponse | null>(null);
	let detailsError = $state<string | null>(null);
	let detailsErrorStatus = $state<number | undefined>(undefined);
	let notFound = $state(false);
	// Identidade pública (sessionStorage): só existe no fluxo público, só
	// durante a permanência nesta página e só para este protocolo.
	let identity = $state<RequesterIdentity | null>(null);
	let unreadCount = $state(0);

	type TrackingTabId = 'solicitacao' | 'pendencias';
	let activeTab = $state<TrackingTabId>('solicitacao');

	let confirmedProtocol = $state<string | null>(null);
	let loadedProtocol = $state<string | null>(null);
	let isRefreshingDetails = $state(false);
	let previousProtocol: string | null = null;
	let routeVersion = 0;
	let detailsVersion = 0;
	let cancellationReason = $state('');
	let cancellationError = $state('');
	const justificationLength = $derived(cancellationReason.trim().length);
	let isCancelling = $state(false);

	// Invariante da RF07: a rota, os dados exibidos e a confirmação precisam
	// apontar para o mesmo protocolo. `confirmed` é opcional para permitir a
	// mesma checagem antes de abrir o modal e imediatamente antes do POST.
	function protocolIsConsistent(confirmed: string | null = null): boolean {
		const displayedProtocol = tracking?.mode === 'authenticated' ? tracking.details.protocol : null;
		return (
			loadedProtocol === protocol &&
			displayedProtocol === protocol &&
			(confirmed === null || confirmed === protocol)
		);
	}

	const canCancel = $derived(
		!!user &&
			detailsState === 'loaded' &&
			!isRefreshingDetails &&
			protocolIsConsistent() &&
			tracking?.mode === 'authenticated' &&
			tracking.details.canCancel
	);

	function closeCancellation() {
		if (!isCancelling) confirmedProtocol = null;
	}

	function openCancellation() {
		if (!canCancel) return;
		cancellationReason = '';
		cancellationError = '';
		confirmedProtocol = protocol;
	}

	async function confirmCancellation(event: SubmitEvent) {
		event.preventDefault();
		if (
			isCancelling ||
			!canCancel ||
			confirmedProtocol === null ||
			!protocolIsConsistent(confirmedProtocol)
		)
			return;
		const justification = cancellationReason.trim();
		if (!justification || justification.length > 4000) {
			cancellationError = 'Informe uma justificativa de até 4.000 caracteres.';
			return;
		}

		const submittedProtocol = confirmedProtocol;
		const submittedVersion = routeVersion;
		isCancelling = true;
		cancellationError = '';
		try {
			const result = await cancelRequest(submittedProtocol, justification);
			if (submittedProtocol !== protocol || submittedVersion !== routeVersion) return;
			if (result.ok) {
				if (tracking?.mode === 'authenticated') {
					tracking = {
						...tracking,
						details: { ...tracking.details, status: result.data.status, canCancel: false }
					};
				}
				confirmedProtocol = null;
				toastState.add('Solicitação cancelada com sucesso.', 'success');
				await refreshDetails();
			} else {
				const { status, code, message } = result.error;
				if (handleTrackingAccessError(status, message, true)) {
					toastState.add(message, 'error');
				} else if (status !== 422 || code === 'rf07_not_eligible') {
					if (tracking?.mode === 'authenticated') {
						tracking = { ...tracking, details: { ...tracking.details, canCancel: false } };
					}
					confirmedProtocol = null;
					toastState.add(message, 'error');
					await refreshDetails();
				} else {
					cancellationError = message;
				}
			}
		} finally {
			if (submittedVersion === routeVersion) isCancelling = false;
		}
	}

	const details = $derived(loadedProtocol === protocol ? (tracking?.details ?? null) : null);
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

		const requestedProtocol = protocol;
		const requestedRoute = routeVersion;
		const requestedDetails = ++detailsVersion;
		isRefreshingDetails = false;
		detailsState = 'loading';
		detailsError = null;
		detailsErrorStatus = undefined;
		notFound = false;

		const result = session
			? await getSessionTracking(requestedProtocol)
			: await getPublicTracking(requestedProtocol, identity!);

		if (
			requestedProtocol !== protocol ||
			requestedRoute !== routeVersion ||
			requestedDetails !== detailsVersion
		)
			return;

		if (!result.ok) {
			if (handleTrackingAccessError(result.error.status, result.error.message, session)) return;
			detailsState = 'error';
			detailsError = result.error.message;
			detailsErrorStatus = result.error.status;
			accessState = 'error';
			return;
		}

		tracking = result.data;
		loadedProtocol = requestedProtocol;
		detailsState = 'loaded';
		accessState = 'authorized';
		void refreshUnread();
	}

	// Badge da aba Pendências (`unread` = itens `requested`, sem "marcar como
	// lido"). A lista completa é carregada pela aba; aqui só o contador.
	async function refreshUnread(): Promise<void> {
		if (!viaSession && !identity) return;
		const requestedProtocol = protocol;
		const requestedRoute = routeVersion;
		const result = await getPendingItems(requestedProtocol, viaSession ? null : identity);
		if (
			requestedProtocol !== protocol ||
			requestedRoute !== routeVersion ||
			detailsState !== 'loaded'
		)
			return;
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
		detailsVersion += 1;
		isRefreshingDetails = false;
		loadedProtocol = null;
		confirmedProtocol = null;
		clearRequesterIdentity();
		identity = null;
		tracking = null;
		accessState = 'validation-required';
		detailsState = 'empty';
		unreadCount = 0;
		toastState.add('Valide seus dados para acompanhar esta solicitação.', 'error');
	}

	function handleTrackingAccessError(
		status: number | undefined,
		message: string,
		session: boolean
	): boolean {
		if (status !== 401 && status !== 403 && status !== 404) return false;
		detailsVersion += 1;
		isRefreshingDetails = false;
		tracking = null;
		loadedProtocol = null;
		confirmedProtocol = null;
		cancellationReason = '';
		cancellationError = '';
		unreadCount = 0;
		if (status === 401 && !session) {
			handleUnauthorized();
		} else if (status === 404) {
			accessState = 'invalid';
			notFound = true;
			detailsState = 'empty';
			detailsError = message;
		} else {
			accessState = 'error';
			notFound = false;
			detailsState = 'error';
			detailsError = message;
		}
		return true;
	}

	// Revalidação silenciosa: o PATCH de resposta não devolve
	// `solicitationStatus`, então o status geral é observado pelo tracking em
	// segundo plano — SEM tocar em `detailsState`/`activeTab`, para não
	// desmontar a tela, perder scroll nem fechar accordions (contrato v0.5 §9).
	async function refreshDetails(): Promise<void> {
		if ((!viaSession && !identity) || detailsState !== 'loaded') return;
		const requestedProtocol = protocol;
		const requestedRoute = routeVersion;
		const requestedDetails = ++detailsVersion;
		isRefreshingDetails = true;

		const result = viaSession
			? await getSessionTracking(requestedProtocol)
			: await getPublicTracking(requestedProtocol, identity!);

		if (
			requestedProtocol !== protocol ||
			requestedRoute !== routeVersion ||
			requestedDetails !== detailsVersion
		)
			return;

		isRefreshingDetails = false;
		if (!result.ok) {
			handleTrackingAccessError(result.error.status, result.error.message, viaSession);
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

	$effect(() => {
		const currentProtocol = protocol;
		const requiresIdentity = needsValidation;
		untrack(() => {
			if (previousProtocol !== null && previousProtocol !== currentProtocol) {
				clearRequesterIdentity();
			}
			previousProtocol = currentProtocol;
			routeVersion += 1;
			isRefreshingDetails = false;
			tracking = null;
			loadedProtocol = null;
			confirmedProtocol = null;
			cancellationReason = '';
			cancellationError = '';
			isCancelling = false;
			notFound = false;
			detailsError = null;
			unreadCount = 0;
			activeTab = 'solicitacao';
			identity = requiresIdentity ? loadRequesterIdentity(currentProtocol) : null;
			const mustValidate = requiresIdentity && !identity;
			accessState = mustValidate ? 'validation-required' : 'checking';
			detailsState = mustValidate ? 'empty' : 'loading';
			if (!mustValidate) void loadDetails(!requiresIdentity);
		});
	});

	onDestroy(() => {
		routeVersion += 1;
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
{:else if accessState === 'validating' || detailsState === 'loading'}
	<div class="load-state" role="status" aria-live="polite">
		<p>Carregando solicitação…</p>
	</div>
{:else if detailsState === 'error'}
	<div class="error-state" role="alert">
		{#if detailsErrorStatus === 403}
			<p>Seu perfil não tem permissão para acompanhar esta solicitação.</p>
		{:else}
			<p>{detailsError}</p>
			<button
				type="button"
				class="btn-retry"
				onclick={() => void loadDetails(viaSession || accessState === 'authorized')}
			>
				Tentar novamente
			</button>
		{/if}
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
			<div class="right-status" class:has-cancel={canCancel}>
				<span
					class="status-pill"
					style:background-color={statusStyle.bg}
					style:color={statusStyle.color}
					style:border={`1px solid ${statusStyle.border}`}
				>
					{details.status}
				</span>
				{#if canCancel}
					<Button variant="outline-neutral" class="cancel-trigger" onclick={openCancellation}>
						<Icon iconName="block" iconSize="sm" />
						Cancelar solicitação
					</Button>
				{/if}
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
				class={['tab-item', { active: activeTab === 'solicitacao' }]}
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
				class={['tab-item', { active: activeTab === 'pendencias' }]}
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

{#if confirmedProtocol === protocol && canCancel}
	<Modal title="Cancelar solicitação" onclose={closeCancellation}>
		<form class="cancellation-form" onsubmit={confirmCancellation} aria-busy={isCancelling}>
			<p class="cancellation-protocol">Protocolo <strong>{confirmedProtocol}</strong></p>
			<p id="cancel-description">
				Deseja realmente cancelar esta solicitação? A justificativa será registrada no histórico.
			</p>
			<label for="cancel-justification">Justificativa do cancelamento</label>
			<textarea
				id="cancel-justification"
				bind:value={cancellationReason}
				required
				maxlength={4000}
				rows={4}
				disabled={isCancelling}
				aria-invalid={!!cancellationError}
				aria-describedby={cancellationError
					? 'cancel-description cancel-error'
					: 'cancel-description'}></textarea>
			{#if cancellationError}
				<p id="cancel-error" role="alert">{cancellationError}</p>
			{/if}
			<div class="cancellation-actions">
				<Button variant="outline-neutral" disabled={isCancelling} onclick={closeCancellation}>
					Voltar
				</Button>
				<Button
					type="submit"
					class="cancel-confirm"
					loading={isCancelling}
					disabled={!canCancel || justificationLength === 0 || justificationLength > 4000}
				>
					{isCancelling ? 'Cancelando…' : 'Confirmar cancelamento'}
				</Button>
			</div>
		</form>
	</Modal>
{/if}

<style>
	.right-status.has-cancel {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-sm);
		max-width: 100%;
	}

	.right-status :global(.cancel-trigger) {
		background: transparent;
		border-color: transparent;
		border-radius: var(--radius-md);
		color: color-mix(in srgb, var(--status-red) 65%, var(--text-color-primary));
		font: var(--label);
	}

	.right-status :global(.cancel-trigger:hover:not(:disabled)) {
		background: var(--status-red-bg);
	}

	.cancellation-form {
		display: grid;
		gap: var(--spacing-sm);
		color: var(--text-color-primary);
	}

	.cancellation-form p {
		margin: 0;
	}

	.cancellation-protocol {
		font: var(--label);
		overflow-wrap: anywhere;
	}

	.cancellation-form label {
		font: var(--label);
		margin-top: var(--spacing-sm);
	}

	.cancellation-form textarea {
		box-sizing: border-box;
		width: 100%;
		padding: var(--spacing-sm);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: inherit;
		font: inherit;
		resize: vertical;
	}

	.cancellation-form textarea:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.cancellation-form textarea[aria-invalid='true'] {
		border-color: var(--status-red);
	}

	.cancellation-form p[role='alert'] {
		color: color-mix(in srgb, var(--status-red) 65%, var(--text-color-primary));
	}

	.cancellation-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-sm);
	}

	.cancellation-actions :global(.cancel-confirm) {
		background: color-mix(in srgb, var(--status-red) 65%, var(--rich-black));
		border-color: transparent;
		color: var(--on-dark);
	}

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

		.right-status.has-cancel {
			align-self: flex-end;
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
