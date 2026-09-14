<script lang="ts">
	import SettingsCard from './SettingsCard.svelte';

	interface Criterion {
		name: string;
		weight: number;
	}

	const criteria: Criterion[] = [
		{ name: 'Impacto Operacional', weight: 1.0 },
		{ name: 'Risco Operacional', weight: 1.0 },
		{ name: 'Urgência', weight: 1.0 },
		{ name: 'Volumetria', weight: 1.0 },
		{ name: 'Esforço Manual', weight: 1.0 },
		{ name: 'Impacto no Cliente', weight: 1.0 },
		{ name: 'Prazo Regulatório', weight: 1.0 },
		{ name: 'Áreas Impactadas', weight: 1.0 },
		{ name: 'Alinhamento Estratégico', weight: 1.0 },
		{ name: 'Complexidade Estimada', weight: 1.0 }
	];
</script>

<SettingsCard
	iconName="calculate"
	title="7. Pesos da priorização"
	description="Defina a influência de cada critério no cálculo da prioridade."
>
	<div class="weights-content">
		<table class="weights-table">
			<thead>
				<tr>
					<th scope="col" class="criteria-col">Critério</th>
					<th scope="col" class="weight-col">Peso (1,0 a 5,0)</th>
				</tr>
			</thead>
			<tbody>
				{#each criteria as criterion (criterion.name)}
					<tr>
						<td class="criteria-cell">{criterion.name}</td>
						<td class="weight-cell">
							<div class="weight-control">
								<div class="slider" aria-hidden="true">
									<div class="slider-track">
										<span class="slider-thumb"></span>
									</div>
								</div>
								<div class="stepper">
									<span class="stepper-button" aria-hidden="true">−</span>
									<span class="stepper-value">{criterion.weight.toFixed(1)}</span>
									<span class="stepper-button" aria-hidden="true">+</span>
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
		width: 70%;
		text-align: left;
	}

	.weight-col {
		width: 30%;
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
		position: relative;
		width: 64px;
		height: 18px;
	}

	.slider-track {
		width: 100%;
		height: 4px;
		border-radius: 999px;
		background-color: var(--white-gray);
	}

	.slider-thumb {
		position: absolute;
		top: 50%;
		left: 20%;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--primary-color);
		transform: translate(-50%, -50%);
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
		color: var(--gray);
		font-size: 16px;
		line-height: 1;
		user-select: none;
		flex-shrink: 0;
	}

	.stepper-value {
		flex: 1;
		text-align: center;
		font: var(--label);
		font-size: 13px;
		color: var(--rich-black);
	}
</style>
