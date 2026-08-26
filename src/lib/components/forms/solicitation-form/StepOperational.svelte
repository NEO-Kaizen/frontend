<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { OperationalData } from '$lib/types/solicitation';
	import type { StepFieldErrors } from '$lib/types/solicitation';

	interface Props {
		data: OperationalData;
		errors: StepFieldErrors;
		onClearError: (field: string) => void;
	}

	let { data, errors, onClearError }: Props = $props();

	const impactOptions = [
		{ value: 'Baixo', label: 'Baixo' },
		{ value: 'Médio', label: 'Médio' },
		{ value: 'Alto', label: 'Alto' }
	];

	function addScheduleSlot() {
		if (data.preferredSchedule.length < 3) {
			data.preferredSchedule = [...data.preferredSchedule, ''];
		}
	}

	function removeScheduleSlot(index: number) {
		data.preferredSchedule = data.preferredSchedule.filter((_, i) => i !== index);
	}
</script>

<div class="step-content">
	<div class="step-header">
		<span class="step-icon" aria-hidden="true">
			<Icon iconName="settings" iconSize="lg" />
		</span>
		<h3>Informações Operacionais e Complementares</h3>
	</div>

	<div class="fields-grid">
		<Input
			label="Volumetria aproximada"
			placeholder="Ex: 500 transações/mês"
			required
			bind:value={data.volume}
			error={errors.volume}
			oninput={() => onClearError('volume')}
		/>

		<Input
			label="Tempo médio de execução"
			placeholder="Ex: 15 minutos"
			required
			bind:value={data.executionTime}
			error={errors.executionTime}
			oninput={() => onClearError('executionTime')}
		/>

		<Input
			type="date"
			label="Prazo desejado"
			required
			bind:value={data.desiredDeadline}
			error={errors.desiredDeadline}
			oninput={() => onClearError('desiredDeadline')}
		/>

		<Select
			label="Impacto operacional"
			placeholder="Selecione o impacto"
			options={impactOptions}
			required
			bind:value={data.operationalImpact}
			error={errors.operationalImpact}
			onchange={() => onClearError('operationalImpact')}
		/>
	</div>

	<div class="schedule-section">
		<div class="schedule-header">
			<span class="schedule-label">Preferência de horários</span>
			{#if data.preferredSchedule.length < 3}
				<button
					type="button"
					class="add-schedule-button"
					onclick={addScheduleSlot}
					aria-label="Adicionar horário"
				>
					<Icon iconName="addCircle" iconSize="sm" />
					<span>Adicionar</span>
				</button>
			{/if}
		</div>

		<div class="schedule-slots">
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each data.preferredSchedule as _, index (index)}
				<div class="schedule-slot">
					<Input
						type="date"
						placeholder="dd/mm/aaaa"
						bind:value={data.preferredSchedule[index]}
						oninput={() => onClearError(`schedule_${index}`)}
					/>
					<button
						type="button"
						class="remove-schedule-button"
						onclick={() => removeScheduleSlot(index)}
						aria-label="Remover horário"
					>
						<Icon iconName="delete" iconSize="sm" />
					</button>
				</div>
			{/each}
		</div>
	</div>

	<div class="upload-section">
		<span class="section-label">Anexos</span>
		<FileUpload bind:files={data.files} onchange={() => onClearError('files')} />
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
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
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-lg);
	}

	.schedule-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.schedule-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.schedule-label {
		font: var(--label);
		color: var(--black);
	}

	.add-schedule-button {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: none;
		border: none;
		color: var(--secondary-color);
		cursor: pointer;
		font: var(--label);
		padding: 4px var(--spacing-sm);
		border-radius: var(--radius-sm);
		transition: var(--transition-default);
	}

	.add-schedule-button:hover {
		background-color: var(--status-blue-bg);
	}

	.add-schedule-button:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.schedule-slots {
		display: flex;
		gap: var(--spacing-md);
	}

	.schedule-slot {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		flex: 1;
	}

	.remove-schedule-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm);
		border: none;
		background: none;
		color: var(--gray);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: var(--transition-default);
		margin-top: 28px;
	}

	.remove-schedule-button:hover {
		color: var(--status-red);
		background-color: var(--status-red-bg);
	}

	.upload-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.section-label {
		font: var(--label);
		color: var(--black);
	}

	@media (max-width: 768px) {
		.fields-grid {
			grid-template-columns: 1fr;
		}

		.schedule-slots {
			flex-direction: column;
		}
	}
</style>
