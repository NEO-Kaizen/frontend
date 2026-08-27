<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Input from '$lib/components/Input.svelte';
	import type { IdentificationData, StepFieldErrors } from '$lib/types/solicitation';
	
	interface Props {
		data: IdentificationData;
		errors: StepFieldErrors;
		onClearError: (field: string) => void;
		onvalidate?: (validate: () => boolean) => void;
	}

	let { data, errors = $bindable(), onClearError, onvalidate }: Props = $props();

	const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	function validate(): boolean {
		const e: StepFieldErrors = {};

		if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(data.fullName) || !data.fullName.trim()) {
			e.fullName = 'Campo obrigatório, apenas texto.';
		}

		if (!data.corporateEmail.trim()) {
			e.corporateEmail = 'Campo obrigatório.';
		} else if (!EMAIL_PATTERN.test(data.corporateEmail)) {
			e.corporateEmail = 'E-mail inválido.';
		}

		if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(data.area) || !data.area.trim()) {
			e.area = 'Campo obrigatório, apenas texto.';
		}

		if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(data.department) || !data.department.trim()) {
			e.department = 'Campo obrigatório, apenas texto.';
		}

		if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(data.manager) || !data.manager.trim()) {
			e.manager = 'Campo obrigatório, apenas texto.';
		}

		if (data.additionalContact && data.additionalContact.trim()) {
			if (!/^[1-9]{2}[2-9][0-9]{7,8}$/.test(data.additionalContact)) {
				e.additionalContact = 'Insira um número válido.';
			}
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
			bind:value={data.corporateEmail}
			error={errors.corporateEmail}
			oninput={() => onClearError('corporateEmail')}
		/>

		<Input
			label="Área do solicitante"
			placeholder="Selecione a área"
			required
			bind:value={data.area}
			error={errors.area}
			onchange={() => onClearError('area')}
		/>

		<Input
			label="Departamento"
			placeholder="Ex: Gestão de Contas"
			bind:value={data.department}
			error={errors.department}
			oninput={() => onClearError('department')}
		/>

		<Input
			label="Gestor responsável"
			placeholder="Nome do responsável direto"
			required
			bind:value={data.manager}
			error={errors.manager}
			oninput={() => onClearError('manager')}
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
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-xl);
	}

	@media (max-width: 768px) {
		.fields-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
