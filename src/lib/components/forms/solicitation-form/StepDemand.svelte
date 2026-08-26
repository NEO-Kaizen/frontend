<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Textarea from '$lib/components/Textarea.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { DemandData } from '$lib/types/solicitation';
	import type { StepFieldErrors } from '$lib/types/solicitation';

	interface Props {
		data: DemandData;
		errors: StepFieldErrors;
		onClearError: (field: string) => void;
	}

	let { data, errors, onClearError }: Props = $props();

	const categoryOptions = [
		{ value: 'automacao', label: 'Automação de Processos' },
		{ value: 'relatorio', label: 'Relatório / Dashboard' },
		{ value: 'integracao', label: 'Integração de Sistemas' },
		{ value: 'manutencao', label: 'Manutenção / Correção' },
		{ value: 'melhoria', label: 'Melhoria de Funcionalidade' },
		{ value: 'novo', label: 'Nova Funcionalidade' },
		{ value: 'outro', label: 'Outro' }
	];
</script>

<div class="step-content">
	<div class="step-header">
		<span class="step-icon" aria-hidden="true">
			<Icon iconName="description" iconSize="lg" />
		</span>
		<h3>Identificação da Demanda</h3>
	</div>

	<div class="fields-column">
		<Input
			label="Título resumido da solicitação"
			placeholder="Título curto e claro"
			required
			bind:value={data.title}
			error={errors.title}
			oninput={() => onClearError('title')}
		/>

		<Select
			label="Categoria"
			placeholder="Selecione a categoria"
			options={categoryOptions}
			required
			bind:value={data.category}
			error={errors.category}
			onchange={() => onClearError('category')}
		/>

		<Input
			label="Nome do processo atual"
			placeholder="Como o processo é conhecido hoje?"
			required
			bind:value={data.currentProcessName}
			error={errors.currentProcessName}
			oninput={() => onClearError('currentProcessName')}
		/>

		<Textarea
			label="Descrição da necessidade"
			placeholder="Descreva detalhadamente o que precisa ser feito..."
			required
			rows={5}
			bind:value={data.description}
			error={errors.description}
			oninput={() => onClearError('description')}
		/>

		<Textarea
			label="Justificativa e resultado esperado"
			placeholder="Por que isso é necessário e o que se espera alcançar?"
			required
			rows={4}
			bind:value={data.justification}
			error={errors.justification}
			oninput={() => onClearError('justification')}
		/>
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

	.fields-column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}
</style>
