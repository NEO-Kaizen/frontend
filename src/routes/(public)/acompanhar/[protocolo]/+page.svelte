<script lang="ts">
	import { onDestroy, tick, untrack } from 'svelte';
	import Button from '$lib/components/Button.svelte';
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
		isAuthenticatedDetails,
		MAX_REQUEST_JUSTIFICATION_LENGTH,
		reopenRequest
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
	import RequestOperationModal from './components/RequestOperationModal.svelte';
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

	interface TrackingView {
		protocol: string;
		viewer: string | null;
		viaSession: boolean;
	}

	const viewer = $derived(user ? `${user.id}:${user.role}` : null);
	let view = $state.raw<TrackingView | null>(null);
	let detailsVersion = 0;
	let accessState = $state<TrackingAccessState>('checking');
	let detailsState = $state<DetailsState>('loading');
	let tracking = $state<TrackingDetailsResponse | null>(null);
	let detailsError = $state<string | null>(null);
	let notFound = $state(false);
	let identity = $state<RequesterIdentity | null>(null);
	let unreadCount = $state(0);
	let isRefreshingDetails = $state(false);
	let requiresRevalidation = $state(false);
	let refreshError = $state<string | null>(null);

	type RequestConfirmation = { view: TrackingView } & (
		{ action: 'cancel'; cancelCycleRef?: string } | { action: 'reopen'; closureRef: string }
	);
	let confirmation = $state.raw<RequestConfirmation | null>(null);
	let isSubmitting = $state(false);
	let operationError = $state<string | null>(null);
	let heading = $state<HTMLHeadingElement>();

	type TrackingTabId = 'solicitacao' | 'pendencias';
	let activeTab = $state<TrackingTabId>('solicitacao');

	function isCurrentView(candidate: TrackingView): boolean {
		return (
			view === candidate &&
			candidate.protocol === protocol &&
			candidate.viewer === viewer &&
			candidate.viaSession === viaSession
		);
	}

	const details = $derived(
		view && isCurrentView(view) && tracking?.details.protocol === protocol ? tracking.details : null
	);
	const reopenRef = $derived(
		user?.role === 'Solicitante' &&
			details &&
			tracking?.mode === 'authenticated' &&
			tracking.details.canReopen === true &&
			typeof tracking.details.closureRef === 'string'
			? tracking.details.closureRef
			: null
	);
	const canReopen = $derived(
		!!reopenRef && detailsState === 'loaded' && !isRefreshingDetails && !requiresRevalidation
	);
	const cancelCycleRef = $derived(
		details && tracking?.mode === 'authenticated' ? tracking.details.cancelCycleRef : undefined
	);
	const canCancel = $derived(
		user?.role === 'Solicitante' &&
			!!details &&
			tracking?.mode === 'authenticated' &&
			tracking.details.canCancel === true &&
			detailsState === 'loaded' &&
			!isRefreshingDetails &&
			!requiresRevalidation
	);
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

	async function loadDetails(current: TrackingView, silent = false): Promise<void> {
		if (!isCurrentView(current)) return;
		const requesterIdentity = identity;
		if (!current.viaSession && !requesterIdentity) return;

		const version = ++detailsVersion;
		isRefreshingDetails = silent;
		refreshError = null;
		if (!silent) {
			detailsState = 'loading';
			detailsError = null;
			notFound = false;
		}

		const result =
			requesterIdentity && !current.viaSession
				? await getPublicTracking(current.protocol, requesterIdentity)
				: await getSessionTracking(current.protocol);
		if (!isCurrentView(current) || version !== detailsVersion) return;

		isRefreshingDetails = false;
		if (!result.ok) {
			if (handleTrackingAccessError(current, result.error.status, result.error.message)) return;
			if (silent) {
				if (requiresRevalidation) refreshError = result.error.message;
			} else {
				detailsState = 'error';
				accessState = 'error';
				detailsError = result.error.message;
			}
			return;
		}

		if (result.data.details.protocol !== current.protocol) {
			handleTrackingAccessError(current, 404, 'Solicitação não encontrada.');
			return;
		}

		tracking = result.data;
		detailsState = 'loaded';
		accessState = 'authorized';
		requiresRevalidation = false;
		if (
			(confirmation?.action === 'reopen' && reopenRef !== confirmation.closureRef) ||
			(confirmation?.action === 'cancel' &&
				(!canCancel || confirmation.cancelCycleRef !== cancelCycleRef))
		)
			confirmation = null;
		void refreshUnread(current, version);
	}

	async function refreshUnread(current: TrackingView, version: number): Promise<void> {
		const result = await getPendingItems(current.protocol, current.viaSession ? null : identity);
		if (!isCurrentView(current) || version !== detailsVersion) return;
		if (!result.ok) {
			if (result.error.status === 401 && !current.viaSession) {
				handleTrackingAccessError(current, 401, result.error.message);
			}
			return;
		}
		unreadCount = countUnreadRequesterItems(result.data.items);
	}

	function handleVerified(current: TrackingView, verified: { name: string; email: string }): void {
		if (!isCurrentView(current)) return;
		identity = saveRequesterIdentity({ protocol: current.protocol, ...verified });
		accessState = 'validating';
		void loadDetails(current);
	}

	function handleTrackingAccessError(
		current: TrackingView,
		status: number | undefined,
		message: string
	): boolean {
		if (status !== 401 && status !== 403 && status !== 404) return false;
		// Trocar a instância invalida também interações ainda em voo no mesmo protocolo.
		view = { ...current };
		clearRequesterIdentity();
		identity = null;
		tracking = null;
		confirmation = null;
		isSubmitting = false;
		isRefreshingDetails = false;
		requiresRevalidation = false;
		refreshError = null;
		unreadCount = 0;
		notFound = status === 404;
		detailsError = message;
		if (status === 401 && !current.viaSession) {
			accessState = 'validation-required';
			detailsState = 'empty';
			toastState.add('Valide seus dados para acompanhar esta solicitação.', 'error');
		} else {
			accessState = notFound ? 'invalid' : 'error';
			detailsState = notFound ? 'empty' : 'error';
		}
		return true;
	}

	function openOperation(action: RequestConfirmation['action']) {
		if (!view || isSubmitting) return;
		if (action === 'cancel' && canCancel) confirmation = { view, action, cancelCycleRef };
		else if (action === 'reopen' && canReopen && reopenRef)
			confirmation = { view, action, closureRef: reopenRef };
		operationError = null;
	}

	function closeOperation(target: RequestConfirmation) {
		if (!isSubmitting && confirmation === target) confirmation = null;
	}

	async function confirmOperation(target: RequestConfirmation, justification: string) {
		const current = target.view;
		if (
			isSubmitting ||
			confirmation !== target ||
			!isCurrentView(current) ||
			(target.action === 'reopen' && (!canReopen || reopenRef !== target.closureRef)) ||
			(target.action === 'cancel' && (!canCancel || target.cancelCycleRef !== cancelCycleRef)) ||
			!justification ||
			justification.length > MAX_REQUEST_JUSTIFICATION_LENGTH
		)
			return;

		isSubmitting = true;
		operationError = null;
		try {
			const result =
				target.action === 'reopen'
					? await reopenRequest(current.protocol, { justification, closureRef: target.closureRef })
					: await cancelRequest(current.protocol, justification, target.cancelCycleRef);
			if (!isCurrentView(current)) return;

			if (!result.ok) {
				const { status, code, message } = result.error;
				if (handleTrackingAccessError(current, status, message)) return;
				if (status === 422 && code !== 'rf07_not_eligible') {
					operationError = message;
					return;
				}
				confirmation = null;
				requiresRevalidation = true;
				toastState.add(
					status === 409 || code === 'rf07_not_eligible'
						? target.action === 'reopen'
							? 'O encerramento mudou. Confira os dados atualizados antes de confirmar novamente.'
							: 'A situação mudou. Confira os dados atualizados antes de confirmar novamente.'
						: 'Não foi possível confirmar a operação. Consulte a situação atual antes de tentar novamente.',
					'error'
				);
			} else {
				confirmation = null;
				requiresRevalidation = true;
				if (tracking?.mode === 'authenticated') {
					tracking = {
						...tracking,
						details: {
							...tracking.details,
							status: result.data.status,
							canCancel: false,
							cancelCycleRef: undefined,
							canReopen: false,
							closureRef: undefined
						}
					};
				}
				activeTab = 'solicitacao';
				toastState.add(
					target.action === 'reopen'
						? 'Solicitação reaberta com sucesso.'
						: 'Solicitação cancelada com sucesso.',
					'success'
				);
			}
			await loadDetails(current, true);
			if (result.ok && isCurrentView(current)) {
				await tick();
				if (isCurrentView(current)) heading?.focus({ preventScroll: true });
			}
		} finally {
			if (isCurrentView(current)) isSubmitting = false;
		}
	}

	function handleDataChanged(current: TrackingView): void {
		if (isCurrentView(current) && !isSubmitting) void loadDetails(current, true);
	}

	function selectTab(tab: TrackingTabId): void {
		activeTab = tab;
	}

	$effect(() => {
		const current = { protocol, viewer, viaSession };
		untrack(() => {
			if (view?.protocol !== current.protocol) {
				if (view) clearRequesterIdentity();
			}
			view = current;
			tracking = null;
			confirmation = null;
			operationError = null;
			isSubmitting = false;
			isRefreshingDetails = false;
			requiresRevalidation = false;
			refreshError = null;
			notFound = false;
			detailsError = null;
			unreadCount = 0;
			activeTab = 'solicitacao';
			identity = current.viaSession ? null : loadRequesterIdentity(current.protocol);
			const mustValidate = !current.viaSession && !identity;
			accessState = mustValidate ? 'validation-required' : 'checking';
			detailsState = mustValidate ? 'empty' : 'loading';
			if (!mustValidate) void loadDetails(current);
		});
	});

	onDestroy(() => {
		view = null;
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
{:else if accessState === 'validation-required' && view}
	{#key view}
		{@const current = view}
		<PublicValidationForm {protocol} onVerified={(verified) => handleVerified(current, verified)} />
	{/key}
{:else if accessState === 'validating' || accessState === 'checking' || detailsState === 'loading'}
	<div class="load-state" role="status" aria-live="polite">
		<p>Carregando solicitação…</p>
	</div>
{:else if detailsState === 'error'}
	<div class="error-state" role="alert">
		<p>{detailsError}</p>
		<button type="button" class="btn-retry" onclick={() => view && void loadDetails(view)}>
			Tentar novamente
		</button>
	</div>
{:else if details && detailsMode && view}
	{@const current = view}
	{@const statusStyle = statusThemeVars(details.status, statuses)}
	<div class="tracking-page">
		<div class="tracking-header">
			<div class="header-left">
				<span class="badge-active">{badgeLabel}</span>
				<h1 bind:this={heading} tabindex="-1">{details.demand.title}</h1>
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
				{#if canCancel}
					<Button
						variant="outline-neutral"
						onclick={() => openOperation('cancel')}
						disabled={isSubmitting}
					>
						Cancelar solicitação
					</Button>
				{/if}
				{#if canReopen}
					<Button variant="outline" onclick={() => openOperation('reopen')} disabled={isSubmitting}>
						Reabrir solicitação
					</Button>
				{/if}
			</div>
		</div>

		{#if refreshError}
			<div class="reopen-refresh-error" role="alert">
				<p>{refreshError}</p>
				<Button variant="outline" onclick={() => void loadDetails(current, true)}>
					Atualizar acompanhamento
				</Button>
			</div>
		{/if}

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
					onUnauthorized={() => {
						if (isCurrentView(current)) {
							handleTrackingAccessError(current, 401, 'Sua sessão expirou.');
						}
					}}
					onUnreadChange={(count) => {
						if (isCurrentView(current)) unreadCount = count;
					}}
					onDataChanged={() => handleDataChanged(current)}
				/>
			{/if}
		</div>
	</div>
{/if}

{#if confirmation && isCurrentView(confirmation.view)}
	{#key confirmation}
		{@const target = confirmation}
		<RequestOperationModal
			protocol={target.view.protocol}
			action={target.action}
			submitting={isSubmitting}
			serverError={operationError}
			onclose={() => closeOperation(target)}
			onsubmit={(justification) => void confirmOperation(target, justification)}
			onedit={() => {
				if (confirmation === target) operationError = null;
			}}
		/>
	{/key}
{/if}

<style>
	.right-status {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-sm);
	}

	.reopen-refresh-error {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	.reopen-refresh-error p {
		margin: 0;
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

		.right-status {
			align-items: flex-start;
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
