<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import {
		loadPrioritizationCriteria,
		submitPrioritization
	} from '$lib/services/prioritization.service';
	import { toastState } from '$lib/states/toast.svelte';
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
		onsave?: (result: PrioritizationResult, notes: CriterionNotes) => void;
		// Quando fornecido, exibe o botão X e delega o controle de
		// visibilidade ao pai (padrão Modal/CreateUserModal: {#if} + onclose).
		onclose?: () => void;
	}

	let { protocol, initialNotes = {}, embedded = false, onsave, onclose }: Props = $props();

	const notesOptions: readonly CriterionNote[] = [1, 2, 3, 4, 5];

	let criteria = $state<PrioritizationCriterion[]>([]);
	let notes = $state<CriterionNotes>({});
	let isLoading = $state(true);
	let loadError = $state('');
	let isSaving = $state(false);
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
		missingCriterionIds = [];
		result = null;

		const loaded = await loadPrioritizationCriteria();

		if (loaded.ok) {
			criteria = loaded.data;
			// Snapshot do valor inicial da prop: apenas na montagem. A reavaliação
			// carrega as notas já salvas (vindas do /requests/:protocol/internal).
			notes = { ...initialNotes };
		} else {
			loadError = loaded.error.message;
		}

		isLoading = false;
	}

	onMount(loadCriteria);

	function resetCalculatorState(): void {
		notes = {};
		result = null;
		justification = '';
		missingCriterionIds = [];
		loadError = '';
		isSaving = false;
		isLoading = false;
	}

	function handleClose(): void {
		resetCalculatorState();
		onclose?.();
	}

	function handleNoteChange(criterionId: string) {
		// Um salvamento anterior perde validade quando uma nota é alterada.
		result = null;

		// Remove o critério do conjunto de faltantes/erro de validação.
		if (missingCriterionIds.length > 0) {
			missingCriterionIds = missingCriterionIds.filter((id) => id !== criterionId);
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (isSaving) return;

		missingCriterionIds = [];

		isSaving = true;

		try {
			const submission = await submitPrioritization(protocol, criteria, notes, justification);

			if (submission.ok) {
				result = submission.data;
				// A justificativa é a nota de auditoria desta avaliação — recomeça
				// vazia na próxima (o backend só devolve as notas, não o texto).
				justification = '';
				onsave?.(submission.data, notes);
				toastState.add(`Prioridade salva: ${result.score}/${result.maxScore} — ${result.level}`, 'success');
			} else if (submission.error.missingCriterionIds?.length) {
				missingCriterionIds = submission.error.missingCriterionIds;
				toastState.add(submission.error.message, 'error');
			} else {
				toastState.add(submission.error.message, 'error');
			}
		} finally {
			isSaving = false;
		}
	}
</script>

<section class="prioritization-calculator" class:embedded aria-labelledby="prioritization-title">
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
			<div class="criteria-list">
				{#each criteria as criterion (criterion.id)}
					<fieldset
						class="criterion"
						class:has-error={criterionErrors.has(criterion.id)}
					>
						<legend class="criterion-legend">
							<span class="criterion-name">{criterion.name}</span>
						</legend>

						<div class="notes-group">
							{#each notesOptions as note (note)}
								<label class="note-option" class:selected={notes[criterion.id] === note}>
									<input
										type="radio"
										name="criterion-{criterion.id}"
										value={note}
										bind:group={notes[criterion.id]}
										onchange={() => handleNoteChange(criterion.id)}
										disabled={isSaving}
										aria-describedby={criterionErrors.has(criterion.id)
											? `criterion-error-${criterion.id}`
											: undefined}
									/>
									<span aria-hidden="true">{note}</span>
									<span class="sr-only">Nota {note} para {criterion.name}</span>
								</label>
							{/each}
						</div>

						{#if criterionErrors.has(criterion.id)}
							<p id={`criterion-error-${criterion.id}`} class="criterion-error">
								<Icon iconName="warning" iconSize="sm" />
								Selecione uma nota de 1 a 5 para {criterion.name}.
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
		border-bottom: 1px solid var(--border-color);
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

	.criterion-error {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin: var(--spacing-sm) 0 0;
		color: var(--status-red);
		font-size: 13px;
		font-weight: 600;
		line-height: 1.4;
		overflow-wrap: anywhere;
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
		color: var(--on-primary);
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
</style>
