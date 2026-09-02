<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { OperationalData, StepFieldErrors } from '$lib/types/request';
	import {
		CRITICALITY_OPTIONS,
		FREQUENCY_OPTIONS,
		IMPACT_OPTIONS,
		YES_NO_OPTIONS
	} from '$lib/types/request';
	import { isFutureOrToday, isRequired, parseNumber } from '$lib/utils/validations';

	interface Props {
		data: OperationalData;
	}

	let { data = $bindable() }: Props = $props();

	let errors = $state<StepFieldErrors>({});

	const todayDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 10);

	export function validate(): boolean {
		const e: StepFieldErrors = {};

		if (!isRequired(data.processDescription)) {
			e.processDescription = 'Campo obrigatório.';
		}

		if (!isRequired(data.processSteps)) {
			e.processSteps = 'Campo obrigatório.';
		}

		if (!isRequired(data.systemsUsed)) {
			e.systemsUsed = 'Campo obrigatório.';
		}

		if (!data.executionFrequency) {
			e.executionFrequency = 'Campo obrigatório.';
		}

		if (!isRequired(data.volumetry)) {
			e.volumetry = 'Campo obrigatório.';
		}

		const peopleInvolved = parseNumber(data.peopleInvolved);
		if (peopleInvolved === null) {
			e.peopleInvolved = 'Campo obrigatório.';
		} else if (!Number.isInteger(peopleInvolved) || peopleInvolved < 1) {
			e.peopleInvolved = 'Informe um número inteiro maior que 0.';
		}

		if (!isRequired(data.averageExecutionTime)) {
			e.averageExecutionTime = 'Campo obrigatório.';
		}

		const monthlyEffortHours = parseNumber(data.monthlyEffortHours);
		if (monthlyEffortHours === null) {
			e.monthlyEffortHours = 'Campo obrigatório.';
		} else if (monthlyEffortHours < 0) {
			e.monthlyEffortHours = 'Informe um número maior ou igual a 0.';
		}

		if (!data.hasManualControls) {
			e.hasManualControls = 'Campo obrigatório.';
		} else if (data.hasManualControls === 'Sim' && !isRequired(data.hasManualControlsDetail)) {
			e.hasManualControlsDetail = 'Descreva os controles manuais existentes.';
		}

		if (!isRequired(data.mainRisks)) {
			e.mainRisks = 'Campo obrigatório.';
		}

		if (!isRequired(data.clientImpact)) {
			e.clientImpact = 'Campo obrigatório.';
		}

		if (!data.operationalImpact) {
			e.operationalImpact = 'Campo obrigatório.';
		}

		if (!isRequired(data.desiredDeadline) || !isFutureOrToday(data.desiredDeadline, todayDate)) {
			e.desiredDeadline = 'Insira um prazo válido';
		}

		if (!data.perceivedCriticality) {
			e.perceivedCriticality = 'Campo obrigatório.';
		}

		errors = e;
		return Object.keys(e).length === 0;
	}

	export function clearErrors(): void {
		errors = {};
	}

	function clearError(field: string): void {
		errors[field] = undefined;
	}
</script>

