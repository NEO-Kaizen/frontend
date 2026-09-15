<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { updateInternalRequest } from '$lib/services/request.service';
	import type { InternalRequestDetail } from '$lib/types/request';
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
		onSaveSuccess?: (updated: InternalRequestDetail) => void;
		onSaveError?: (message: string) => void;
	}

	let { solicitation, onSaveSuccess, onSaveError }: Props = $props();

	type SpecTabId = 'informacoes' | 'triagem' | 'mapeamento' | 'historico' | 'observacoes';

	const DEFAULT_TAB_ID: SpecTabId = 'informacoes';

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

	function resolveActiveTab(param: string | null): SpecTabId {
		const tab = SPEC_TABS.find((item) => item.id === param);
		if (tab && tab.enabled) {
			return tab.id;
		}
		return DEFAULT_TAB_ID;
	}

	const activeTab = $derived(resolveActiveTab(page.url.searchParams.get('aba')));

	const activeTabLabel = $derived(
		SPEC_TABS.find((tab) => tab.id === activeTab)?.label ??
			SPEC_TABS.find((tab) => tab.id === DEFAULT_TAB_ID)?.label ??
			DEFAULT_TAB_ID
	);

	// Botão Editar visível apenas para Administrador ou o responsável pela triagem.
	// Regra definitiva é decidida pela issue #121 (modo de edição).
	// TODO: comparar por `assignee.id` quando o contrato do backend fornecer o
	// id do responsável (hoje só há email no mock/contrato).
	const currentUser = $derived(page.data.user);
	const canEdit = $derived(
		currentUser?.role === 'Administrador' ||
			Boolean(currentUser && solicitation.assignee?.email === currentUser.email)
	);

	function handleTabSelect(tab: SpecTabDefinition) {
		if (!tab.enabled) return;
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
			const tab = SPEC_TABS.find((item) => item.id === DEFAULT_TAB_ID);
			if (tab) handleTabSelect(tab);
		}
	}

	// ---- Modo de edição (issue #121) ----

	let isEditMode = $state(false);
	let draft = $state<EditableDraft | null>(null);
	let errors = $state<Record<string, string>>({});
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state<string | null>(null);
	let showDiscardModal = $state(false);
	let editButton = $state<HTMLButtonElement | null>(null);
	let detailsCard = $state<HTMLElement | null>(null);

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
</script>

<section class="details-card" aria-label="Detalhes da solicitação" bind:this={detailsCard}>
	<div class="tabs-bar" role="tablist" aria-label="Abas da solicitação">
		<div class="tabs-left">
			{#each SPEC_TABS as tab (tab.id)}
				<button
					type="button"
					role="tab"
					id={`spec-tab-${tab.id}`}
					aria-selected={activeTab === tab.id}
					aria-disabled={!tab.enabled ? 'true' : undefined}
					aria-controls="spec-panel"
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
		<div class="tabs-right">
			{#if isEditMode}
				<div
					class="edit-actions"
					role="group"
					aria-label="Ações de edição"
					in:fly={editActionsFlight.in}
					out:fly={editActionsFlight.out}
				>
					<button
						type="button"
						class="btn-save"
						disabled={isSaving}
						aria-busy={isSaving}
						title={isSaving ? 'Salvando alterações…' : 'Salvar alterações'}
						onclick={handleSave}
					>
						<Icon iconName="check" iconSize="sm" />
						<span>{isSaving ? 'Salvando…' : 'Salvar'}</span>
					</button>
					<button
						type="button"
						class="btn-cancel"
						disabled={isSaving}
						title="Descartar alterações e voltar"
						onclick={handleCancel}
					>
						<Icon iconName="close" iconSize="sm" />
						<span>Cancelar</span>
					</button>
				</div>
			{:else if canEdit}
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
	{#if saveSuccess && !isEditMode}
		<p class="save-feedback save-success" role="status">{saveSuccess}</p>
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
			/>
		{:else}
			<p class="placeholder">Conteúdo de {activeTabLabel} — implementação futura</p>
		{/if}
	</div>
</section>

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

	.edit-actions {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.btn-save,
	.btn-cancel {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--white);
		cursor: pointer;
		white-space: nowrap;
		transition:
			opacity 150ms ease,
			background 150ms ease;
	}

	.btn-save {
		background-color: var(--status-green);
		border-color: var(--status-green);
	}

	.btn-cancel {
		background-color: var(--status-red);
		border-color: var(--status-red);
	}

	.btn-save:hover:not(:disabled),
	.btn-cancel:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-save:focus-visible,
	.btn-cancel:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.btn-save:disabled,
	.btn-cancel:disabled {
		cursor: not-allowed;
		opacity: 0.6;
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
