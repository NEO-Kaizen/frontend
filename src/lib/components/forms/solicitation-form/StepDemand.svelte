<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import type { DemandData, StepFieldErrors } from '$lib/types/solicitation';
	import { CATEGORY_OPTIONS, REQUEST_TYPE_OPTIONS } from '$lib/types/solicitation';

	interface Props {
		data: DemandData;
		errors: StepFieldErrors;
		onClearError: (field: string) => void;
		onvalidate?: (validate: () => boolean) => void;
		categoryOptions?: { value: string; label: string }[];
	}

	let { data, errors = $bindable(), onClearError, onvalidate, categoryOptions }: Props = $props();

	// permite suporte a novas categorias gerenciadas na página de configurações
	let effectiveCategoryOptions = $derived(
		categoryOptions && categoryOptions.length > 0 ? categoryOptions : CATEGORY_OPTIONS
	);

	function validate(): boolean {
		const e: StepFieldErrors = {};

		if (!data.title.trim()) {
			e.title = 'Campo obrigatório.';
		}

		if (!data.processName.trim()) {
			e.processName = 'Campo obrigatório.';
		}

		if (!data.requestType) {
			e.requestType = 'Campo obrigatório.';
		}

		if (!data.category) {
			e.category = 'Campo obrigatório.';
		}

		if (!data.description.trim()) {
			e.description = 'Campo obrigatório.';
		}

		if (!data.problemOrOpportunity.trim()) {
			e.problemOrOpportunity = 'Campo obrigatório.';
		}

		if (!data.justification.trim()) {
			e.justification = 'Campo obrigatório.';
		}

		if (!data.expectedResult.trim()) {
			e.expectedResult = 'Campo obrigatório.';
		}

		errors = e;
		return Object.keys(e).length === 0;
	}

	$effect(() => {
		onvalidate?.(validate);
	});
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
				bind:value={data.title}
				error={errors.title}
				oninput={() => onClearError('title')}
			/>

			<Input
				label="Nome do processo atual"
				placeholder="Como o processo é conhecido hoje?"
				required
				bind:value={data.processName}
				error={errors.processName}
				oninput={() => onClearError('processName')}
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
				onchange={() => onClearError('requestType')}
			/>

			<Select
				label="Categoria"
				placeholder="Selecione a categoria"
				options={effectiveCategoryOptions}
				required
				bind:value={data.category}
				error={errors.category}
				onchange={() => onClearError('category')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Descrição da necessidade"
				placeholder="Descreva detalhadamente o que precisa ser feito..."
				required
				rows={5}
				bind:value={data.description}
				error={errors.description}
				oninput={() => onClearError('description')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Problema ou oportunidade identificada"
				placeholder="Descreva o problema atual ou a oportunidade de melhoria..."
				required
				rows={4}
				bind:value={data.problemOrOpportunity}
				error={errors.problemOrOpportunity}
				oninput={() => onClearError('problemOrOpportunity')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Justificativa da solicitação"
				placeholder="Por que isso é necessário?"
				required
				rows={4}
				bind:value={data.justification}
				error={errors.justification}
				oninput={() => onClearError('justification')}
			/>
		</div>

		<div class="field-span-2">
			<Textarea
				label="Resultado esperado"
				placeholder="O que se espera alcançar com esta solicitação?"
				required
				rows={4}
				bind:value={data.expectedResult}
				error={errors.expectedResult}
				oninput={() => onClearError('expectedResult')}
			/>
		</div>
	</div>
</div>

<style>
	:global(.error-message) {
		position: absolute;
		top: 100%;
		left: 0;
		width: 100%;
		margin: 0;
		margin-top: 4px;
	}
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
