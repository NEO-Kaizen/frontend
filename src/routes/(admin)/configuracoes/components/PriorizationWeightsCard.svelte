<script lang="ts">
	import { settingsState } from '$lib/config/settings.svelte';
	import { PRIORITIZATION_CRITERIA_LABELS } from '$lib/config/portal-defaults';
	import {
		PRIORITIZATION_WEIGHT_MIN,
		PRIORITIZATION_WEIGHT_MAX,
		PRIORITIZATION_WEIGHT_STEP
	} from '$lib/utils/validations';
	import { PRIORITIZATION_CRITERIA, type PrioritizationCriterion } from '$lib/types/portal-config';
	import SettingsCard from './SettingsCard.svelte';

	function adjustWeight(criterion: PrioritizationCriterion, direction: number) {
		const current = settingsState.draft.prioritizationWeights[criterion];
		const next = Number((current + direction * PRIORITIZATION_WEIGHT_STEP).toFixed(1));
		if (next < PRIORITIZATION_WEIGHT_MIN || next > PRIORITIZATION_WEIGHT_MAX) return;
		settingsState.setPrioritizationWeight(criterion, next);
	}

	function handleSliderInput(event: Event, criterion: PrioritizationCriterion) {
		const target = event.currentTarget as HTMLInputElement;
		settingsState.setPrioritizationWeight(criterion, Number(target.value));
	}
</script>

<SettingsCard
	iconName="calculate"
	title="7. Pesos da priorização"
	description="Defina a influência de cada critério no cálculo da prioridade."
>
	{#if settingsState.prioritizationWeightsError}
		<p class="weights-error" role="alert">{settingsState.prioritizationWeightsError}</p>
	{/if}

	<div class="weights-content">
		<table class="weights-table">
			<thead>
				<tr>
					<th scope="col" class="criteria-col">Critério</th>
					<th scope="col" class="weight-col">Peso (1,0 a 5,0)</th>
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
										value={settingsState.draft.prioritizationWeights[criterion]}
										aria-label={`Peso de ${PRIORITIZATION_CRITERIA_LABELS[criterion]}`}
										disabled={settingsState.saving}
										oninput={(event) => handleSliderInput(event, criterion)}
									/>
								</div>
								<div class="stepper">
									<button
										class="stepper-button"
										type="button"
										aria-label={`Diminuir peso de ${PRIORITIZATION_CRITERIA_LABELS[criterion]}`}
										disabled={settingsState.saving ||
											settingsState.draft.prioritizationWeights[criterion] <=
												PRIORITIZATION_WEIGHT_MIN}
										onclick={() => adjustWeight(criterion, -1)}
									>
										−
									</button>
									<span class="stepper-value">
										{settingsState.draft.prioritizationWeights[criterion].toFixed(1)}
									</span>
									<button
										class="stepper-button"
										type="button"
										aria-label={`Aumentar peso de ${PRIORITIZATION_CRITERIA_LABELS[criterion]}`}
										disabled={settingsState.saving ||
											settingsState.draft.prioritizationWeights[criterion] >=
												PRIORITIZATION_WEIGHT_MAX}
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
		color: var(--rich-black);
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
		color: var(--rich-black);
	}
</style>
