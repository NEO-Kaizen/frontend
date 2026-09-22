<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { canEditSolicitation } from '$lib/services/access.service';
	import {
		buildCreatePendingItemsPayload,
		findOpenBatch,
		listPendencies,
		requestFieldChange,
		toPendingBatches
	} from '$lib/services/pendency.service';
	import { updateInternalRequest } from '$lib/services/request.service';
	import { toastState } from '$lib/states/toast.svelte';
	import type { InternalNote, InternalNotesResponse } from '$lib/types/internal-note';
	import type { ListPendenciesResponse, PendingBatch } from '$lib/types/pendency';
	import type { InternalRequestDetail } from '$lib/types/request';
	import type { Result } from '$lib/types/result';
	import InternalNotesSection from './InternalNotesSection.svelte';
	import ConversationHistory from './conversation/ConversationHistory.svelte';
	import MappingSection from './mapping/MappingSection.svelte';
	import PendingItemsModal from './pendency/PendingItemsModal.svelte';
	import PendencyRequestModal from './pendency/PendencyRequestModal.svelte';
	import { onDestroy, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import InfoSection from './solicitation-info/InfoSection.svelte';
	import {
		applyFieldChange,
		checkDraftDirty,
		toEditableDraft,
		toUpdatePayload,
		validateEditDraft,
		validateEditField,
		type EditableDraft
	} from './solicitation-info/edit-validation';

	interface Props {
		solicitation: InternalRequestDetail;
		internalNotes: InternalNotesResponse | null;
		internalNotesError: string | null;
		pendencies: ListPendenciesResponse | null;
		pendenciesError: string | null;
		onSaveSuccess?: (updated: InternalRequestDetail) => void;
		onSaveError?: (message: string) => void;
		isPendencyMode?: boolean;
		pendencyCount?: number;
		isPendencySaving?: boolean;
		pendingSuccessText?: string | null;
		markedFieldKeys?: ReadonlySet<string>;
		onFieldPendencyClick?: (path: string) => void;
		onFieldPendencyRemove?: (path: string) => void;
		onPendencySave?: () => void;
		onPendencyCancel?: () => void;
		onRequestFieldChange?: (draft?: { observation: string; requestAttachment: boolean }) => void;
	}

	let {
		solicitation,
		internalNotes,
		internalNotesError,
		pendencies,
		pendenciesError,
		onSaveSuccess,
		onSaveError,
		isPendencyMode = false,
		pendencyCount = 0,
		isPendencySaving = false,
		pendingSuccessText = null,
		markedFieldKeys = new Set<string>(),
		onFieldPendencyClick,
		onFieldPendencyRemove,
		onPendencySave,
		onPendencyCancel,
		onRequestFieldChange
	}: Props = $props();

	function getInitialInternalNotesState(): {
		items: InternalNote[];
		unseenCount: number;
		loadError: string | null;
	} {
		return {
			items: [...(internalNotes?.items ?? [])],
			unseenCount: internalNotes?.unseenCount ?? 0,
			loadError: internalNotesError
		};
	}

	const initialInternalNotesState = getInitialInternalNotesState();
	let internalNoteItems = $state<InternalNote[]>(initialInternalNotesState.items);
	let internalNotesUnseenCount = $state(initialInternalNotesState.unseenCount);
	let internalNotesLoadError = $state<string | null>(initialInternalNotesState.loadError);

	type SpecTabId = 'informacoes' | 'triagem' | 'mapeamento' | 'historico' | 'observacoes';

	const DEFAULT_TAB_ID: SpecTabId = 'informacoes';

	type SpecTabDefinition = {
		id: SpecTabId;
		label: string;
		icon: 'description' | 'filter' | 'calendarCheck' | 'history' | 'info';
		enabled: boolean;
		badge?: number;
	};

	// ---- Modo de edição (issue #121) ----
	// `isEditMode` fica no topo porque a aba ativa deriva dele (edição trava
	// a aba em `informacoes` para não perder o rascunho).
	let isEditMode = $state(false);

	// Lotes visuais do histórico (uma pendência = um `batchId`, §5) a partir da
	// listagem do server load. O badge conta itens `responded` — respostas
	// aguardando revisão do analista.
	const pendencyBatches = $derived<PendingBatch[]>(toPendingBatches(pendencies ?? []));
	const respondedPendencyCount = $derived(
		pendencyBatches.reduce((count, batch) => count + batch.respondedCount, 0)
	);

	// Criação direta pela aba de histórico (§4): mesmo modal de lote único da
	// 123, com seleção de campos interna. Bloqueada com lote em aberto (D-P22).
	const openBatch = $derived(findOpenBatch(pendencyBatches));

	let showCreateModal = $state(false);
	let isCreateSaving = $state(false);
	let createError = $state<string | null>(null);

	function handleOpenCreate(): void {
		if (openBatch) return;
		createError = null;
		showCreateModal = true;
	}

	// Atalho do modal para o fluxo de alteração de campos do Quick Action
	// (marcação por campo): fecha o modal e reutiliza aquele fluxo — sem
	// duplicar a implementação. Repassa o rascunho (observação + anexo)
	// digitado no modal para que o fluxo de marcação o preserve.
	function handleRequestFieldChange(draft?: {
		observation: string;
		requestAttachment: boolean;
	}): void {
		showCreateModal = false;
		onRequestFieldChange?.(draft);
	}

	async function handleCreateConfirm(value: {
		observation: string;
		requestAttachment: boolean;
		items: { fieldKey: string; comment: string }[];
	}): Promise<void> {
		if (isCreateSaving || openBatch) return;
		const payload = buildCreatePendingItemsPayload({
			observation: value.observation,
			requestAttachment: value.requestAttachment,
			items: value.items
		});
		isCreateSaving = true;
		createError = null;
		const result = await requestFieldChange(solicitation.protocol, payload);
		isCreateSaving = false;
		if (result.ok) {
			showCreateModal = false;
			toastState.add('Pendência solicitada com sucesso.', 'success');
			await invalidateAll();
		} else {
			createError = result.error.message;
		}
	}

	// O badge de observações representa itens ainda não visualizados pelo usuário,
	// não notificações.
	let specTabs = $derived<readonly SpecTabDefinition[]>([
		{ id: 'informacoes', label: 'Informações', icon: 'description', enabled: true },
		{ id: 'triagem', label: 'Triagem', icon: 'filter', enabled: false },
		{
			id: 'mapeamento',
			label: 'Mapeamento',
			icon: 'calendarCheck',
			enabled: true
		},
		{
			id: 'historico',
			label: 'Histórico de Pendências',
			icon: 'history',
			enabled: true,
			badge: respondedPendencyCount > 0 ? respondedPendencyCount : undefined
		},
		{
			id: 'observacoes',
			label: 'Observações Internas',
			icon: 'info',
			enabled: true,
			badge: internalNotesUnseenCount > 0 ? internalNotesUnseenCount : undefined
		}
	]);

	function resolveActiveTab(param: string | null): SpecTabId {
		const tab = specTabs.find((item) => item.id === param);
		if (tab && tab.enabled) {
			return tab.id;
		}
		return DEFAULT_TAB_ID;
	}

	// Durante a edição das informações a aba fica travada em `informacoes`
	// para não perder o rascunho (o mapeamento tem fluxo próprio de edição).
	const activeTab = $derived(
		isEditMode ? DEFAULT_TAB_ID : resolveActiveTab(page.url.searchParams.get('aba'))
	);

	const activeTabLabel = $derived(
		specTabs.find((tab) => tab.id === activeTab)?.label ??
			specTabs.find((tab) => tab.id === DEFAULT_TAB_ID)?.label ??
			DEFAULT_TAB_ID
	);

	// Botão Editar visível apenas para quem pode editar o conteúdo interno
	// (Administrador ou responsável atribuído — regra em `access.service`).
	// Gestor e demais perfis visualizam em somente leitura.
	// A permissão do mapeamento usa exclusivamente o responsável do mapeamento
	// (`mappingAssigneeId`). A fonte é o primeiro GET da solicitação + `/auth/me`
	// (via `page.data.user`) — nunca o GET do mapeamento.
	const currentUser = $derived(page.data.user);
	const mappingAssigneeId = $derived(solicitation.mappingAssigneeId);
	const canEdit = $derived(canEditSolicitation(solicitation.assignee?.id, currentUser ?? null));
	const canEditMapping = $derived(canEditSolicitation(mappingAssigneeId, currentUser ?? null));

	function handleTabSelect(tab: SpecTabDefinition) {
		if (!tab.enabled || isEditMode) return;
		clearSaveSuccess();

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

	function ensureInfoTab(): void {
		if (activeTab !== DEFAULT_TAB_ID) {
			const tab = specTabs.find((item) => item.id === DEFAULT_TAB_ID);
			if (tab) handleTabSelect(tab);
		}
	}

	// Ao entrar no modo de marcação, a aba de Informações é obrigatória (é onde
	// os campos editáveis ficam visíveis). Rascunho é mantido entre abas.
	$effect(() => {
		if (isPendencyMode && !wasPendencyMode) {
			ensureInfoTab();
		}
		wasPendencyMode = isPendencyMode;
	});

	// ---- Modo de edição (issue #121) ----

	let draft = $state<EditableDraft | null>(null);
	let errors = $state<Record<string, string>>({});
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state<string | null>(null);
	let showDiscardModal = $state(false);
	let editButton = $state<HTMLButtonElement | null>(null);
	let detailsCard = $state<HTMLElement | null>(null);
	let wasPendencyMode = false;

	const SAVE_SUCCESS_TIMEOUT_MS = 4000;
	let saveSuccessTimer: ReturnType<typeof setTimeout> | undefined;

	function clearSaveSuccess(): void {
		if (saveSuccessTimer !== undefined) {
			clearTimeout(saveSuccessTimer);
			saveSuccessTimer = undefined;
		}
		saveSuccess = null;
	}

	onDestroy(clearSaveSuccess);

	// Mensagem de sucesso do modo marcação vem do pai via prop; reutiliza o
	// mesmo elemento e o mesmo timeout do modo edição, apenas escondendo a
	// exibição após o intervalo (o estado do pai fica intacto).
	let pendingSuccessDismissed = $state(false);
	$effect(() => {
		pendingSuccessDismissed = !pendingSuccessText;
		if (!pendingSuccessText) return;
		const timer = setTimeout(() => {
			pendingSuccessDismissed = true;
		}, SAVE_SUCCESS_TIMEOUT_MS);
		return () => clearTimeout(timer);
	});

	const successMessage = $derived(
		saveSuccess ?? (pendingSuccessDismissed ? null : pendingSuccessText)
	);

	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	// Transição única suave: mesma distância/duração para entrada/saída evita "pulo"
	// quando os dois ramos ({#if}/{:else}) trocam simultaneamente.
	const editButtonFlight = {
		in: { x: 100, duration: prefersReducedMotion ? 0 : 160, delay: prefersReducedMotion ? 0 : 80 },
		out: { x: 100, duration: prefersReducedMotion ? 0 : 140 }
	};
	const editActionsFlight = {
		in: { x: 100, duration: prefersReducedMotion ? 0 : 160, delay: prefersReducedMotion ? 0 : 80 },
		out: { x: 100, duration: prefersReducedMotion ? 0 : 140 }
	};

	function focusFirstEditable(selectorScope: string | null): void {
		const root = detailsCard;
		if (!root) return;
		const selector = selectorScope
			? `${selectorScope} input:not(:disabled), ${selectorScope} select:not(:disabled), ${selectorScope} textarea:not(:disabled)`
			: '.field-editor input:not(:disabled), .field-editor select:not(:disabled), .field-editor textarea:not(:disabled)';
		const target = root.querySelector<HTMLElement>(selector);
		target?.focus();
	}

	function handleEdit(): void {
		draft = toEditableDraft(solicitation);
		errors = {};
		saveError = null;
		clearSaveSuccess();
		isEditMode = true;
		ensureInfoTab();
		tick().then(() => focusFirstEditable(null));
	}

	function exitEditMode(): void {
		isEditMode = false;
		draft = null;
		errors = {};
		saveError = null;
		showDiscardModal = false;
		ensureInfoTab();
		tick().then(() => editButton?.focus());
	}

	function handleCancel(): void {
		if (!draft) {
			exitEditMode();
			return;
		}
		if (checkDraftDirty(draft, solicitation)) {
			showDiscardModal = true;
			return;
		}
		exitEditMode();
	}

	function handleFieldChange(path: string, value: string): void {
		if (!draft) return;
		applyFieldChange(draft, path, value);
		// Padrão clearError do formulário: limpa o erro do campo (e do par
		// escolha/detalhe) sem validar o restante.
		if (path.endsWith('Detail')) {
			delete errors[path];
			delete errors[path.slice(0, -'Detail'.length)];
		} else {
			delete errors[path];
			delete errors[`${path}Detail`];
		}
	}

	function handleFieldBlur(path: string): void {
		if (!draft) return;
		const next = validateEditField(draft, path);
		const related = path.endsWith('Detail')
			? [path, path.slice(0, -'Detail'.length)]
			: [path, `${path}Detail`];
		for (const key of related) delete errors[key];
		Object.assign(errors, next);
	}

	async function handleSave(): Promise<void> {
		if (!draft || isSaving) return;
		const validation = validateEditDraft(draft);
		errors = validation;
		if (Object.keys(validation).length > 0) {
			saveError = 'Revise os campos destacados antes de salvar.';
			tick().then(() => focusFirstEditable('.field-editor.is-invalid'));
			return;
		}
		isSaving = true;
		saveError = null;
		clearSaveSuccess();
		const result = await updateInternalRequest(
			solicitation.protocol,
			toUpdatePayload(draft, solicitation)
		);
		isSaving = false;
		if (result.ok) {
			isEditMode = false;
			draft = null;
			errors = {};
			clearSaveSuccess();
			saveSuccess = 'Alterações salvas com sucesso.';
			saveSuccessTimer = setTimeout(() => {
				saveSuccess = null;
				saveSuccessTimer = undefined;
			}, SAVE_SUCCESS_TIMEOUT_MS);
			onSaveSuccess?.(result.data);
			await invalidateAll();
			tick().then(() => editButton?.focus());
		} else {
			saveError = result.error.message;
			onSaveError?.(result.error.message);
		}
	}

	function handleInternalNotesLoaded(response: InternalNotesResponse): void {
		internalNoteItems = response.items;
		internalNotesUnseenCount = response.unseenCount;
		internalNotesLoadError = null;
	}

	function handleInternalNotesLoadError(message: string): void {
		internalNotesLoadError = message;
	}

	function handleInternalNoteCreated(note: InternalNote): void {
		internalNoteItems = [...internalNoteItems, note];
	}

	function handleInternalNotesMarkedRead(): void {
		internalNotesUnseenCount = 0;
	}

	// ---- Histórico de pendências (contrato v0.4, visão do analista) ----

	async function handleRetryPendencies(): Promise<Result<ListPendenciesResponse>> {
		return listPendencies(solicitation.protocol);
	}

	// A revisão (individual por item ou parcial do lote, §7–§8) vive no
	// PendingItemsModal — o histórico só delega, sem duplicar a regra.
	// `reviewFocusBatchId` abre o modal com a aba de respondidas e rola até o lote.
	let showReviewModal = $state(false);
	let reviewFocusBatchId = $state<string | null>(null);

	function handleReviewBatch(batch: PendingBatch): void {
		reviewFocusBatchId = batch.batchId;
		showReviewModal = true;
	}

	function handleReviewModalClose(): void {
		showReviewModal = false;
		reviewFocusBatchId = null;
	}

	async function handleReviewSaved(): Promise<void> {
		handleReviewModalClose();
		await invalidateAll();
	}
</script>

<section class="details-card" aria-label="Detalhes da solicitação" bind:this={detailsCard}>
	<div class="tabs-bar" role="tablist" aria-label="Abas da solicitação">
		<div class="tabs-left">
			{#each specTabs as tab (tab.id)}
				<button
					type="button"
					role="tab"
					id={`spec-tab-${tab.id}`}
					aria-selected={activeTab === tab.id}
					aria-disabled={!tab.enabled || (isEditMode && tab.id !== 'informacoes')
						? 'true'
						: undefined}
					aria-controls="spec-panel"
					disabled={!tab.enabled || (isEditMode && tab.id !== 'informacoes')}
					class="tab-item"
					class:active={activeTab === tab.id}
					class:disabled={!tab.enabled || (isEditMode && tab.id !== 'informacoes')}
					onclick={() => handleTabSelect(tab)}
				>
					<Icon iconName={tab.icon} iconSize="sm" />
					<span>{tab.label}</span>
					{#if tab.badge}
						<span
							class="tab-badge"
							aria-label={tab.id === 'historico'
								? `${tab.badge} respostas de pendência aguardando revisão`
								: `${tab.badge} observações ainda não visualizadas`}
						>
							{tab.badge}
						</span>
					{/if}
				</button>
			{/each}
		</div>
		<div class="tabs-right">
			{#if isEditMode}
				<div
					class="edit-actions"
					role="group"
					aria-label="Ações de edição"
					in:fly={editActionsFlight.in}
					out:fly={editActionsFlight.out}
				>
					<Button
						variant="primary"
						disabled={isSaving}
						loading={isSaving}
						title={isSaving ? 'Salvando alterações…' : 'Salvar alterações'}
						onclick={handleSave}
					>
						<Icon iconName="check" iconSize="sm" />
						<span>{isSaving ? 'Salvando…' : 'Salvar'}</span>
					</Button>
					<Button
						variant="outline-neutral"
						disabled={isSaving}
						title="Descartar alterações e voltar"
						onclick={handleCancel}
					>
						<Icon iconName="close" iconSize="sm" />
						<span>Cancelar</span>
					</Button>
				</div>
			{:else if isPendencyMode}
				<div
					class="edit-actions"
					role="group"
					aria-label="Ações de solicitação de alteração"
					in:fly={editActionsFlight.in}
					out:fly={editActionsFlight.out}
				>
					<Button
						variant="primary"
						disabled={isPendencySaving}
						loading={isPendencySaving}
						title={isPendencySaving
							? 'Enviando solicitação…'
							: pendencyCount === 0
								? 'Solicitar pendência (observação e/ou campos)'
								: 'Revisar e solicitar pendência'}
						onclick={onPendencySave}
					>
						<Icon iconName="flag" iconSize="sm" />
						<span>
							{isPendencySaving
								? 'Enviando…'
								: pendencyCount === 0
									? 'Solicitar pendência'
									: `Solicitar pendência (${pendencyCount})`}
						</span>
					</Button>
					<Button
						variant="outline-neutral"
						disabled={isPendencySaving}
						title="Cancelar solicitação de alteração"
						onclick={onPendencyCancel}
					>
						<Icon iconName="close" iconSize="sm" />
						<span>Cancelar</span>
					</Button>
				</div>
			{:else if canEdit && activeTab === 'informacoes'}
				<button
					type="button"
					bind:this={editButton}
					class="tab-item"
					in:fly={editButtonFlight.in}
					out:fly={editButtonFlight.out}
					title="Editar informações da solicitação"
					onclick={handleEdit}
				>
					<Icon iconName="edit" iconSize="sm" />
					<span>Editar</span>
				</button>
			{/if}
		</div>
	</div>

	{#if saveError}
		<p class="save-feedback save-error" role="alert">{saveError}</p>
	{/if}
	{#if successMessage && !isEditMode}
		<p class="save-feedback save-success" role="status">{successMessage}</p>
	{/if}

	<div
		id="spec-panel"
		class="tab-content"
		role="tabpanel"
		aria-labelledby={`spec-tab-${activeTab}`}
	>
		{#if activeTab === 'informacoes'}
			<InfoSection
				{solicitation}
				{isEditMode}
				{draft}
				{errors}
				onFieldChange={handleFieldChange}
				onFieldBlur={handleFieldBlur}
				{isPendencyMode}
				{markedFieldKeys}
				{onFieldPendencyClick}
				{onFieldPendencyRemove}
			/>
		{:else if activeTab === 'mapeamento'}
			<MappingSection {solicitation} canEdit={canEditMapping} />
		{:else if activeTab === 'historico'}
			<ConversationHistory
				initialBatches={pendencyBatches}
				initialLoading={false}
				initialError={pendenciesError}
				correctionAlertBatchId={solicitation.correctionAlert?.batchId ?? null}
				canRequestCreate={!openBatch}
				onRetry={handleRetryPendencies}
				onReviewBatch={handleReviewBatch}
				onRequestCreate={handleOpenCreate}
			/>
		{:else if activeTab === 'observacoes'}
			<InternalNotesSection
				protocol={solicitation.protocol}
				notes={internalNoteItems}
				loadError={internalNotesLoadError}
				currentUserId={currentUser?.id ?? ''}
				onNotesLoaded={handleInternalNotesLoaded}
				onLoadError={handleInternalNotesLoadError}
				onNoteCreated={handleInternalNoteCreated}
				onMarkedRead={handleInternalNotesMarkedRead}
			/>
		{:else}
			<p class="placeholder">Conteúdo de {activeTabLabel} — implementação futura</p>
		{/if}
	</div>
</section>

{#if showCreateModal}
	<PendencyRequestModal
		entries={[]}
		isSaving={isCreateSaving}
		serverError={createError}
		onConfirm={(value) => void handleCreateConfirm(value)}
		onRequestFieldChange={handleRequestFieldChange}
		onclose={() => (showCreateModal = false)}
	/>
{/if}

{#if showReviewModal}
	<PendingItemsModal
		protocol={solicitation.protocol}
		{currentUser}
		assigneeId={solicitation.assignee?.id ?? null}
		initialTab="responded"
		focusBatchId={reviewFocusBatchId}
		onclose={handleReviewModalClose}
		onSaved={() => void handleReviewSaved()}
	/>
{/if}

{#if showDiscardModal}
	<Modal title="Descartar alterações?" onclose={() => (showDiscardModal = false)}>
		<div class="discard-body">
			<p>Há alterações não salvas. Deseja descartá-las e sair do modo de edição?</p>
			<div class="discard-actions">
				<Button variant="outline-neutral" onclick={() => (showDiscardModal = false)}>
					Continuar editando
				</Button>
				<Button variant="primary" onclick={exitEditMode}>Descartar alterações</Button>
			</div>
		</div>
	</Modal>
{/if}

<style>
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
		min-width: 0;
		overflow: hidden;
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
		color: var(--on-primary);
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
		color: var(--on-primary);
		font-size: 11px;
		font-weight: 700;
		line-height: 1;
	}

	.tab-item.active .tab-badge {
		background: var(--white);
		color: var(--primary-color);
	}

	.edit-actions {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.save-feedback {
		margin: 0;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
	}

	.save-error {
		background-color: var(--status-red-bg);
		color: var(--status-red);
		border: 1px solid var(--status-red);
	}

	.save-success {
		background-color: var(--status-green-bg);
		color: var(--status-green);
		border: 1px solid var(--status-green);
	}

	.discard-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.discard-body p {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--black);
		line-height: 1.5;
	}

	.discard-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
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

	@media (prefers-reduced-motion: reduce) {
		.btn-save,
		.btn-cancel {
			transition: none;
		}
	}

	@media (max-width: 768px) {
		.tabs-right {
			margin-left: 0;
			margin-top: 4px;
		}

		.details-card {
			padding: var(--spacing-md);
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
