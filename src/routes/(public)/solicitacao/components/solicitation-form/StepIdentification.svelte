<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { IdentificationData, StepFieldErrors } from '$lib/types/request';
	import { isRequired, isValidEmail, isValidText } from '$lib/utils/validations';

	interface Props {
		data: IdentificationData;
		departmentOptions?: { value: string; label: string }[];
		lockedFields?: string[];
	}

	let { data = $bindable(), departmentOptions, lockedFields = [] }: Props = $props();

	let errors = $state<StepFieldErrors>({});

	export function validate(): boolean {
		const e: StepFieldErrors = {};

		if (!isValidText(data.fullName) || !isRequired(data.fullName)) {
			e.fullName = 'Campo obrigatório, apenas texto.';
		}

		if (!isRequired(data.corporateEmail)) {
			e.corporateEmail = 'Campo obrigatório.';
		} else if (!isValidEmail(data.corporateEmail)) {
			e.corporateEmail = 'E-mail inválido.';
		}

		if (!isValidText(data.area) || !isRequired(data.area)) {
			e.area = 'Campo obrigatório, apenas texto.';
		}

		// departamento é opcional por padrão; quando há lista, valida a seleção;
		// senão, valida apenas o formato quando preenchido
		if (departmentOptions && departmentOptions.length > 0) {
			if (data.department && !departmentOptions.some((o) => o.value === data.department)) {
				e.department = 'Selecione um departamento válido.';
			}
		} else if (data.department.trim() && !isValidText(data.department)) {
			e.department = 'Apenas texto.';
		}

		if (!isValidText(data.manager) || !isRequired(data.manager)) {
			e.manager = 'Campo obrigatório, apenas texto.';
		}

		// alteração feita para aceitar qualquer tipo de contato, e não apenas celular
		if (data.additionalContact && data.additionalContact.trim()) {
			if (data.additionalContact.trim().length < 3) {
				e.additionalContact = 'Informe um contato válido.';
			}
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

	function isLocked(field: string): boolean {
		return lockedFields.includes(field);
	}
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
			disabled={isLocked('fullName')}
			oninput={() => clearError('fullName')}
		/>

		<Input
			type="email"
			label="E-mail corporativo"
			placeholder="joao.silva@empresa.com"
			required
			bind:value={data.corporateEmail}
			error={errors.corporateEmail}
			disabled={isLocked('corporateEmail')}
			oninput={() => clearError('corporateEmail')}
		/>

		<Input
			label="Área do solicitante"
			placeholder="Selecione a área"
			required
			bind:value={data.area}
			error={errors.area}
			onchange={() => clearError('area')}
		/>

		{#if departmentOptions && departmentOptions.length > 0}
			<Select
				label="Departamento"
				placeholder="Selecione o departamento"
				options={departmentOptions}
				bind:value={data.department}
				error={errors.department}
				onchange={() => clearError('department')}
			/>
		{:else}
			<Input
				label="Departamento"
				placeholder="Ex: Gestão de Contas"
				bind:value={data.department}
				error={errors.department}
				oninput={() => clearError('department')}
			/>
		{/if}

		<Input
			label="Gestor responsável"
			placeholder="Nome do responsável direto"
			required
			bind:value={data.manager}
			error={errors.manager}
			oninput={() => clearError('manager')}
		/>

		<Input
			label="Contato adicional"
			placeholder="Ramal, Celular ou e-mail alternativo"
			bind:value={data.additionalContact}
			error={errors.additionalContact}
			oninput={() => clearError('additionalContact')}
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
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-xl);
	}

	@media (max-width: 768px) {
		.fields-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
