<script lang="ts">
	import { page } from '$app/state';
	import {
		DEFAULT_PORTAL_CONFIG,
		PRIORITIZATION_CRITERIA_LABELS
	} from '$lib/config/portal-defaults';
	import { isPortalConfigLoadBlocked } from '$lib/config/portal-config-load';
	import { savePrioritizationWeights } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import {
		PRIORITIZATION_CRITERIA,
		type PrioritizationCriterion,
		type PrioritizationWeightsSection
	} from '$lib/types/portal-config';
	import {
		isValidPrioritizationWeight,
		PRIORITIZATION_WEIGHT_MIN,
		PRIORITIZATION_WEIGHT_MAX,
		PRIORITIZATION_WEIGHT_STEP
	} from '$lib/utils/validations';
	import { notifySectionSave } from '$lib/utils/feedback';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<PrioritizationWeightsSection>(
		{ prioritizationWeights: page.data.portalConfig.prioritizationWeights },
		{ prioritizationWeights: DEFAULT_PORTAL_CONFIG.prioritizationWeights },
		(draft) => savePrioritizationWeights({ prioritizationWeights: draft.prioritizationWeights })
	);

	// Leitura autoritativa falhou: o draft pode ser o fallback local — bloqueia
	// edição e salvamento até a revalidação.
	const loadFailed = $derived(isPortalConfigLoadBlocked(page.data));

	// Qualquer peso fora de 1..10 (inteiro) bloqueia o salvamento.
	const weightsError: string | null = $derived.by(() => {
		const weights = section.draft.prioritizationWeights;
		const hasInvalid = PRIORITIZATION_CRITERIA.some(
			(criterion) => !isValidPrioritizationWeight(weights[criterion])
		);
		return hasInvalid ? 'Os pesos devem ser inteiros de 1 a 10.' : null;
	});

	const invalid = $derived(weightsError !== null);

	function setWeight(criterion: PrioritizationCriterion, value: number) {
		section.draft = {
			prioritizationWeights: { ...section.draft.prioritizationWeights, [criterion]: value }
		};
	}

	async function handleSave() {
		if (loadFailed) return;
		notifySectionSave(await section.save());
	}

	function adjustWeight(criterion: PrioritizationCriterion, direction: number) {
		const current = section.draft.prioritizationWeights[criterion];
		const next = current + direction * PRIORITIZATION_WEIGHT_STEP;
		if (next < PRIORITIZATION_WEIGHT_MIN || next > PRIORITIZATION_WEIGHT_MAX) return;
		setWeight(criterion, next);
	}

	function handleSliderInput(event: Event, criterion: PrioritizationCriterion) {
		const target = event.currentTarget as HTMLInputElement;
		setWeight(criterion, Number(target.value));
	}
</script>

<SettingsCard
	iconName="calculate"
	title="7. Pesos da priorização"
	description="Defina a influência de cada critério no cálculo da prioridade."
>
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			restorable={section.restorable}
			{invalid}
			{loadFailed}
			onSave={handleSave}
			onCancel={() => section.reset()}
			onRestoreDefaults={() => section.restoreDefaults()}
		/>
	{/snippet}

	{#if weightsError}
		<p class="weights-error" role="alert">{weightsError}</p>
	{/if}

	<div class="weights-content">
		<table class="weights-table">
			<thead>
				<tr>
					<th scope="col" class="criteria-col">Critério</th>
					<th scope="col" class="weight-col">Peso (1 a 10)</th>
				</tr>
			</thead>
			<tbody>
				{#each PRIORITIZATION_CRITERIA as criterion (criterion)}
					<tr>
						<td class="criteria-cell">{PRIORITIZATION_CRITERIA_LABELS[criterion]}</td>
						<td class="weight-cell">
							<div class="weight-control">
								<div class="slider">
									<input
										class="weight-slider"
										type="range"
										min={PRIORITIZATION_WEIGHT_MIN}
										max={PRIORITIZATION_WEIGHT_MAX}
										step={PRIORITIZATION_WEIGHT_STEP}
										value={section.draft.prioritizationWeights[criterion]}
										aria-label={`Peso de ${PRIORITIZATION_CRITERIA_LABELS[criterion]}`}
										disabled={section.saving || loadFailed}
										oninput={(event) => handleSliderInput(event, criterion)}
									/>
								</div>
								<div class="stepper">
									<button
										class="stepper-button"
										type="button"
										aria-label={`Diminuir peso de ${PRIORITIZATION_CRITERIA_LABELS[criterion]}`}
										disabled={section.saving ||
											loadFailed ||
											section.draft.prioritizationWeights[criterion] <= PRIORITIZATION_WEIGHT_MIN}
										onclick={() => adjustWeight(criterion, -1)}
									>
										−
									</button>
									<span class="stepper-value">
										{section.draft.prioritizationWeights[criterion]}
									</span>
									<button
										class="stepper-button"
										type="button"
										aria-label={`Aumentar peso de ${PRIORITIZATION_CRITERIA_LABELS[criterion]}`}
										disabled={section.saving ||
											loadFailed ||
											section.draft.prioritizationWeights[criterion] >= PRIORITIZATION_WEIGHT_MAX}
										onclick={() => adjustWeight(criterion, 1)}
									>
										+
									</button>
								</div>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</SettingsCard>

<style>
	.weights-error {
		margin: 0;
		font-size: 13px;
		color: var(--status-red);
	}

	.weights-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.weights-table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}

	.weights-table th,
	.weights-table td {
		padding: 8px var(--spacing-md);
		vertical-align: middle;
	}

	.weights-table thead th {
		padding-top: 10px;
		padding-bottom: 10px;
		background-color: var(--background-color);
		text-transform: uppercase;
		font: var(--label);
		font-size: 12px;
		color: var(--gray);
		border-bottom: var(--border-default);
	}

	.criteria-col {
		width: 50%;
		text-align: left;
	}

	.weight-col {
		width: 50%;
		text-align: right;
	}

	.weights-table tbody td {
		border-bottom: var(--border-default);
	}

	.weights-table tbody tr:last-child td {
		border-bottom: none;
	}

	.criteria-cell {
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--text-color-primary);
	}

	.weight-cell {
		text-align: right;
	}

	.weight-control {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.slider {
		display: flex;
		align-items: center;
		width: 96px;
		height: 18px;
	}

	.weight-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 18px;
		margin: 0;
		padding: 0;
		background: transparent;
		cursor: pointer;
	}

	.weight-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.weight-slider::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 999px;
		background-color: var(--white-gray);
	}

	.weight-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 10px;
		margin-top: -3px;
		border-radius: 4px;
		background-color: var(--primary-color);
	}

	.weight-slider::-moz-range-track {
		height: 4px;
		border-radius: 999px;
		background-color: var(--white-gray);
	}

	.weight-slider::-moz-range-thumb {
		width: 16px;
		height: 10px;
		border: none;
		border-radius: 4px;
		background-color: var(--primary-color);
	}

	.stepper {
		display: inline-flex;
		align-items: center;
		width: 88px;
		height: 28px;
		border: var(--border-default);
		border-radius: var(--radius-sm);
		background-color: var(--white);
	}

	.stepper-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 100%;
		padding: 0;
		border: none;
		background-color: transparent;
		color: var(--gray);
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		flex-shrink: 0;
	}

	.stepper-button:hover:not(:disabled) {
		color: var(--secondary-color);
	}

	.stepper-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.stepper-value {
		flex: 1;
		text-align: center;
		font: var(--label);
		font-size: 13px;
		color: var(--text-color-primary);
	}
</style>
