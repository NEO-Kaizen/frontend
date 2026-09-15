<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { updateInternalRequest } from '$lib/services/request.service';
	import type { InternalRequestDetail, RequestStatus } from '$lib/types/request';
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
	import QuickActions from './QuickActions.svelte';

	interface Props {
		solicitation: InternalRequestDetail;
		onSaveSuccess?: (updated: InternalRequestDetail) => void;
		onSaveError?: (message: string) => void;
	}

	let { solicitation, onSaveSuccess, onSaveError }: Props = $props();

	let activeTab = $state('informacoes');
	let isEditMode = $state(false);
	let draft = $state<EditableDraft | null>(null);
	let errors = $state<Record<string, string>>({});
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let saveSuccess = $state<string | null>(null);
	let showDiscardModal = $state(false);
	let editButton = $state<HTMLButtonElement | null>(null);
	let detailsCard = $state<HTMLElement | null>(null);

	const prefersReducedMotion =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	// Transição única suave: mesma distância/duração para entrada/saída evita "pulo"
	// quando os dois ramos ({#if}/{:else}) trocam simultaneamente.
	const editButtonFlight = {
		in: { x: 12, duration: prefersReducedMotion ? 0 : 160, delay: prefersReducedMotion ? 0 : 80 },
		out: { x: 12, duration: prefersReducedMotion ? 0 : 140 }
	};
	const editActionsFlight = {
		in: { x: 12, duration: prefersReducedMotion ? 0 : 160, delay: prefersReducedMotion ? 0 : 80 },
		out: { x: 12, duration: prefersReducedMotion ? 0 : 140 }
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
		saveSuccess = null;
		isEditMode = true;
		activeTab = 'informacoes';
		tick().then(() => focusFirstEditable(null));
	}

	function exitEditMode(): void {
		isEditMode = false;
		draft = null;
		errors = {};
		saveError = null;
		showDiscardModal = false;
		activeTab = 'informacoes';
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
		saveSuccess = null;
		const result = await updateInternalRequest(
			solicitation.protocol,
			toUpdatePayload(draft, solicitation)
		);
		isSaving = false;
		if (result.ok) {
			isEditMode = false;
			draft = null;
			errors = {};
			saveSuccess = 'Alterações salvas com sucesso.';
			onSaveSuccess?.(result.data);
			await invalidateAll();
			tick().then(() => editButton?.focus());
		} else {
			saveError = result.error.message;
			onSaveError?.(result.error.message);
		}
	}

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
	let maxScore = $derived(solicitation.prioritization.maxScore ?? 50);

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

	function handleTabClick(tab: TabItem) {
		if (tab.disabled) {
			return;
		}
		// Aba travada em "informações" durante a edição.
		if (isEditMode && tab.id !== 'informacoes') {
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
			? `Prioridade ${priorityLabel} com pontuação ${displayScore} de ${maxScore}`
			: 'Prioridade a ser calculada'}
	>
		<span class="prio-label">
			<Icon iconName="security" iconSize="sm" />
			Priorização
		</span>
		<div class="prio-score-row">
			<span class="prio-score" class:muted={!isPriorityCalculated}>
				{displayScore}<span class="prio-max">/{maxScore}</span>
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
			{:else}
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
{/snippet}

<div class="solicitation-specs-page">
	{@render headerSnippet()}

	<section class="details-card" aria-label="Detalhes da solicitação" bind:this={detailsCard}>
		{@render specTabsSnippet()}

		{#if saveError}
			<p class="save-feedback save-error" role="alert">{saveError}</p>
		{/if}
		{#if saveSuccess && !isEditMode}
			<p class="save-feedback save-success" role="status">{saveSuccess}</p>
		{/if}

		<div class="tab-content">
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
				<p class="placeholder">Conteúdo de {activeTab} — implementação futura</p>
			{/if}
		</div>

		<QuickActions />
	</section>
</div>

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
		min-width: 92px;
		justify-content: flex-end;
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

	@media (prefers-reduced-motion: reduce) {
		.btn-save,
		.btn-cancel {
			transition: none;
		}
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
