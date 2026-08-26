<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { IdentificationData } from '$lib/types/solicitation';
	import type { StepFieldErrors } from '$lib/types/solicitation';

	interface Props {
		data: IdentificationData;
		errors: StepFieldErrors;
		onClearError: (field: string) => void;
	}

	let { data, errors, onClearError }: Props = $props();

	const areaOptions = [
		{ value: 'ti', label: 'Tecnologia da Informação' },
		{ value: 'rh', label: 'Recursos Humanos' },
		{ value: 'financeiro', label: 'Financeiro' },
		{ value: 'operacoes', label: 'Operações' },
		{ value: 'comercial', label: 'Comercial' },
		{ value: 'marketing', label: 'Marketing' },
		{ value: 'juridico', label: 'Jurídico' },
		{ value: 'administrativo', label: 'Administrativo' }
	];
</script>

<div class="step-content">
	<div class="step-header">
		<span class="step-icon" aria-hidden="true">
			<Icon iconName="person" iconSize="lg" />
		</span>
		<h3>Identificação do Solicitante</h3>
	</div>

	<div class="fields-grid">
		<Input
			label="Nome completo"
			placeholder="Ex: João da Silva"
			required
			bind:value={data.fullName}
			error={errors.fullName}
			oninput={() => onClearError('fullName')}
		/>

		<Input
			type="email"
			label="E-mail corporativo"
			placeholder="joao.silva@empresa.com"
			required
			bind:value={data.email}
			error={errors.email}
			oninput={() => onClearError('email')}
		/>

		<Select
			label="Área do solicitante"
			placeholder="Selecione a área"
			options={areaOptions}
			required
			bind:value={data.area}
			error={errors.area}
			onchange={() => onClearError('area')}
		/>

		<Input
			label="Departamento"
			placeholder="Ex: Gestão de Contas"
			required
			bind:value={data.department}
			error={errors.department}
			oninput={() => onClearError('department')}
		/>

		<Input
			label="Nome do gestor"
			placeholder="Nome do responsável direto"
			required
			bind:value={data.managerName}
			error={errors.managerName}
			oninput={() => onClearError('managerName')}
		/>

		<Input
			label="Contato adicional"
			placeholder="Ramal ou Celular"
			bind:value={data.additionalContact}
			error={errors.additionalContact}
			oninput={() => onClearError('additionalContact')}
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

	.fields-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-lg);
	}

	@media (max-width: 768px) {
		.fields-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
