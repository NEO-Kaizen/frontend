<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { DemandData, StepFieldErrors } from '$lib/types/request';
	import { REQUEST_TYPE_OPTIONS } from '$lib/types/request';
	import { isRequired } from '$lib/utils/validations';

	interface Props {
		data: DemandData;
		// Opções dinâmicas vindas do PortalConfig (Card 5) — categorias ativas,
		// com `value` = id estável da categoria e `label` = nome exibido.
		categoryOptions: { value: string; label: string }[];
	}

	let { data = $bindable(), categoryOptions }: Props = $props();

	let errors = $state<StepFieldErrors>({});

	export function validate(): boolean {
		const e: StepFieldErrors = {};

		if (!isRequired(data.title)) {
			e.title = 'Campo obrigatório.';
		}

		if (!isRequired(data.processName)) {
			e.processName = 'Campo obrigatório.';
		}

		if (!data.requestType) {
			e.requestType = 'Campo obrigatório.';
		}

		if (!data.category) {
			e.category = 'Campo obrigatório.';
		}

		if (!isRequired(data.description)) {
			e.description = 'Campo obrigatório.';
		}

		if (!isRequired(data.problem)) {
			e.problem = 'Campo obrigatório.';
		}

		if (!isRequired(data.justification)) {
			e.justification = 'Campo obrigatório.';
		}

		if (!isRequired(data.expectedResult)) {
			e.expectedResult = 'Campo obrigatório.';
		}

		errors = e;
		return Object.keys(e).length === 0;
	}

	export function clearErrors(): void {
		errors = {};
	}

	function clearError(field: string): void {
		delete errors[field];
	}
</script>

<div class="step-content">
	<div class="step-header">
		<span class="step-icon" aria-hidden="true">
			<Icon iconName="description" iconSize="lg" />
		</span>
		<h3>Identificação da Demanda</h3>
	</div>

	<div class="fields-column">
		<div class="fields-grid">
			<Input
				label="Título resumido da solicitação"
				placeholder="Título curto e claro"
				required
				maxlength={150}
				bind:value={data.title}
				error={errors.title}
				oninput={() => clearError('title')}
			/>

			<Input
				label="Nome do processo atual"
				placeholder="Como o processo é conhecido hoje?"
				required
				maxlength={150}
				bind:value={data.processName}
				error={errors.processName}
				oninput={() => clearError('processName')}
			/>
		</div>

		<div class="fields-grid">
			<Select
				label="Tipo de solicitação"
				placeholder="Selecione o tipo"
				options={REQUEST_TYPE_OPTIONS}
				required
				bind:value={data.requestType}
				error={errors.requestType}
				onchange={() => clearError('requestType')}
			/>

			<Select
				label="Categoria"
				placeholder="Selecione a categoria"
				options={categoryOptions}
				required
				bind:value={data.category}
				error={errors.category}
				onchange={() => clearError('category')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Descrição da necessidade"
				placeholder="Descreva detalhadamente o que precisa ser feito..."
				required
				rows={5}
				maxlength={4000}
				bind:value={data.description}
				error={errors.description}
				oninput={() => clearError('description')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Problema ou oportunidade identificada"
				placeholder="Descreva o problema atual ou a oportunidade de melhoria..."
				required
				rows={4}
				maxlength={4000}
				bind:value={data.problem}
				error={errors.problem}
				oninput={() => clearError('problem')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Justificativa da solicitação"
				placeholder="Por que isso é necessário?"
				required
				rows={4}
				maxlength={4000}
				bind:value={data.justification}
				error={errors.justification}
				oninput={() => clearError('justification')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Resultado esperado"
				placeholder="O que se espera alcançar com esta solicitação?"
				required
				rows={4}
				maxlength={4000}
				bind:value={data.expectedResult}
				error={errors.expectedResult}
				oninput={() => clearError('expectedResult')}
			/>
		</div>
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