<div class="step-content">
	<div class="step-header">
		<span class="step-icon" aria-hidden="true">
			<Icon iconName="settings" iconSize="lg" />
		</span>
		<h3>Informações Operacionais</h3>
	</div>

	<div class="fields-column">
		<div class="field-span-2">
			<Textarea
				label="Descrição resumida do processo atual"
				placeholder="Descreva brevemente como o processo funciona hoje..."
				required
				rows={4}
				maxlength={4000}
				bind:value={data.processDescription}
				error={errors.processDescription}
				oninput={() => clearError('processDescription')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Principais etapas do processo"
				placeholder="Liste as principais etapas ou tópicos do processo..."
				required
				rows={4}
				maxlength={4000}
				bind:value={data.processSteps}
				error={errors.processSteps}
				oninput={() => clearError('processSteps')}
			/>
		</div>

		<div class="fields-grid">
			<Input
				label="Sistemas utilizados"
				placeholder="Ex: SAP, Excel, SharePoint"
				required
				maxlength={255}
				bind:value={data.systemsUsed}
				error={errors.systemsUsed}
				oninput={() => clearError('systemsUsed')}
			/>

			<Select
				label="Frequência de execução"
				placeholder="Selecione a frequência"
				options={FREQUENCY_OPTIONS}
				required
				bind:value={data.executionFrequency}
				error={errors.executionFrequency}
				onchange={() => clearError('executionFrequency')}
			/>

			<Input
				label="Volumetria aproximada"
				placeholder="Ex: 500 transações/mês"
				required
				maxlength={100}
				bind:value={data.volumetry}
				error={errors.volumetry}
				oninput={() => clearError('volumetry')}
			/>

			<Input
				type="number"
				label="Quantidade de pessoas envolvidas"
				placeholder="Ex: 5"
				required
				min="1"
				step="1"
				bind:value={data.peopleInvolved}
				error={errors.peopleInvolved}
				oninput={() => clearError('peopleInvolved')}
			/>

			<Input
				label="Tempo médio de execução"
				placeholder="Ex: 15 minutos"
				required
				maxlength={60}
				bind:value={data.averageExecutionTime}
				error={errors.averageExecutionTime}
				oninput={() => clearError('averageExecutionTime')}
			/>

			<Input
				type="number"
				label="Esforço mensal estimado (horas)"
				placeholder="Ex: 40"
				required
				min="0"
				step="0.1"
				bind:value={data.monthlyEffortHours}
				error={errors.monthlyEffortHours}
				oninput={() => clearError('monthlyEffortHours')}
			/>

			<Select
				label="Existência de controles manuais"
				placeholder="Selecione"
				options={YES_NO_OPTIONS}
				required
				bind:value={data.hasManualControls}
				error={errors.hasManualControls}
				onchange={() => clearError('hasManualControls')}
			/>

			<Input
				label="Detalhamento dos controles manuais"
				placeholder="Descreva os controles manuais existentes..."
				maxlength={1000}
				disabled={data.hasManualControls !== 'Sim'}
				bind:value={data.hasManualControlsDetail}
				error={errors.hasManualControlsDetail}
				oninput={() => clearError('hasManualControlsDetail')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Principais riscos"
				placeholder="Descreva os principais riscos do processo atual..."
				required
				rows={3}
				maxlength={2000}
				bind:value={data.mainRisks}
				error={errors.mainRisks}
				oninput={() => clearError('mainRisks')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Impacto no cliente"
				placeholder="Descreva o impacto para o cliente..."
				required
				rows={3}
				maxlength={2000}
				bind:value={data.clientImpact}
				error={errors.clientImpact}
				oninput={() => clearError('clientImpact')}
			/>
		</div>

		<div class="fields-grid">
			<Select
				label="Impacto operacional"
				placeholder="Selecione o impacto"
				options={IMPACT_OPTIONS}
				required
				bind:value={data.operationalImpact}
				error={errors.operationalImpact}
				onchange={() => clearError('operationalImpact')}
			/>

			<Select
				label="Criticidade percebida pelo solicitante"
				placeholder="Selecione a criticidade"
				options={CRITICALITY_OPTIONS}
				required
				bind:value={data.perceivedCriticality}
				error={errors.perceivedCriticality}
				onchange={() => clearError('perceivedCriticality')}
			/>

			<Input
				type="date"
				label="Prazo desejado"
				min={todayDate}
				required
				bind:value={data.desiredDeadline}
				error={errors.desiredDeadline}
				oninput={() => clearError('desiredDeadline')}
			/>
		</div>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.step-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-sm);
		background-color: var(--status-blue-bg);
		color: var(--secondary-color);
	}

	.step-header h3 {
		font: var(--h3);
		color: var(--primary-color);
	}

	.fields-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-xl);
	}

	.fields-column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.field-span-2 {
		grid-column: span 2;
	}

	@media (max-width: 768px) {
		.fields-grid {
			grid-template-columns: 1fr;
		}

		.field-span-2 {
			grid-column: span 1;
		}
	}
</style>
