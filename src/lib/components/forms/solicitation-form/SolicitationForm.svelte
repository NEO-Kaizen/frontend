<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import StepDemand from '$lib/components/forms/solicitation-form/StepDemand.svelte';
	import StepIdentification from '$lib/components/forms/solicitation-form/StepIdentification.svelte';
	import StepOperational from '$lib/components/forms/solicitation-form/StepOperational.svelte';
	import StepsForm from '$lib/components/forms/solicitation-form/StepsForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type {
		DemandData,
		IdentificationData,
		OperationalData,
		StepFieldErrors
	} from '$lib/types/solicitation';

	const steps = [
		{ id: 1, label: 'Identificação' },
		{ id: 2, label: 'Demanda' },
		{ id: 3, label: 'Informações' }
	];

	let currentStep = $state(1);
	let completedSteps = $state(new Set<number>());
	let visitedSteps = $state(new Set<number>([1]));
	let isSubmitting = $state(false);
	let submitted = $state(false);

	let identification = $state<IdentificationData>({
		fullName: '',
		email: '',
		area: '',
		department: '',
		managerName: '',
		additionalContact: ''
	});

	let demand = $state<DemandData>({
		title: '',
		category: '',
		currentProcessName: '',
		description: '',
		justification: ''
	});

	let operational = $state<OperationalData>({
		volume: '',
		executionTime: '',
		desiredDeadline: '',
		operationalImpact: '',
		preferredSchedule: [],
		files: []
	});

	let step1Errors = $state<StepFieldErrors>({});
	let step2Errors = $state<StepFieldErrors>({});
	let step3Errors = $state<StepFieldErrors>({});

	let step1Validate = $state<(() => boolean) | null>(null);
	let step2Validate = $state<(() => boolean) | null>(null);
	let step3Validate = $state<(() => boolean) | null>(null);

	function clearStep1Error(field: string) {
		step1Errors[field] = undefined;
	}

	function clearStep2Error(field: string) {
		step2Errors[field] = undefined;
	}

	function clearStep3Error(field: string) {
		step3Errors[field] = undefined;
	}

	function validateCurrentStep(): boolean {
		if (currentStep === 1) return step1Validate?.() ?? false;
		if (currentStep === 2) return step2Validate?.() ?? false;
		return step3Validate?.() ?? false;
	}

	function handleNext() {
		if (!validateCurrentStep()) return;

		completedSteps = new Set([...completedSteps, currentStep]);
		const nextStep = currentStep + 1;
		visitedSteps = new Set([...visitedSteps, nextStep]);
		currentStep = nextStep;
	}

	function handleBack() {
		if (currentStep > 1) {
			currentStep = currentStep - 1;
		}
	}

	function handleStepClick(stepId: number) {
		if (visitedSteps.has(stepId)) {
			currentStep = stepId;
		}
	}

	function handleCancel() {
		resetForm();
		window.location.href = '/';
	}

	function resetForm() {
		currentStep = 1;
		completedSteps = new Set();
		visitedSteps = new Set([1]);
		identification = {
			fullName: '',
			email: '',
			area: '',
			department: '',
			managerName: '',
			additionalContact: ''
		};
		demand = {
			title: '',
			category: '',
			currentProcessName: '',
			description: '',
			justification: ''
		};
		operational = {
			volume: '',
			executionTime: '',
			desiredDeadline: '',
			operationalImpact: '',
			preferredSchedule: [],
			files: []
		};
		step1Errors = {};
		step2Errors = {};
		step3Errors = {};
	}

	async function handleSubmit() {
		if (!step3Validate?.()) return;

		isSubmitting = true;

		await new Promise((resolve) => setTimeout(resolve, 1000));

		isSubmitting = false;
		submitted = true;
	}
</script>

<div class="form-container">
	<header class="form-header">
		<h1>Formulário de Demanda</h1>
		<p>Preencha os detalhes abaixo para registrar sua nova solicitação no Portal NEO.</p>
	</header>

	<StepsForm
		{steps}
		current={currentStep}
		{completedSteps}
		{visitedSteps}
		onstepclick={handleStepClick}
	/>

	<div class="form-card">
		{#if submitted}
			<div class="success-message" role="status">
				<span class="success-icon" aria-hidden="true">
					<Icon iconName="check" iconSize="lg" />
				</span>
				<h3>Solicitação enviada com sucesso!</h3>
				<p>Sua demanda foi registrada e será analisada pela equipe responsável.</p>
				<Button variant="primary" onclick={resetForm}>Nova Solicitação</Button>
			</div>
		{:else}
			{#if currentStep === 1}
				<StepIdentification
					data={identification}
					bind:errors={step1Errors}
					onClearError={clearStep1Error}
					onvalidate={(fn) => (step1Validate = fn)}
				/>
			{:else if currentStep === 2}
				<StepDemand
					data={demand}
					bind:errors={step2Errors}
					onClearError={clearStep2Error}
					onvalidate={(fn) => (step2Validate = fn)}
				/>
			{:else if currentStep === 3}
				<StepOperational
					data={operational}
					bind:errors={step3Errors}
					onClearError={clearStep3Error}
					onvalidate={(fn) => (step3Validate = fn)}
				/>
			{/if}

			<footer class="form-actions">
				<Button variant="outline-neutral" onclick={handleCancel}>Cancelar</Button>

				<div class="actions-right">
					{#if currentStep > 1}
						<Button variant="outline" onclick={handleBack}>Voltar</Button>
					{/if}

					{#if currentStep < 3}
						<Button variant="secondary" onclick={handleNext}>
							Avançar
							<Icon iconName="arrowForward" iconSize="md" />
						</Button>
					{:else}
						<Button variant="secondary" onclick={handleSubmit} loading={isSubmitting}>
							Enviar Solicitação
							<Icon iconName="send" iconSize="md" />
						</Button>
					{/if}
				</div>
			</footer>
		{/if}
	</div>
</div>

<style>
	.form-container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.form-header {
		text-align: left;
		display: flex;
		flex-direction: column;
	}

	.form-header h1 {
		font: var(--h1);
		color: var(--primary-color);
	}

	.form-header p {
		font: var(--paragrafo);
		color: var(--gray);
	}

	.form-card {
		background-color: var(--white);
		border-radius: var(--radius-md);
		box-shadow: var(--regular-shadow);
		border: var(--border-default);
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.form-actions {
		display: flex;
		justify-content: right;
		align-items: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-md);
	}

	.actions-right {
		display: flex;
		gap: var(--spacing-sm);
	}

	.success-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-xl);
		text-align: center;
	}

	.success-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background-color: var(--status-green-bg);
		color: var(--status-green);
	}

	.success-message h3 {
		font: var(--h3);
		color: var(--status-green);
	}

	.success-message p {
		font: var(--paragrafo);
		color: var(--gray);
	}
</style>
