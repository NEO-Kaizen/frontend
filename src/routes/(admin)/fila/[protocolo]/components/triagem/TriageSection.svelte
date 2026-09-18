<script lang="ts">
	import { tick } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import FilterSelect from '$lib/components/FilterSelect.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import { updateTriage } from '$lib/services/triage.service';
	import {
		clearDraftFromSession,
		loadDraftFromSession,
		loadTriageFromSession,
		saveDraftToSession,
		saveTriageToSession
	} from '$lib/services/triage-draft.service';
	import { loadPrioritizationFinal } from '$lib/services/prioritization-draft.service';
	import { toastState } from '$lib/states/toast.svelte';
	import { CATEGORY_OPTIONS, YES_NO_OPTIONS } from '$lib/types/request';
	import type { InternalRequestDetail } from '$lib/types/request';
	import { TRIAGE_EXIT_OPTIONS, type TriageAssessment } from '$lib/types/triage';
	import {
		toTriageDraft,
		toTriagePayload,
		validateTriageDraft,
		validateTriageField
	} from './triage-validation';

	interface Props {
		solicitation: InternalRequestDetail;
		onTriageSuccess?: (updated: InternalRequestDetail) => void;
		onOpenCalculator?: () => void;
	}

	let { solicitation, onTriageSuccess, onOpenCalculator }: Props = $props();

	function resolveInitialDraft(): TriageAssessment {
		// SessionStorage tem prioridade: 1) rascunho não-finalizado, 2) triage finalizado persistido (1ª e N-ésima edição)
		const persistedDraft = loadDraftFromSession(solicitation.protocol);
		if (persistedDraft) return toTriageDraft(persistedDraft);
		const persistedFinal = loadTriageFromSession(solicitation.protocol);
		if (persistedFinal) return toTriageDraft(persistedFinal);
		return toTriageDraft(solicitation.triage);
	}

	let draft = $state<TriageAssessment>(resolveInitialDraft());

	// Sincroniza quando protocolo muda (navegação) — garante que cada protocolo tem seu rascunho isolado
	$effect(() => {
		const protocol = solicitation.protocol;
		const serverTriage = solicitation.triage;
		const persistedDraft = loadDraftFromSession(protocol);
		if (persistedDraft) {
			draft = toTriageDraft(persistedDraft);
			return;
		}
		const persistedFinal = loadTriageFromSession(protocol);
		if (persistedFinal) {
			draft = toTriageDraft(persistedFinal);
			return;
		}
		draft = toTriageDraft(serverTriage);
	});

	function persistDraft() {
		saveDraftToSession(solicitation.protocol, $state.snapshot(draft));
	}

	// Persistência contínua do rascunho (1ª e N-ésima edição) — sobrevive a reload/abas via sessionStorage
	$effect(() => {
		const snapshot = $state.snapshot(draft);
		const serverDraft = toTriageDraft(solicitation.triage);
		const isEqualToServer = JSON.stringify(snapshot) === JSON.stringify(serverDraft);
		if (isEqualToServer) {
			clearDraftFromSession(solicitation.protocol);
			return;
		}
		if (!isSaving) {
			saveDraftToSession(solicitation.protocol, snapshot);
		}
	});
	let errors = $state<Record<string, string>>({});
	let isSaving = $state(false);
	let showConfirm = $state(false);
	let sectionRoot = $state<HTMLElement | null>(null);

	const PRIORITY_REQUIRED_MESSAGE = 'Calcule a prioridade antes de finalizar a triagem.';

	function hasCalculatedPriority(): boolean {
		// Fonte de verdade: score no objeto da solicitação (atualizado via
		// onSave/onsave da calculadora) OU resultado final em sessionStorage
		// (sobrevive a reload quando o mock servidor reverte).
		if (
			solicitation.prioritization?.score !== null &&
			solicitation.prioritization?.score !== undefined
		) {
			return true;
		}
		try {
			const persisted = loadPrioritizationFinal(solicitation.protocol);
			return !!persisted?.result && typeof persisted.result.score === 'number';
		} catch {
			return false;
		}
	}

	function isJustificationDisabled(): boolean {
		return draft.adherentToScope !== 'Não';
	}

	function isNewCategoryDisabled(): boolean {
		return draft.changeCategory !== 'Sim';
	}

	function clearFieldError(path: string) {
		delete errors[path];
		if (path === 'adherentToScope') {
			delete errors['adherentJustification'];
			delete errors['preliminaryComplexity'];
			delete errors['perceivedRisks'];
		}
		if (path === 'changeCategory') {
			delete errors['newCategory'];
		}
	}

	function handleFieldChange(path: keyof TriageAssessment, value: string) {
		// @ts-expect-error dynamic
		draft[path] = value;
		if (path === 'adherentToScope' && value !== 'Não') {
			// Limpa valor condicional obsoleto para não enviar/persistir
			// justificativa anterior ao alternar para Sim/vazio.
			draft.adherentJustification = '';
		}
		if (path === 'changeCategory' && value !== 'Sim') {
			// Limpa categoria selecionada anteriormente ao alternar para Não/vazio.
			draft.newCategory = '';
		}
		clearFieldError(path);
		persistDraft();
	}

	function handleBlur(path: string) {
		const next = validateTriageField(draft, path);
		// remove previous errors for path keys
		for (const key of Object.keys(next)) {
			delete errors[key];
		}
		// also clear if field became valid
		const relatedKeys = Object.keys(next);
		if (relatedKeys.length === 0) {
			// ensure we remove stale error for this path if now valid
			delete errors[path];
		} else {
			Object.assign(errors, next);
		}
	}

	function focusFirstInvalid() {
		const root = sectionRoot;
		if (!root) return;
		const invalid = root.querySelector<HTMLElement>('[aria-invalid="true"]');
		if (invalid) {
			invalid.focus();
			return;
		}
		root.querySelector<HTMLElement>('[data-priority-gate]')?.focus();
	}

	function handleCancel() {
		clearDraftFromSession(solicitation.protocol);
		draft = toTriageDraft(solicitation.triage);
		errors = {};
		showConfirm = false;
	}

	function handleCalculatePriority() {
		if (errors['prioritization']) delete errors['prioritization'];
		onOpenCalculator?.();
	}

	function handleFinalizeClick() {
		const validation = validateTriageDraft(draft);
		if (!hasCalculatedPriority()) {
			validation['prioritization'] = PRIORITY_REQUIRED_MESSAGE;
		}
		errors = validation;
		if (Object.keys(validation).length > 0) {
			if (validation['prioritization'] && Object.keys(validation).length === 1) {
				toastState.add(PRIORITY_REQUIRED_MESSAGE, 'error');
			} else {
				toastState.add('Revise os campos destacados antes de finalizar.', 'error');
			}
			tick().then(() => focusFirstInvalid());
			return;
		}
		showConfirm = true;
	}

	async function handleConfirm() {
		if (isSaving) return;
		const validation = validateTriageDraft(draft);
		if (!hasCalculatedPriority()) {
			validation['prioritization'] = PRIORITY_REQUIRED_MESSAGE;
		}
		if (Object.keys(validation).length > 0) {
			errors = validation;
			showConfirm = false;
			if (validation['prioritization'] && Object.keys(validation).length === 1) {
				toastState.add(PRIORITY_REQUIRED_MESSAGE, 'error');
			} else {
				toastState.add('Revise os campos destacados antes de finalizar.', 'error');
			}
			tick().then(() => focusFirstInvalid());
			return;
		}
		isSaving = true;
		const payload = toTriagePayload(draft);
		const result = await updateTriage(solicitation.protocol, payload);
		isSaving = false;
		if (result.ok) {
			showConfirm = false;
			errors = {};
			// Persistência real via sessionStorage: salva final e limpa rascunho
			saveTriageToSession(solicitation.protocol, payload);
			clearDraftFromSession(solicitation.protocol);
			draft = toTriageDraft(result.data.triage);
			toastState.add('Triagem finalizada com sucesso.', 'success');
			onTriageSuccess?.(result.data);
		} else {
			toastState.add(result.error.message, 'error');
			showConfirm = false;
		}
	}
