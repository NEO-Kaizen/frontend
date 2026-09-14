<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import StepComplementary from './StepComplementary.svelte';
	import StepDemand from './StepDemand.svelte';
	import StepIdentification from './StepIdentification.svelte';
	import StepOperational from './StepOperational.svelte';
	import StepsForm from './StepsForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { submitDemand } from '$lib/services/request.service';
	import {
		clearDraft,
		loadDraft,
		saveDraft,
		type SolicitationDraft
	} from '$lib/services/solicitation-draft.service';
	import type {
		ComplementaryData,
		CreateRequestPayload,
		Criticality,
		DemandData,
		Frequency,
		IdentificationData,
		OperationalData,
		OperationalImpact,
		RequestType,
		YesNo,
		YesNoDetail
	} from '$lib/types/request';

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
	let submittedProtocol = $state('');
	let submitError = $state('');
	let protocolCopied = $state(false);

	// Categorias ativas do PortalConfig (Card 5) alimentam o select da etapa 2.
	// Opção usa `value` = id (string) e `label` = nome; o payload envia o id
	// numérico, pois o contrato trata id de categoria como número.
	let activeCategoryOptions = $derived(
		page.data.portalConfig.categories
			.filter((category) => category.isActive)
			.map((category) => ({ value: String(category.id), label: category.name }))
	);

	let copyTimeout: ReturnType<typeof setTimeout> | undefined;

	async function copyProtocol() {
		try {
			await navigator.clipboard.writeText(submittedProtocol);
			protocolCopied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => (protocolCopied = false), 2000);
		} catch {
			// Permissão de clipboard negada — o protocolo permanece visível na tela.
		}
	}

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

	type StepRef = { validate: () => boolean; clearErrors: () => void };

	let step1Ref = $state<StepRef>();
	let step2Ref = $state<StepRef>();
	let step3Ref = $state<StepRef>();
	let step4Ref = $state<StepRef>();

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

	let draft = $derived<SolicitationDraft>({
		version: 1,
		identification: { ...identification },
		demand: { ...demand },
		operational: { ...operational },
		complementary: {
			...complementary,
			preferredSchedule: [...complementary.preferredSchedule],
			// O binário (file) não é serializável — o rascunho guarda apenas metadados.
			files: complementary.files.map(({ id, fileName, mimeType, sizeBytes }) => ({
				id,
				fileName,
				mimeType,
				sizeBytes
			}))
		},
		currentStep,
		completedSteps: [...completedSteps],
		visitedSteps: [...visitedSteps]
	});

	$effect(() => {
		saveDraft(draft);
	});

	function validateCurrentStep(): boolean {
		if (currentStep === 1) return step1Ref?.validate() ?? false;
		if (currentStep === 2) return step2Ref?.validate() ?? false;
		if (currentStep === 3) return step3Ref?.validate() ?? false;
		return step4Ref?.validate() ?? true;
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
		goto(resolve('/'));
	}

	function resetForm() {
		clearDraft();
		currentStep = 1;
		completedSteps = new Set();
		visitedSteps = new Set([1]);
		submitted = false;
		isSubmitting = false;
		submittedProtocol = '';
		submitError = '';
		protocolCopied = false;
		clearTimeout(copyTimeout);
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
		step1Ref?.clearErrors();
		step2Ref?.clearErrors();
		step3Ref?.clearErrors();
		step4Ref?.clearErrors();
	}

	function toYesNoDetail(choice: YesNo | '', detail: string): YesNoDetail | undefined {
		if (!choice) return undefined;
		if (choice === 'Não') return false;
		const trimmed = detail.trim();
		return trimmed ? trimmed : undefined;
	}

	// Consumido pelo épico #52 — envio real via service.
	function buildPayload(): CreateRequestPayload {
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
			additionalNotes !== undefined;

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
				category: Number(demand.category),
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
						...(additionalNotes !== undefined ? { additionalNotes } : {})
					}
				: undefined,
			schedulePreferences:
				complementary.preferredSchedule.length > 0
					? complementary.preferredSchedule.filter(Boolean)
					: undefined
		};
	}

	async function handleSubmit() {
		const v1 = step1Ref?.validate() ?? false;
		const v2 = step2Ref?.validate() ?? false;
		const v3 = step3Ref?.validate() ?? false;
		const v4 = step4Ref?.validate() ?? true;

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
		submitError = '';

		// Binários presentes apenas na sessão atual — itens restaurados do
		// rascunho ficam com metadados e precisam ser reanexados.
		const attachments = complementary.files
			.map((entry) => entry.file)
			.filter((file): file is File => Boolean(file));

		const result = await submitDemand(buildPayload(), attachments);

		isSubmitting = false;

		if (result.ok) {
			submittedProtocol = result.data.protocol;
			submitted = true;
			clearDraft();
		} else {
			submitError = result.error.message;
		}
	}
</script>

<div class="form-container">
	<header class="form-header">
		<h1>Cadastre sua Solicitação</h1>
	</header>

	<StepsForm
		{steps}
		current={currentStep}
		{completedSteps}
		{visitedSteps}
		disabled={isSubmitting || submitted}
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
				<p class="success-protocol">
					Guarde o número do protocolo:
					<button
						type="button"
						class="protocol-copy"
						onclick={copyProtocol}
						title="Copiar protocolo"
					>
						{submittedProtocol}
						<Icon iconName="content_copy" />
					</button>
					{#if protocolCopied}
						<span class="copy-feedback" role="status">copiado</span>
					{/if}
				</p>
				<div class="success-btn">
					<Button variant="primary" onclick={resetForm} loading={isSubmitting}>
						<span>+</span> Nova Solicitação
					</Button>
					<Button variant="outline" onclick={handleCancel} loading={isSubmitting}>
						<Icon iconName="home" />
						Ir para início</Button
					>
				</div>
			</div>
		{:else}
			<div hidden={currentStep !== 1}>
				<StepIdentification bind:this={step1Ref} bind:data={identification} />
			</div>
			<div hidden={currentStep !== 2}>
				<StepDemand
					bind:this={step2Ref}
					bind:data={demand}
					categoryOptions={activeCategoryOptions}
				/>
			</div>
			<div hidden={currentStep !== 3}>
				<StepOperational bind:this={step3Ref} bind:data={operational} />
			</div>
			<div hidden={currentStep !== 4}>
				<StepComplementary bind:this={step4Ref} bind:data={complementary} />
			</div>

			{#if submitError}
				<p class="form-error" role="alert">{submitError}</p>
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
		gap: var(--spacing-md);
	}

	.form-header {
		text-align: center;
		display: flex;
		flex-direction: column;
	}

	.form-header h1 {
		font: var(--h1);
		color: var(--primary-color);
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

	.success-protocol {
		font: var(--paragrafo);
		color: var(--gray);
	}

	.protocol-copy {
		font: var(--label);
		color: var(--primary-color);
		letter-spacing: 0.05em;
	}

	.protocol-copy {
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		text-decoration: underline dotted transparent;
		transition: var(--transition-default);
	}

	.protocol-copy:hover {
		text-decoration-color: currentColor;
	}

	.protocol-copy:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.copy-feedback {
		font: var(--label);
		color: var(--status-green);
	}

	.form-error {
		margin: 0;
		font: var(--paragrafo);
		color: var(--status-red);
		text-align: right;
	}
</style>
