<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import {
		requestFieldChange,
		buildCreatePendingItemsPayload
	} from '$lib/services/pendency.service';
	import type { PendingFieldRef } from '$lib/types/pendency';
	import { toastState } from '$lib/states/toast.svelte';
	import { statusThemeVars } from '$lib/utils/status';
	import type { InternalNotesResponse } from '$lib/types/internal-note';
	import type { InternalRequestDetail, RequestStatus } from '$lib/types/request';
	import { SvelteMap } from 'svelte/reactivity';
	import { buildFieldLookup } from '$lib/pendency/field-catalog';
	import FieldPendencyModal from './pendency/FieldPendencyModal.svelte';
	import PendencyRequestModal from './pendency/PendencyRequestModal.svelte';
	import QuickActions from './QuickActions.svelte';
	import SpecTabs from './SpecTabs.svelte';

	interface Props {
		solicitation: InternalRequestDetail;
		internalNotes: InternalNotesResponse | null;
		internalNotesError: string | null;
		onSaveSuccess?: (updated: InternalRequestDetail) => void;
		onSaveError?: (message: string) => void;
	}

	let { solicitation, internalNotes, internalNotesError, onSaveSuccess, onSaveError }: Props =
		$props();

	const currentUser = $derived(page.data.user);

	async function handlePendencySaved(): Promise<void> {
		await invalidateAll();
	}

	// ---- Modo "Solicitar Alteração" (marcação por campo + envio em lote) ----

	type PendencyDraftEntry = {
		field: PendingFieldRef;
		comment: string;
	};

	let isPendencyMode = $state(false);
	let pendingDraft = new SvelteMap<string, PendencyDraftEntry>();
	let pendingFieldPath = $state<string | null>(null);
	let isPendencySaving = $state(false);
	let pendencyError = $state<string | null>(null);
	let pendingSuccess = $state<string | null>(null);
	let showPendencyCancelConfirm = $state(false);
	// Lote v0.4: observação geral + pedido de anexo (do lote) + campos do draft.
	// Preenchidos no modal de solicitação; enviados em um único POST.
	let pendingObservation = $state('');
	let pendingRequestAttachment = $state(false);
	let showPendencyRequestModal = $state(false);

	const fieldLookup = $derived(buildFieldLookup(solicitation));
	const markedFieldKeys = $derived(new Set(pendingDraft.keys()));
	const pendencyCount = $derived(pendingDraft.size);
	const pendingFieldRef = $derived(
		pendingFieldPath ? (fieldLookup.get(pendingFieldPath) ?? null) : null
	);
	const pendingFieldEntry = $derived(
		pendingFieldPath ? (pendingDraft.get(pendingFieldPath) ?? null) : null
	);
	// Entradas do lote para o modal de confirmação (reaproveita o draft).
	const pendingEntries = $derived(
		[...pendingDraft.values()].map(({ field, comment }) => ({ field, comment }))
	);

	function enterPendencyMode(): void {
		if (isPendencyMode) return;
		pendingDraft.clear();
		pendingFieldPath = null;
		pendencyError = null;
		pendingSuccess = null;
		pendingObservation = '';
		pendingRequestAttachment = false;
		showPendencyRequestModal = false;
		showPendencyCancelConfirm = false;
		isPendencyMode = true;
	}

	function exitPendencyMode(): void {
		isPendencyMode = false;
		pendingDraft.clear();
		pendingFieldPath = null;
		pendencyError = null;
		pendingObservation = '';
		pendingRequestAttachment = false;
		showPendencyRequestModal = false;
		showPendencyCancelConfirm = false;
	}

	function handleFieldPendencyClick(path: string): void {
		if (!fieldLookup.has(path)) return;
		pendingFieldPath = path;
		pendencyError = null;
	}

	function handlePendencyConfirm(value: { comment: string }): void {
		if (pendingFieldPath && pendingFieldRef) {
			pendingDraft.set(pendingFieldPath, {
				field: pendingFieldRef,
				comment: value.comment
			});
		}
		pendingFieldPath = null;
	}

	function handlePendencyRemove(path: string): void {
		if (!fieldLookup.has(path)) return;
		pendingDraft.delete(path);
		if (pendingFieldPath === path) {
			pendingFieldPath = null;
		}
	}

	function handlePendencyCancelRequest(): void {
		if (pendingDraft.size === 0 && !pendingObservation.trim() && !pendingRequestAttachment) {
			exitPendencyMode();
			return;
		}
		showPendencyCancelConfirm = true;
	}

	// Abre o modal do lote (observação + anexo + resumo dos campos). Permite
	// lote só com observação (sem campo marcado) — a validação final fica no
	// modal + service antes do POST único.
	function handlePendencySaveRequest(): void {
		if (isPendencySaving) return;
		pendencyError = null;
		showPendencyRequestModal = true;
	}

	// Confirmação do modal: um único POST com o lote inteiro (observação e/ou
	// campos + requestAttachment do lote). Após sucesso: fecha o modal, limpa
	// o draft e mostra feedback — sem tela de histórico (etapas futuras).
	async function handlePendencyRequestConfirm(value: {
		observation: string;
		requestAttachment: boolean;
	}): Promise<void> {
		if (isPendencySaving) return;
		pendingObservation = value.observation;
		pendingRequestAttachment = value.requestAttachment;
		const payload = buildCreatePendingItemsPayload({
			observation: pendingObservation,
			requestAttachment: pendingRequestAttachment,
			items: [...pendingDraft.values()].map(({ field, comment }) => ({
				fieldKey: field.fieldKey,
				comment
			}))
		});
		isPendencySaving = true;
		pendencyError = null;
		pendingSuccess = null;
		const result = await requestFieldChange(solicitation.protocol, payload);
		isPendencySaving = false;
		if (result.ok) {
			showPendencyRequestModal = false;
			exitPendencyMode();
			pendingSuccess = 'Pendência solicitada ao solicitante.';
			toastState.add('Pendência solicitada com sucesso.', 'success');
			await invalidateAll();
		} else {
			pendencyError = result.error.message;
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

	let statusTheme = $derived(statusThemeVars(solicitation.status, page.data.portalConfig.statuses));
	let displayScore = $derived(
		solicitation.prioritization.score === null ? '-' : String(solicitation.prioritization.score)
	);
	let priorityLabel = $derived(solicitation.prioritization.label ?? 'Prioridade a ser calculada');
	let isPriorityCalculated = $derived(solicitation.prioritization.score !== null);
	let maxScore = $derived(solicitation.prioritization.maxScore ?? 50);

	function priorityBadgeTheme(
		label: string | null,
		hasScore: boolean
	): { bg: string; color: string; border: string } {
		// Sem pontuação/label: neutro (antes: `#f3f4f6` hardcoded).
		if (!hasScore || !label) {
			return {
				bg: 'var(--status-neutral-bg)',
				color: 'var(--status-neutral)',
				border: 'var(--status-neutral)'
			};
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
				// Baixa: neutro (antes: verde).
				return {
					bg: 'var(--status-neutral-bg)',
					color: 'var(--status-neutral)',
					border: 'var(--status-neutral)'
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

<div class="solicitation-specs-page">
	{@render headerSnippet()}

	{#if pendencyError}
		<p class="pendency-feedback pendency-error" role="alert">{pendencyError}</p>
	{/if}

	<SpecTabs
		{solicitation}
		{internalNotes}
		{internalNotesError}
		{onSaveSuccess}
		{onSaveError}
		{isPendencyMode}
		{pendencyCount}
		{isPendencySaving}
		pendingSuccessText={pendingSuccess}
		{markedFieldKeys}
		onFieldPendencyClick={handleFieldPendencyClick}
		onFieldPendencyRemove={handlePendencyRemove}
		onPendencySave={handlePendencySaveRequest}
		onPendencyCancel={handlePendencyCancelRequest}
	/>

	<QuickActions
		{solicitation}
		{currentUser}
		onSaved={handlePendencySaved}
		onRequestChange={enterPendencyMode}
	/>
</div>

{#if pendingFieldPath && pendingFieldRef}
	<FieldPendencyModal
		field={pendingFieldRef}
		existing={pendingFieldEntry ? { comment: pendingFieldEntry.comment } : null}
		onConfirm={handlePendencyConfirm}
		onRemove={() => {
			if (pendingFieldPath) handlePendencyRemove(pendingFieldPath);
		}}
		onclose={() => (pendingFieldPath = null)}
	/>
{/if}

{#if showPendencyRequestModal}
	<PendencyRequestModal
		entries={pendingEntries}
		initialObservation={pendingObservation}
		initialRequestAttachment={pendingRequestAttachment}
		isSaving={isPendencySaving}
		serverError={pendencyError}
		onConfirm={handlePendencyRequestConfirm}
		onRemoveItem={handlePendencyRemove}
		onclose={() => (showPendencyRequestModal = false)}
	/>
{/if}

{#if showPendencyCancelConfirm}
	<Modal
		title="Cancelar solicitação de alteração?"
		onclose={() => (showPendencyCancelConfirm = false)}
	>
		<div class="pendency-cancel-body">
			<p>Há uma solicitação de pendência não enviada. Deseja descartá-la e cancelar?</p>
			<div class="pendency-cancel-actions">
				<Button variant="outline-neutral" onclick={() => (showPendencyCancelConfirm = false)}>
					Continuar marcando
				</Button>
				<Button variant="primary" onclick={exitPendencyMode}>Descartar e cancelar</Button>
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

	.pendency-feedback {
		margin: 0;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
	}

	.pendency-error {
		background-color: var(--status-red-bg);
		color: var(--status-red);
		border: 1px solid var(--status-red);
	}

	.pendency-cancel-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.pendency-cancel-body p {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--black);
		line-height: 1.5;
	}

	.pendency-cancel-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
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

	@media (max-width: 768px) {
		.header-row {
			flex-direction: column;
		}

		.prio-card {
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		.solicitation-title {
			font-size: 18px;
		}
	}
</style>
