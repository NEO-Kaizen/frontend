<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { OperationalData, StepFieldErrors } from '$lib/types/solicitation';
	import { CRITICALITY_OPTIONS, FREQUENCY_OPTIONS, IMPACT_OPTIONS } from '$lib/types/solicitation';

	interface Props {
		data: OperationalData;
		errors: StepFieldErrors;
		onClearError: (field: string) => void;
		onvalidate?: (validate: () => boolean) => void;
	}

	let { data, errors = $bindable(), onClearError, onvalidate }: Props = $props();

	const todayDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 10);

	function validate(): boolean {
		const e: StepFieldErrors = {};

		if (!data.currentProcessDescription.trim()) {
			e.currentProcessDescription = 'Campo obrigatório.';
		}

		if (!data.mainProcessSteps.trim()) {
			e.mainProcessSteps = 'Campo obrigatório.';
		}

		if (!data.systemsUsed.trim()) {
			e.systemsUsed = 'Campo obrigatório.';
		}

		if (!data.executionFrequency) {
			e.executionFrequency = 'Campo obrigatório.';
		}

		if (!data.volumetry.trim()) {
			e.volumetry = 'Campo obrigatório.';
		}

		if (data.peopleInvolvedCount === undefined || data.peopleInvolvedCount === null) {
			e.peopleInvolvedCount = 'Campo obrigatório.';
		} else if (!Number.isInteger(data.peopleInvolvedCount) || data.peopleInvolvedCount < 1) {
			e.peopleInvolvedCount = 'Informe um número maior que 0.';
		}

		if (!data.averageExecutionTime.trim()) {
			e.averageExecutionTime = 'Campo obrigatório.';
		}

		if (data.monthlyEffortHours === undefined || data.monthlyEffortHours === null) {
			e.monthlyEffortHours = 'Campo obrigatório.';
		} else if (!Number.isInteger(data.monthlyEffortHours) || data.monthlyEffortHours < 1) {
			e.monthlyEffortHours = 'Informe um número maior que 0.';
		}

		if (!data.hasManualControls.trim()) {
			e.hasManualControls = 'Campo obrigatório.';
		}

		if (!data.mainRisks.trim()) {
			e.mainRisks = 'Campo obrigatório.';
		}

		if (!data.customerImpact.trim()) {
			e.customerImpact = 'Campo obrigatório.';
		}

		if (!data.operationalImpact) {
			e.operationalImpact = 'Campo obrigatório.';
		}

		if (!data.desiredDeadline || data.desiredDeadline < todayDate) {
			e.desiredDeadline = 'Insira um prazo válido';
		}

		if (!data.perceivedCriticality) {
			e.perceivedCriticality = 'Campo obrigatório.';
		}

		errors = e;
		if (Object.keys(e).length > 0) {
			console.warn('[StepOperational] validação falhou', e, data);
		}
		return Object.keys(e).length === 0;
	}

	$effect(() => {
		onvalidate?.(validate);
	});
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
				bind:value={data.currentProcessDescription}
				error={errors.currentProcessDescription}
				oninput={() => onClearError('currentProcessDescription')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Principais etapas do processo"
				placeholder="Liste as principais etapas ou tópicos do processo..."
				required
				rows={4}
				bind:value={data.mainProcessSteps}
				error={errors.mainProcessSteps}
				oninput={() => onClearError('mainProcessSteps')}
			/>
		</div>

		<div class="fields-grid">
			<Input
				label="Sistemas utilizados"
				placeholder="Ex: SAP, Excel, SharePoint"
				required
				bind:value={data.systemsUsed}
				error={errors.systemsUsed}
				oninput={() => onClearError('systemsUsed')}
			/>

			<Select
				label="Frequência de execução"
				placeholder="Selecione a frequência"
				options={FREQUENCY_OPTIONS}
				required
				bind:value={data.executionFrequency}
				error={errors.executionFrequency}
				onchange={() => onClearError('executionFrequency')}
			/>

			<Input
				label="Volumetria aproximada"
				placeholder="Ex: 500 transações/mês"
				required
				bind:value={data.volumetry}
				error={errors.volumetry}
				oninput={() => onClearError('volumetry')}
			/>

			<Input
				type="number"
				label="Quantidade de pessoas envolvidas"
				placeholder="Ex: 5"
				required
				min="1"
				step="1"
				bind:value={data.peopleInvolvedCount}
				error={errors.peopleInvolvedCount}
				oninput={() => onClearError('peopleInvolvedCount')}
			/>

			<Input
				label="Tempo médio de execução"
				placeholder="Ex: 15 minutos"
				required
				bind:value={data.averageExecutionTime}
				error={errors.averageExecutionTime}
				oninput={() => onClearError('averageExecutionTime')}
			/>

			<Input
				type="number"
				label="Esforço mensal estimado (horas)"
				placeholder="Ex: 40"
				required
				min="0"
				step="0.5"
				bind:value={data.monthlyEffortHours}
				error={errors.monthlyEffortHours}
				oninput={() => onClearError('monthlyEffortHours')}
			/>
		</div>

		<div class="field-span-2">
			<Input
				label="Existência de controles manuais"
				placeholder="Descreva os controles manuais existentes..."
				required
				bind:value={data.hasManualControls}
				error={errors.hasManualControls}
				oninput={() => onClearError('hasManualControls')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Principais riscos"
				placeholder="Descreva os principais riscos do processo atual..."
				required
				rows={3}
				bind:value={data.mainRisks}
				error={errors.mainRisks}
				oninput={() => onClearError('mainRisks')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Impacto no cliente"
				placeholder="Descreva o impacto para o cliente..."
				required
				rows={3}
				bind:value={data.customerImpact}
				error={errors.customerImpact}
				oninput={() => onClearError('customerImpact')}
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
				onchange={() => onClearError('operationalImpact')}
			/>

			<Select
				label="Criticidade percebida pelo solicitante"
				placeholder="Selecione a criticidade"
				options={CRITICALITY_OPTIONS}
				required
				bind:value={data.perceivedCriticality}
				error={errors.perceivedCriticality}
				onchange={() => onClearError('perceivedCriticality')}
			/>

			<Input
				type="date"
				label="Prazo desejado"
				min={todayDate}
				required
				bind:value={data.desiredDeadline}
				error={errors.desiredDeadline}
				oninput={() => onClearError('desiredDeadline')}
			/>
		</div>
	</div>
</div>

<style>
	:global(.error-message) {
		position: absolute;
		top: 100%;
		left: 0%;
		width: 100%;
		margin: 0;
		margin-top: 4px;
	}

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
