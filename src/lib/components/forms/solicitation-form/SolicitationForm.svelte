<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/Button.svelte';
	import StepComplementary from '$lib/components/forms/solicitation-form/StepComplementary.svelte';
	import StepDemand from '$lib/components/forms/solicitation-form/StepDemand.svelte';
	import StepIdentification from '$lib/components/forms/solicitation-form/StepIdentification.svelte';
	import StepOperational from '$lib/components/forms/solicitation-form/StepOperational.svelte';
	import StepsForm from '$lib/components/forms/solicitation-form/StepsForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		clearDraft,
		loadDraft,
		saveDraft,
		type SolicitationDraft
	} from '$lib/services/solicitationDraft.service';
	import type {
		AttachmentMetadata,
		ComplementaryData,
		CreateRequestPayload,
		Criticality,
		DemandData,
		Frequency,
		IdentificationData,
		OperationalData,
		OperationalImpact,
		RequestCategory,
		RequestType,
		StepFieldErrors,
		YesNo,
		YesNoDetail
	} from '$lib/types/solicitation';

	const steps = [
		{ id: 1, label: 'Identificação' },
		{ id: 2, label: 'Demanda' },
		{ id: 3, label: 'Operacional' },
		{ id: 4, label: 'Complementar' }
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
		requestType: '',
		description: '',
		problem: '',
		justification: '',
		expectedResult: ''
	});

	let operational = $state<OperationalData>({
		processDescription: '',
		processSteps: '',
		systemsUsed: '',
		executionFrequency: '',
		volumetry: '',
		peopleInvolved: '',
		averageExecutionTime: '',
		monthlyEffortHours: '',
		hasManualControls: '',
		hasManualControlsDetail: '',
		mainRisks: '',
		clientImpact: '',
		operationalImpact: '',
		desiredDeadline: '',
		perceivedCriticality: ''
	});

	let complementary = $state<ComplementaryData>({
		hasProcessDocumentation: '',
		hasProcessDocumentationDetail: '',
		hasSimilarSolution: '',
		hasSimilarSolutionDetail: '',
		dependsOnOtherAreas: '',
		dependsOnOtherAreasDetail: '',
		handlesRestrictedInfo: '',
		handlesRestrictedInfoDetail: '',
		additionalNotes: '',
		files: [],
		preferredSchedule: []
	});

	let step1Errors = $state<StepFieldErrors>({});
	let step2Errors = $state<StepFieldErrors>({});
	let step3Errors = $state<StepFieldErrors>({});
	let step4Errors = $state<StepFieldErrors>({});

	let step1Validate = $state<(() => boolean) | null>(null);
	let step2Validate = $state<(() => boolean) | null>(null);
	let step3Validate = $state<(() => boolean) | null>(null);
	let step4Validate = $state<(() => boolean) | null>(null);

	if (browser) {
		const draft = loadDraft();
		if (draft) {
			currentStep = draft.currentStep;
			completedSteps = new Set(draft.completedSteps);
			visitedSteps = new Set(draft.visitedSteps);
			identification = draft.identification;
			demand = draft.demand;
			operational = draft.operational;
			complementary = draft.complementary;
		}
	}

	$effect(() => {
		if (!browser) return;
		void identification;
		void demand;
		void operational;
		void complementary;
		void currentStep;
		void completedSteps;
		void visitedSteps;
		void isSubmitting;
		const draft: SolicitationDraft = {
			version: 1,
			identification,
			demand,
			operational,
			complementary,
			currentStep,
			completedSteps: [...completedSteps],
			visitedSteps: [...visitedSteps]
		};
		saveDraft(draft);
	});

	function clearStep1Error(field: string) {
		step1Errors[field] = undefined;
	}

	function clearStep2Error(field: string) {
		step2Errors[field] = undefined;
	}

	function clearStep3Error(field: string) {
		step3Errors[field] = undefined;
	}

	function clearStep4Error(field: string) {
		step4Errors[field] = undefined;
	}

	function validateCurrentStep(): boolean {
		if (currentStep === 1) return step1Validate?.() ?? false;
		if (currentStep === 2) return step2Validate?.() ?? false;
		if (currentStep === 3) return step3Validate?.() ?? false;
		return step4Validate?.() ?? true;
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
		clearDraft();
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
			requestType: '',
			description: '',
			problem: '',
			justification: '',
			expectedResult: ''
		};
		operational = {
			processDescription: '',
			processSteps: '',
			systemsUsed: '',
			executionFrequency: '',
			volumetry: '',
			peopleInvolved: '',
			averageExecutionTime: '',
			monthlyEffortHours: '',
			hasManualControls: '',
			hasManualControlsDetail: '',
			mainRisks: '',
			clientImpact: '',
			operationalImpact: '',
			desiredDeadline: '',
			perceivedCriticality: ''
		};
		complementary = {
			hasProcessDocumentation: '',
			hasProcessDocumentationDetail: '',
			hasSimilarSolution: '',
			hasSimilarSolutionDetail: '',
			dependsOnOtherAreas: '',
			dependsOnOtherAreasDetail: '',
			handlesRestrictedInfo: '',
			handlesRestrictedInfoDetail: '',
			additionalNotes: '',
			files: [],
			preferredSchedule: []
		};
		step1Errors = {};
		step2Errors = {};
		step3Errors = {};
		step4Errors = {};
	}

	function toYesNoDetail(choice: YesNo | '', detail: string): YesNoDetail | undefined {
		if (!choice) return undefined;
		if (choice === 'Não') return false;
		const trimmed = detail.trim();
		return trimmed ? trimmed : undefined;
	}

	function buildPayload(): CreateRequestPayload {
		const attachments: AttachmentMetadata[] = complementary.files.map((f) => ({
			fileName: f.fileName,
			mimeType: f.mimeType,
			sizeBytes: f.sizeBytes
		}));

		const hasProcessDocumentation = toYesNoDetail(
			complementary.hasProcessDocumentation,
			complementary.hasProcessDocumentationDetail
		);
		const hasSimilarSolution = toYesNoDetail(
			complementary.hasSimilarSolution,
			complementary.hasSimilarSolutionDetail
		);
		const dependsOnOtherAreas = toYesNoDetail(
			complementary.dependsOnOtherAreas,
			complementary.dependsOnOtherAreasDetail
		);
		const handlesRestrictedInfo = toYesNoDetail(
			complementary.handlesRestrictedInfo,
			complementary.handlesRestrictedInfoDetail
		);
		const additionalNotes = complementary.additionalNotes.trim() || undefined;

		const hasComplementaryContent =
			hasProcessDocumentation !== undefined ||
			hasSimilarSolution !== undefined ||
			dependsOnOtherAreas !== undefined ||
			handlesRestrictedInfo !== undefined ||
			additionalNotes !== undefined ||
			attachments.length > 0;

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
				requestType: demand.requestType as RequestType,
				description: demand.description.trim(),
				problem: demand.problem.trim(),
				justification: demand.justification.trim(),
				expectedResult: demand.expectedResult.trim()
			},
			operational: {
				processDescription: operational.processDescription.trim(),
				processSteps: operational.processSteps.trim(),
				systemsUsed: operational.systemsUsed.trim(),
				executionFrequency: operational.executionFrequency as Frequency,
				volumetry: operational.volumetry.trim(),
				peopleInvolved: Number(operational.peopleInvolved),
				averageExecutionTime: operational.averageExecutionTime.trim(),
				monthlyEffortHours: Number(operational.monthlyEffortHours),
				hasManualControls:
					operational.hasManualControls === 'Não'
						? false
						: operational.hasManualControlsDetail.trim(),
				mainRisks: operational.mainRisks.trim(),
				clientImpact: operational.clientImpact.trim(),
				operationalImpact: operational.operationalImpact as OperationalImpact,
				desiredDeadline: operational.desiredDeadline,
				perceivedCriticality: operational.perceivedCriticality as Criticality
			},
			complementary: hasComplementaryContent
				? {
						...(hasProcessDocumentation !== undefined ? { hasProcessDocumentation } : {}),
						...(hasSimilarSolution !== undefined ? { hasSimilarSolution } : {}),
						...(dependsOnOtherAreas !== undefined ? { dependsOnOtherAreas } : {}),
						...(handlesRestrictedInfo !== undefined ? { handlesRestrictedInfo } : {}),
						...(additionalNotes !== undefined ? { additionalNotes } : {}),
						...(attachments.length > 0 ? { attachments } : {})
					}
				: undefined,
			schedulePreferences:
				complementary.preferredSchedule.length > 0
					? complementary.preferredSchedule.filter(Boolean)
					: undefined
		};
	}

	async function handleSubmit() {
		const v1 = step1Validate?.() ?? false;
		const v2 = step2Validate?.() ?? false;
		const v3 = step3Validate?.() ?? false;
		const v4 = step4Validate?.() ?? true;

		if (!v1) {
			currentStep = 1;
			return;
		}
		if (!v2) {
			currentStep = 2;
			return;
		}
		if (!v3) {
			currentStep = 3;
			return;
		}
		if (!v4) return;

		completedSteps = new Set([...completedSteps, 1, 2, 3, 4]);

		isSubmitting = true;

		await new Promise((resolve) => setTimeout(resolve, 1000));

		isSubmitting = false;
		submitted = true;
		clearDraft();
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
				<div class="success-btn">
					<Button
						variant="primary"
						onclick={() => (window.location.href = '/solicitacao')}
						loading={isSubmitting}
					>
						<span>+</span> Nova Solicitação
					</Button>
					<Button variant="outline" onclick={handleCancel} loading={isSubmitting}>
						<Icon iconName="home" />
						Ir para início</Button
					>
				</div>
			</div>
		{:else}
			{#if currentStep === 1}
				<StepIdentification
					bind:data={identification}
					bind:errors={step1Errors}
					onClearError={clearStep1Error}
					onvalidate={(fn) => (step1Validate = fn)}
				/>
			{:else if currentStep === 2}
				<StepDemand
					bind:data={demand}
					bind:errors={step2Errors}
					onClearError={clearStep2Error}
					onvalidate={(fn) => (step2Validate = fn)}
				/>
			{:else if currentStep === 3}
				<StepOperational
					bind:data={operational}
					bind:errors={step3Errors}
					onClearError={clearStep3Error}
					onvalidate={(fn) => (step3Validate = fn)}
				/>
			{:else if currentStep === 4}
				<StepComplementary
					bind:data={complementary}
					bind:errors={step4Errors}
					onClearError={clearStep4Error}
					onvalidate={(fn) => (step4Validate = fn)}
				/>
			{/if}

			<footer class="form-actions">
				<Button variant="outline-neutral" onclick={handleCancel}>Cancelar</Button>

				<div class="actions-right">
					{#if currentStep > 1}
						<Button variant="outline" onclick={handleBack}>
							<Icon iconName="arrowBack" iconSize="md" />
							Voltar</Button
						>
					{/if}

					{#if currentStep < 4}
						<Button variant="primary" onclick={handleNext}>
							Avançar
							<Icon iconName="arrowForward" iconSize="md" />
						</Button>
					{:else}
						<Button variant="primary" onclick={handleSubmit} loading={isSubmitting}>
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
	.success-btn {
		display: flex;
		text-align: center;
		gap: var(--spacing-md);
	}
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