</script>

<section class="triage-section" bind:this={sectionRoot} aria-label="Triagem da solicitação">
	<h2 class="section-heading">AVALIAÇÃO DA TRIAGEM</h2>

	<div class="field-group">
		<!-- Linha 1: Aderente ao Escopo + Justificativa (justificativa com dobro da largura) -->
		<div class="top-row left-group">
			<div class="narrow-field">
				<FilterSelect
					label="Aderente ao Escopo?"
					options={YES_NO_OPTIONS}
					value={draft.adherentToScope}
					onchange={(v) => handleFieldChange('adherentToScope', v)}
					placeholder="Selecione"
					disabled={isSaving}
					error={errors['adherentToScope'] ?? ''}
				/>
			</div>
			<div class="wide-field">
				<Input
					label="Justificativa"
					placeholder="Informe a justificativa"
					bind:value={draft.adherentJustification}
					maxlength={1000}
					disabled={isSaving || isJustificationDisabled()}
					error={errors['adherentJustification'] ?? ''}
					oninput={() => clearFieldError('adherentJustification')}
					onblur={() => handleBlur('adherentJustification')}
				/>
			</div>
		</div>

		<!-- Linha 2: Mudar a Categoria + Categoria antiga → Nova juntos à esquerda, com gap visível -->
		<div class="top-row right-group">
			<div class="narrow-field">
				<FilterSelect
					label="Mudar a Categoria?"
					options={YES_NO_OPTIONS}
					value={draft.changeCategory}
					onchange={(v) => handleFieldChange('changeCategory', v)}
					placeholder="Selecione"
					disabled={isSaving}
					error={errors['changeCategory'] ?? ''}
				/>
			</div>
			<div class="category-group-wrapper">
				<div class="category-change-group">
					<div class="category-old" aria-label="Categoria antiga">
						<span class="field-label">Categoria Antiga</span>
						<span class="field-value">{solicitation.demand.category}</span>
					</div>
					<span class="category-arrow" aria-hidden="true">→</span>
					<div class="category-new">
						<FilterSelect
							label="Nova Categoria"
							options={CATEGORY_OPTIONS}
							value={draft.newCategory}
							onchange={(v) => handleFieldChange('newCategory', v)}
							placeholder="Selecione"
							disabled={isSaving || isNewCategoryDisabled()}
							error={errors['newCategory'] ?? ''}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="field-75">
		<Textarea
			label="Complexidade Preliminar"
			placeholder="Descreva a complexidade preliminar"
			bind:value={draft.preliminaryComplexity}
			maxlength={4000}
			rows={4}
			disabled={isSaving}
			error={errors['preliminaryComplexity'] ?? ''}
			oninput={() => clearFieldError('preliminaryComplexity')}
		/>
	</div>

	<div class="field-75">
		<Textarea
			label="Riscos Percebidos"
			placeholder="Descreva os riscos percebidos"
			bind:value={draft.perceivedRisks}
			maxlength={4000}
			rows={4}
			disabled={isSaving}
			error={errors['perceivedRisks'] ?? ''}
			oninput={() => clearFieldError('perceivedRisks')}
		/>
	</div>

	<!-- Responsável sugerido + justificativa — 75% com split interno -->
	<div class="field-75">
		<div class="split-75">
			<Input
				label="Sugerir Analista"
				placeholder="Informe o Analista"
				bind:value={draft.suggestedResponsible}
				maxlength={150}
				disabled={isSaving}
				error={errors['suggestedResponsible'] ?? ''}
				oninput={() => clearFieldError('suggestedResponsible')}
				onblur={() => handleBlur('suggestedResponsible')}
			/>
			<Input
				label="Justificativa"
				placeholder="Informe a justificativa"
				bind:value={draft.suggestedResponsibleJustification}
				maxlength={1000}
				disabled={isSaving}
				error={errors['suggestedResponsibleJustification'] ?? ''}
				oninput={() => clearFieldError('suggestedResponsibleJustification')}
				onblur={() => handleBlur('suggestedResponsibleJustification')}
			/>
		</div>
	</div>

	<h2 class="section-heading conclusion-heading">CONCLUSÃO DA ANÁLISE</h2>

	<!-- Status (estreito) + Resultado (flex) dentro de 75% -->
	<div class="field-75">
		<div class="status-result-row">
			<div class="narrow-field wide-field">
				<FilterSelect
					label="Status de Saída"
					options={TRIAGE_EXIT_OPTIONS}
					value={draft.exitStatus}
					onchange={(v) => handleFieldChange('exitStatus', v)}
					placeholder="Selecione"
					disabled={isSaving}
					error={errors['exitStatus'] ?? ''}
				/>
			</div>
			<div class="result-field">
				<Input
					label="Resultado"
					placeholder="Informe o resultado"
					bind:value={draft.result}
					maxlength={1000}
					disabled={isSaving}
					error={errors['result'] ?? ''}
					oninput={() => clearFieldError('result')}
					onblur={() => handleBlur('result')}
				/>
			</div>
		</div>
	</div>

	<div class="field-75">
		<Textarea
			label="Justificativa"
			placeholder="Informe a justificativa da conclusão"
			bind:value={draft.conclusionJustification}
			maxlength={4000}
			rows={5}
			disabled={isSaving}
			error={errors['conclusionJustification'] ?? ''}
			oninput={() => clearFieldError('conclusionJustification')}
		/>
	</div>

	{#if errors['prioritization']}
		<p class="priority-gate-error" role="alert" tabindex="-1" data-priority-gate>
			{errors['prioritization']}
			<button type="button" class="priority-gate-link" onclick={handleCalculatePriority}>
				Abrir calculadora
			</button>
		</p>
	{/if}

	<div class="footer-actions">
		<Button variant="outline-neutral" disabled={isSaving} onclick={handleCancel}>Cancelar</Button>
		<Button variant="secondary" disabled={isSaving} onclick={handleCalculatePriority}>
			<Icon iconName="calculate" iconSize="sm" />
			Calcular Prioridade
		</Button>
		<Button variant="primary" disabled={isSaving} loading={isSaving} onclick={handleFinalizeClick}>
			<Icon iconName="check" iconSize="sm" />
			Finalizar Triagem
		</Button>
	</div>
</section>

{#if showConfirm}
	<Modal title="Confirmar triagem?" onclose={() => (showConfirm = false)}>
		<div class="confirm-body">
			<p>Deseja finalizar a triagem? Esta ação atualizará o status e a categoria da solicitação.</p>
			<div class="confirm-actions">
				<Button variant="outline-neutral" disabled={isSaving} onclick={() => (showConfirm = false)}
					>Cancelar</Button
				>
				<Button variant="primary" disabled={isSaving} loading={isSaving} onclick={handleConfirm}
					>Confirmar</Button
				>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.field-group {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
		/* gap: var(--spacing-lg); 	 */
		max-width: 75%;
	}

	.top-row {
		display: flex;
		gap: var(--spacing-sm);
	}

	.left-group {
		flex-direction: column;
	}

	.triage-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		align-items: flex-start;
	}

	.section-heading {
		margin: 0;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--white-gray);
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--black);
		text-transform: uppercase;
		width: 100%;
	}

	.conclusion-heading {
		margin-top: var(--spacing-md);
	}

	.narrow-field {
		flex: 0 0 auto;
		width: 200px;
		max-width: 220px;
		min-width: 160px;
		padding-bottom: var(--spacing-md);
	}

	.wide-field {
		width: 400px;
		max-width: 400px;
		min-width: 280px;
		padding-bottom: var(--spacing-md);
	}

	.category-group-wrapper {
		flex: 1 1 auto;
		min-width: 280px;
		max-width: 420px;
		display: flex;
		align-items: flex-start;
	}

	/* Todo textfield/Input que ocupa 75% à esquerda */
	.field-75 {
		width: 75%;
		max-width: 75%;
		padding-bottom: var(--spacing-md);
	}

	.split-75 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md);
		align-items: start;
	}

	.status-result-row {
		display: flex;
		gap: var(--spacing-md);
		align-items: flex-start;
	}

	.result-field {
		flex: 1;
		min-width: 0;
	}

	.category-change-group {
		display: flex;
		align-items: flex-end;
		gap: 12px;
		flex-wrap: nowrap;
		width: 100%;
	}

	.category-old {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		min-width: 0;
		flex: 0 0 auto;
	}

	.field-label {
		font: var(--label);
		color: var(--black);
	}

	.field-value {
		display: inline-flex;
		align-items: center;
		padding: var(--spacing-sm);
		min-height: 42px;
		box-sizing: border-box;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white-gray);
		color: var(--rich-black);
		font: var(--paragrafo);
		white-space: nowrap;
	}

	.category-arrow {
		padding-bottom: 12px;
		color: var(--gray);
		font-size: 16px;
		flex: 0 0 auto;
	}

	.category-new {
		flex: 1;
		min-width: 0;
		min-width: 160px;
		max-width: 260px;
	}

	.footer-actions {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		margin-top: var(--spacing-sm);
		width: 75%;
		justify-content: flex-start;
	}

	.priority-gate-error {
		margin: 0;
		width: 75%;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--status-red-bg);
		color: var(--status-red);
		font: var(--label);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.priority-gate-error:focus {
		outline: 2px solid var(--status-red);
		outline-offset: 2px;
	}

	.priority-gate-link {
		border: none;
		background: none;
		padding: 0;
		color: inherit;
		font: inherit;
		font-weight: 700;
		text-decoration: underline;
		cursor: pointer;
	}

	.confirm-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.confirm-body p {
		margin: 0;
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--black);
		line-height: 1.5;
	}

	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	@media (max-width: 1024px) {
		.top-row,
		.field-75,
		.footer-actions {
			width: 85%;
			max-width: 85%;
		}
	}

	@media (max-width: 768px) {
		.top-row,
		.field-75,
		.footer-actions {
			width: 100%;
			max-width: 100%;
		}

		.narrow-field,
		.wide-field {
			width: 100%;
			max-width: none;
			flex: 1 1 100%;
		}

		.category-group-wrapper {
			max-width: none;
			width: 100%;
		}

		.split-75 {
			grid-template-columns: 1fr;
		}

		.status-result-row {
			flex-direction: column;
		}

		.category-change-group {
			flex-direction: column;
			align-items: stretch;
		}

		.category-arrow {
			display: none;
		}

		.category-new {
			max-width: none;
		}
	}
</style>
