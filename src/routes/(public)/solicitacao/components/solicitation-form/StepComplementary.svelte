<script lang="ts">
	import FileUpload from '$lib/components/FileUpload.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { ComplementaryData, StepFieldErrors } from '$lib/types/request';
	import { YES_NO_OPTIONS } from '$lib/types/request';
	import { isFutureOrToday, isRequired } from '$lib/utils/validations';

	interface Props {
		data: ComplementaryData;
	}

	let { data = $bindable() }: Props = $props();

	let errors = $state<StepFieldErrors>({});

	const todayTimestamp = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 16);

	function addScheduleSlot() {
		if (data.preferredSchedule.length < 3) {
			data.preferredSchedule = [...data.preferredSchedule, ''];
		}
	}

	function removeScheduleSlot(index: number) {
		data.preferredSchedule = data.preferredSchedule.filter((_, i) => i !== index);
	}

	export function validate(): boolean {
		const e: StepFieldErrors = {};

		if (data.hasProcessDocumentation === 'Sim' && !isRequired(data.hasProcessDocumentationDetail)) {
			e.hasProcessDocumentationDetail = 'Detalhe a documentação existente.';
		}

		if (data.hasSimilarSolution === 'Sim' && !isRequired(data.hasSimilarSolutionDetail)) {
			e.hasSimilarSolutionDetail = 'Descreva a solução semelhante.';
		}

		if (data.dependsOnOtherAreas === 'Sim' && !isRequired(data.dependsOnOtherAreasDetail)) {
			e.dependsOnOtherAreasDetail = 'Informe quais áreas dependem desta solicitação.';
		}

		if (data.handlesRestrictedInfo === 'Sim' && !isRequired(data.handlesRestrictedInfoDetail)) {
			e.handlesRestrictedInfoDetail = 'Detalhe as informações restritas (LGPD).';
		}

		data.preferredSchedule.forEach((dataAgendada, index) => {
			if (dataAgendada && !isFutureOrToday(dataAgendada, todayTimestamp)) {
				e[`schedule_${index}`] = 'Insira um horário válido.';
			}
		});

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
			<Icon iconName="description" iconSize="lg" />
		</span>
		<div>
			<h3>Informações Complementares e Anexos</h3>
			<p>Etapa Opcional</p>
		</div>
	</div>

	<div class="fields-column">
		<div class="fields-grid">
			<Select
				label="Existe documentação do processo?"
				placeholder="Selecione"
				options={YES_NO_OPTIONS}
				bind:value={data.hasProcessDocumentation}
				error={errors.hasProcessDocumentation}
				onchange={() => clearError('hasProcessDocumentation')}
			/>

			<Input
				label="Detalhes da documentação"
				placeholder="Links ou descrição da documentação"
				maxlength={1000}
				disabled={data.hasProcessDocumentation !== 'Sim'}
				bind:value={data.hasProcessDocumentationDetail}
				error={errors.hasProcessDocumentationDetail}
				oninput={() => clearError('hasProcessDocumentationDetail')}
			/>

			<Select
				label="Existe solução semelhante?"
				placeholder="Selecione"
				options={YES_NO_OPTIONS}
				bind:value={data.hasSimilarSolution}
				error={errors.hasSimilarSolution}
				onchange={() => clearError('hasSimilarSolution')}
			/>

			<Input
				label="Detalhes da solução semelhante"
				placeholder="Descreva a solução existente, se houver"
				maxlength={1000}
				disabled={data.hasSimilarSolution !== 'Sim'}
				bind:value={data.hasSimilarSolutionDetail}
				error={errors.hasSimilarSolutionDetail}
				oninput={() => clearError('hasSimilarSolutionDetail')}
			/>

			<Select
				label="A solicitação depende de outras áreas?"
				placeholder="Selecione"
				options={YES_NO_OPTIONS}
				bind:value={data.dependsOnOtherAreas}
				error={errors.dependsOnOtherAreas}
				onchange={() => clearError('dependsOnOtherAreas')}
			/>

			<Input
				label="Quais áreas?"
				placeholder="Ex: Financeiro, TI, Operações"
				maxlength={1000}
				disabled={data.dependsOnOtherAreas !== 'Sim'}
				bind:value={data.dependsOnOtherAreasDetail}
				error={errors.dependsOnOtherAreasDetail}
				oninput={() => clearError('dependsOnOtherAreasDetail')}
			/>

			<Select
				label="Envolve tratamento de informações restritas?"
				placeholder="Selecione"
				options={YES_NO_OPTIONS}
				bind:value={data.handlesRestrictedInfo}
				error={errors.handlesRestrictedInfo}
				onchange={() => clearError('handlesRestrictedInfo')}
			/>

			<Input
				label="Detalhes de LGPD/Sigilo"
				placeholder="Descreva as informações sensíveis..."
				maxlength={1000}
				disabled={data.handlesRestrictedInfo !== 'Sim'}
				bind:value={data.handlesRestrictedInfoDetail}
				error={errors.handlesRestrictedInfoDetail}
				oninput={() => clearError('handlesRestrictedInfoDetail')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Observações adicionais"
				placeholder="Informações complementares que julgar necessárias..."
				rows={4}
				maxlength={2000}
				bind:value={data.additionalNotes}
				error={errors.additionalNotes}
				oninput={() => clearError('additionalNotes')}
			/>
		</div>

		<div class="schedule-section field-span-2">
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
							type="datetime-local"
							min={todayTimestamp}
							placeholder="dd/mm/aaaa"
							bind:value={data.preferredSchedule[index]}
							error={errors[`schedule_${index}`]}
							oninput={() => clearError(`schedule_${index}`)}
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

		<div class="upload-section field-span-2">
			<span class="section-label">Anexos</span>
			<FileUpload bind:files={data.files} onchange={() => clearError('files')} />
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

		.field-span-2 {
			grid-column: span 1;
		}

		.schedule-slots {
			flex-direction: column;
		}
	}
</style>
