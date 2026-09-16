<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import {
		loadPrioritizationCriteria,
		submitPrioritization
	} from '$lib/services/prioritization.service';
	import {
		clearPrioritizationDraft,
		loadPrioritizationDraft,
		loadPrioritizationFinal,
		savePrioritizationDraft,
		savePrioritizationFinal
	} from '$lib/services/prioritization-draft.service';
	import {
		MAX_NOTE,
		type CriterionNote,
		type CriterionNotes,
		type PrioritizationCriterion,
		type PrioritizationResult
	} from '$lib/types/prioritization';

	interface Props {
		protocol: string;
		// Notas já existentes da última avaliação (reavaliação); vêm do
		// /requests/:protocol/internal via prop do componente pai.
		initialNotes?: CriterionNotes;
		// Renderização sem cartão próprio (ex.: dentro de aba ou modal).
		embedded?: boolean;
		// Modo flutuante: remove chrome do cartão (borda/sombra/margin) e
		// esconde o header interno — o shell flutuante fornece seu próprio header
		// arrastável com minimizar/fechar.
		floating?: boolean;
		onsave?: (result: PrioritizationResult, notes: CriterionNotes) => void;
		// Quando fornecido, exibe o botão X e delega o controle de
		// visibilidade ao pai (padrão Modal/CreateUserModal: {#if} + onclose).
		// Em modo flutuante o X não reseta o que foi preenchido.
		onclose?: () => void;
	}

	let {
		protocol,
		initialNotes = {},
		embedded = false,
		floating = false,
		onsave,
		onclose
	}: Props = $props();

	const notesOptions: readonly CriterionNote[] = [1, 2, 3, 4, 5];

	let criteria = $state<PrioritizationCriterion[]>([]);
	let notes = $state<CriterionNotes>({});
	let isLoading = $state(true);
	let loadError = $state('');
	let isSaving = $state(false);
	let saveError = $state('');
	let validationError = $state('');
	let missingCriterionIds = $state<string[]>([]);
	let result = $state<PrioritizationResult | null>(null);
	let justification = $state('');

	const filledCount = $derived(
		criteria.filter((criterion) => notes[criterion.id] !== undefined).length
	);
	const maxScore = $derived(criteria.length * MAX_NOTE);
	const criterionErrors = $derived(new Set(missingCriterionIds));
	const hasSavedNotes = $derived(Object.keys(notes).length > 0);

	async function loadCriteria() {
		isLoading = true;
		loadError = '';

		const loaded = await loadPrioritizationCriteria();

		if (loaded.ok) {
			criteria = loaded.data;
			// SessionStorage tem prioridade: 1) draft não-salvo, 2) final persistido, 3) initialNotes do servidor
			// Inclui result para que score persista ao reabrir (correção: score sumia ao sair)
			const draft = loadPrioritizationDraft(protocol);
			if (draft) {
				notes = { ...draft.notes };
				justification = draft.justification;
				result = draft.result ?? null;
			} else {
				const final = loadPrioritizationFinal(protocol);
				if (final) {
					notes = { ...final.notes };
					justification = final.justification;
					result = final.result ?? null;
				} else {
					notes = { ...initialNotes };
					// Se há notas iniciais vindas do servidor (reavaliação), tenta restaurar score via sessionStorage de header?
					// O score inicial da reavaliação será carregado via final se já calculado anteriormente.
				}
			}
		} else {
			loadError = loaded.error.message;
		}

		isLoading = false;
	}

	onMount(loadCriteria);

	// Persistência contínua do rascunho — sobrevive a fechar/minimizar/reload via sessionStorage
	// Inclui result para que score persista ao reabrir sem recalcular
	$effect(() => {
		// Lê snapshot para reagir a qualquer mudança em notes, justification ou result
		const snapshotNotes = $state.snapshot(notes) as CriterionNotes;
		const snapshotJust = justification;
		const snapshotResult = $state.snapshot(result) as PrioritizationResult | null;
		if (isLoading) return;
		// Não persiste durante salvamento para evitar corrida (handleSubmit gerencia final)
		if (isSaving) return;
		const hasContent =
			Object.keys(snapshotNotes).length > 0 ||
			snapshotJust.trim().length > 0 ||
			snapshotResult !== null;
		if (!hasContent) {
			clearPrioritizationDraft(protocol);
			return;
		}
		savePrioritizationDraft(protocol, {
			notes: snapshotNotes,
			justification: snapshotJust,
			result: snapshotResult
		});
	});

	// Mantido para reset explícito futuro se produto exigir; atualmente não usado no close flutuante (R5)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function resetCalculatorState(): void {
		notes = {};
		result = null;
		justification = '';
		validationError = '';
		missingCriterionIds = [];
		saveError = '';
		loadError = '';
		isSaving = false;
		isLoading = false;
	}

	function handleClose(): void {
		// Em modo flutuante o X não reseta o que foi preenchido — mantém
		// notas/justificativa/resultado para reabertura sem perda (R5).
		onclose?.();
	}

	function handleNoteChange(criterionId: string) {
		// Um salvamento anterior perde validade quando uma nota é alterada.
		result = null;

		// Remove o critério do conjunto de faltantes/erro de validação.
		if (missingCriterionIds.length > 0) {
			missingCriterionIds = missingCriterionIds.filter((id) => id !== criterionId);
			if (missingCriterionIds.length === 0) {
				validationError = '';
			}
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (isSaving) return;

		validationError = '';
		missingCriterionIds = [];
		saveError = '';

		isSaving = true;

		try {
			const submission = await submitPrioritization(protocol, criteria, notes, justification);

			if (submission.ok) {
				result = submission.data;
				// A justificativa é a nota de auditoria desta avaliação — recomeça
				// vazia na próxima (o backend só devolve as notas, não o texto).
				justification = '';
				// Persiste final (com result) e limpa rascunho — sobrevive a reload e reabertura sem recalcular
				clearPrioritizationDraft(protocol);
				savePrioritizationFinal(protocol, {
					notes: { ...(notes as CriterionNotes) },
					justification: '',
					result: submission.data
				});
				onsave?.(submission.data, notes as CriterionNotes);
			} else if (submission.error.missingCriterionIds?.length) {
				missingCriterionIds = submission.error.missingCriterionIds;
				validationError = submission.error.message;
			} else {
				saveError = submission.error.message;
			}
		} finally {
			isSaving = false;
		}
	}
</script>

<section
	class="prioritization-calculator"
	class:embedded
	class:floating
	aria-labelledby="prioritization-title"
>
	{#if !floating}
		<div class="header-fixed">
			<h2 id="prioritization-title" class="title">
				<span class="title-text">
					<Icon iconName="calculate" iconSize="sm" />
					Cálculo de Priorização
				</span>
			</h2>
			{#if onclose}
				<button
					type="button"
					class="calculator-close"
					onclick={handleClose}
					aria-label="Fechar calculadora de priorização"
					disabled={isSaving}
				>
					<Icon iconName="close" iconSize="md" />
				</button>
			{/if}
		</div>
	{/if}
	{#if floating}
		<!-- Título oculto para aria-labelledby quando o shell fornece header visível -->
		<h2 id="prioritization-title" class="sr-only">Cálculo de Priorização</h2>
	{/if}

	{#if isLoading}
		<div class="state-message" role="status">Carregando critérios...</div>
	{:else if loadError}
		<div class="state-message error" role="alert">
			<p>{loadError}</p>
			<Button variant="outline" onclick={loadCriteria}>Tentar novamente</Button>
		</div>
	{:else if criteria.length === 0}
		<div class="state-message">Nenhum critério de priorização disponível.</div>
	{:else}
		{#if hasSavedNotes && result === null && filledCount > 0}
			<p class="revaluation-hint">
				Notas existentes carregadas para reavaliação. Ajuste os valores e salve novamente.
			</p>
		{/if}

		<form onsubmit={handleSubmit} novalidate>
			{#if validationError}
				<p class="form-error" role="alert">{validationError}</p>
			{/if}
			{#if saveError}
				<p class="form-error" role="alert">{saveError}</p>
			{/if}

			<div class="criteria-list">
				{#each criteria as criterion (criterion.id)}
					<fieldset class="criterion" class:has-error={criterionErrors.has(criterion.id)}>
						<legend class="criterion-legend">
							<span class="criterion-name">{criterion.name}</span>
						</legend>

						<div
							class="notes-group"
							role="radiogroup"
							aria-label="Nota para {criterion.name}"
							aria-invalid={criterionErrors.has(criterion.id) ? true : undefined}
							aria-describedby={criterionErrors.has(criterion.id)
								? `criterion-error-${criterion.id}`
								: undefined}
						>
							{#each notesOptions as note (note)}
								<label class="note-option" class:selected={notes[criterion.id] === note}>
									<input
										type="radio"
										name="criterion-{criterion.id}"
										value={note}
										bind:group={notes[criterion.id]}
										onchange={() => handleNoteChange(criterion.id)}
										disabled={isSaving}
									/>
									<span aria-hidden="true">{note}</span>
									<span class="sr-only">Nota {note}</span>
								</label>
							{/each}
						</div>

						{#if criterionErrors.has(criterion.id)}
							<p id={`criterion-error-${criterion.id}`} class="sr-only" role="alert">
								Critério obrigatório: selecione uma nota de 1 a 5.
							</p>
						{/if}
					</fieldset>
				{/each}
			</div>

			<div class="justification-field">
				<Textarea
					label="Justificativa (opcional)"
					placeholder="Registrada no histórico da avaliação"
					rows={3}
					maxlength={500}
					disabled={isSaving}
					bind:value={justification}
				/>
			</div>

			<div class="footer">
				<div class="score-summary" aria-live="polite">
					<span class="score-total">
						SCORE TOTAL <strong>{result ? result.score : '—'}</strong>
						<span class="score-max">/ {result?.maxScore ?? maxScore}</span>
					</span>
					<span class="score-level">
						Prioridade: <strong>{result ? result.level : '—'}</strong>
					</span>
				</div>

				<Button type="submit" loading={isSaving}>
					<Icon iconName="check" iconSize="sm" />
					{isSaving ? 'Salvando...' : result ? 'Reavaliar e salvar' : 'Salvar notas'}
				</Button>
			</div>
		</form>
	{/if}
</section>

<style>
	.prioritization-calculator {
		position: relative;
		width: 460px; /* largura fixa — o cartão não muda de tamanho entre estados */
		max-width: 100%;
		background: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
		padding: var(--spacing-lg);
		margin-top: var(--spacing-lg);
	}

	.prioritization-calculator.floating {
		width: 100%;
		max-width: none;
		margin-top: 0;
		border: none;
		border-radius: 0;
		box-shadow: none;
		padding: 0;
		background: transparent;
	}

	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin: 0 0 10px;
		color: var(--primary-color);
		font-family: var(--font-montserrat);
		font-size: 18px;
		font-weight: 700;
	}

	.title-text {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	/* Header fixo em relação à calculadora: acompanha a rolagem da aba/modal. */
	.header-fixed {
		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--spacing-md);
		background: var(--white);
		border-bottom: 1px solid rgb(220, 220, 220);
		margin-bottom: 20px;
	}

	/* Botão X no canto superior direito — mesmo padrão visual do Modal. */
	.calculator-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		padding: var(--spacing-sm);
		border: none;
		background: none;
		color: var(--gray);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.calculator-close:hover:not(:disabled) {
		color: var(--primary-color);
	}

	.calculator-close:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.calculator-close:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.state-message {
		padding: var(--spacing-md);
		border-radius: var(--radius-sm);
		background: var(--status-blue-bg);
		color: var(--black);
		font: var(--paragrafo);
		text-align: center;
	}

	.state-message.error {
		background: var(--status-red-bg);
		color: var(--status-red);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
	}

	.state-message.error p {
		margin: 0;
	}

	.revaluation-hint {
		margin: 0 0 var(--spacing-md);
		font-size: 13px;
		overflow-wrap: anywhere; /* não deixa o texto alargar o cartão */
		color: var(--gray);
	}

	.form-error {
		margin: 0 0 var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		overflow-wrap: anywhere; /* não deixa a frase alargar o cartão (largura segue a dos critérios) */
		background: var(--status-red-bg);
		color: var(--status-red);
		border-radius: var(--radius-sm);
		font: var(--label);
	}

	.criteria-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.criterion {
		margin: 0;
		padding: var(--spacing-md);
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
	}

	.criterion.has-error {
		border-color: var(--status-red);
	}

	.criterion-legend {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0 var(--spacing-sm);
	}

	.criterion-name {
		font-family: var(--font-montserrat);
		font-size: 15px;
		font-weight: 700;
		color: var(--black);
	}

	.notes-group {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		margin-top: var(--spacing-sm);
	}

	.note-option {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		height: 44px;
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		background: var(--white);
		color: var(--black);
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition-default);
		user-select: none;
	}

	.note-option:hover:not(:has(input:disabled)) {
		border-color: var(--primary-color);
	}

	.note-option:has(input:focus-visible) {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.note-option.selected {
		background: var(--primary-color);
		border-color: var(--primary-color);
		color: var(--white);
	}

	.note-option:has(input:disabled) {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.note-option input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		pointer-events: none;
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--spacing-md);
		margin-top: var(--spacing-lg);
	}

	.justification-field {
		margin-top: var(--spacing-lg);
	}

	.score-summary {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		flex-direction: column;
	}

	.score-total {
		font-size: 14px;
		font-weight: 700;
		color: var(--primary-color);
		letter-spacing: 0.03em;
	}

	.score-total strong {
		font-size: 28px;
		font-weight: 800;
	}

	.score-max {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray);
	}

	.score-level {
		font-size: 15px;
		font-weight: 600;
		color: var(--gray);
	}

	.score-level strong {
		color: var(--secondary-color);
		font-weight: 800;
	}

	@media (max-width: 640px) {
		.title,
		.footer {
			flex-direction: column;
			align-items: flex-start;
		}

		.footer {
			width: 100%;
		}

		.footer :global(button) {
			width: 100%;
		}
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
</style>
