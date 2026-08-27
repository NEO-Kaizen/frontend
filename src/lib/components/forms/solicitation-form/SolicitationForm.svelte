<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import StepDemand from '$lib/components/forms/solicitation-form/StepDemand.svelte';
	import StepIdentification from '$lib/components/forms/solicitation-form/StepIdentification.svelte';
	import StepOperational from '$lib/components/forms/solicitation-form/StepOperational.svelte';
	import StepsForm from '$lib/components/forms/solicitation-form/StepsForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type {
		AttachmentMetadata,
		CreateRequestPayload,
		DemandData,
		IdentificationData,
		OperationalData,
		RequestCategory,
		OperationalImpact,
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
		corporateEmail: '',
		area: '',
		department: '',
		manager: '',
		additionalContact: ''
	});

	let demand = $state<DemandData>({
		title: '',
		category: '',
		processName: '',
		description: '',
		justificationAndExpectedResult: ''
	});

	let operational = $state<OperationalData>({
		volumetry: '',
		averageExecutionTime: '',
		desiredDeadline: '',
		operationalImpact: '',
		preferredSchedule: [],
		files: []
	});

	let step1Errors = $state<StepFieldErrors>({});
	let step2Errors = $state<StepFieldErrors>({});
	let step3Errors = $state<StepFieldErrors>({});

	const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	function clearStep1Error(field: string) {
		step1Errors[field] = undefined;
	}

	function clearStep2Error(field: string) {
		step2Errors[field] = undefined;
	}

	function clearStep3Error(field: string) {
		step3Errors[field] = undefined;
	}

	function validateStep1(): boolean {
		const errors: StepFieldErrors = {};

		if (!identification.fullName.trim()) {
			errors.fullName = 'Campo obrigatório.';
		}

		if (!identification.corporateEmail.trim()) {
			errors.corporateEmail = 'Campo obrigatório.';
		} else if (!EMAIL_PATTERN.test(identification.corporateEmail)) {
			errors.corporateEmail = 'E-mail inválido.';
		}

		if (!identification.area) {
			errors.area = 'Campo obrigatório.';
		}

		if (!identification.manager.trim()) {
			errors.manager = 'Campo obrigatório.';
		}

		step1Errors = errors;
		return Object.keys(errors).length === 0;
	}

	function validateStep2(): boolean {
		const errors: StepFieldErrors = {};

		if (!demand.title.trim()) {
			errors.title = 'Campo obrigatório.';
		}

		if (!demand.category) {
			errors.category = 'Campo obrigatório.';
		}

		if (!demand.processName.trim()) {
			errors.processName = 'Campo obrigatório.';
		}

		if (!demand.description.trim()) {
			errors.description = 'Campo obrigatório.';
		}

		if (!demand.justificationAndExpectedResult.trim()) {
			errors.justificationAndExpectedResult = 'Campo obrigatório.';
		}

		step2Errors = errors;
		return Object.keys(errors).length === 0;
	}

	function validateStep3(): boolean {
		const errors: StepFieldErrors = {};

		if (!operational.volumetry.trim()) {
			errors.volumetry = 'Campo obrigatório.';
		}

		if (!operational.averageExecutionTime.trim()) {
			errors.averageExecutionTime = 'Campo obrigatório.';
		}

		if (!operational.desiredDeadline) {
			errors.desiredDeadline = 'Campo obrigatório.';
		}

		if (!operational.operationalImpact) {
			errors.operationalImpact = 'Campo obrigatório.';
		}

		const minDatetime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
			.toISOString()
			.slice(0, 16);

		operational.preferredSchedule.forEach((slot, index) => {
			if (slot && slot < minDatetime) {
				errors[`schedule_${index}`] = 'Insira um horário válido.';
			}
		});

		step3Errors = errors;
		return Object.keys(errors).length === 0;
	}

	function handleNext() {
		if (currentStep === 1 && !validateStep1()) return;
		if (currentStep === 2 && !validateStep2()) return;

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
			corporateEmail: '',
			area: '',
			department: '',
			manager: '',
			additionalContact: ''
		};
		demand = {
			title: '',
			category: '',
			processName: '',
			description: '',
			justificationAndExpectedResult: ''
		};
		operational = {
			volumetry: '',
			averageExecutionTime: '',
			desiredDeadline: '',
			operationalImpact: '',
			preferredSchedule: [],
			files: []
		};
		step1Errors = {};
		step2Errors = {};
		step3Errors = {};
	}

	function buildPayload(): CreateRequestPayload {
		const attachments: AttachmentMetadata[] = operational.files.map((f) => ({
			fileName: f.fileName,
			mimeType: f.mimeType,
			sizeBytes: f.sizeBytes
		}));

		return {
			requester: {
				fullName: identification.fullName.trim(),
				corporateEmail: identification.corporateEmail.trim(),
				area: identification.area,
				department: identification.department.trim() || undefined,
				manager: identification.manager.trim(),
				additionalContact: identification.additionalContact.trim() || undefined
			},
			demand: {
				title: demand.title.trim(),
				category: demand.category as RequestCategory,
				processName: demand.processName.trim(),
				description: demand.description.trim(),
				justificationAndExpectedResult: demand.justificationAndExpectedResult.trim()
			},
			operational: {
				volumetry: operational.volumetry.trim(),
				averageExecutionTime: operational.averageExecutionTime.trim(),
				desiredDeadline: operational.desiredDeadline,
				operationalImpact: operational.operationalImpact as OperationalImpact
			},
			complementary: attachments.length > 0 ? { attachments } : undefined,
			schedulePreferences:
				operational.preferredSchedule.length > 0
					? operational.preferredSchedule.filter(Boolean)
					: undefined
		};
	}

	async function handleSubmit() {
		if (!validateStep3()) return;

		isSubmitting = true;

		const payload = buildPayload();
		console.log('Payload enviado:', JSON.stringify(payload, null, 2));

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
					errors={step1Errors}
					onClearError={clearStep1Error}
				/>
			{:else if currentStep === 2}
				<StepDemand data={demand} errors={step2Errors} onClearError={clearStep2Error} />
			{:else if currentStep === 3}
				<StepOperational data={operational} errors={step3Errors} onClearError={clearStep3Error} />
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
