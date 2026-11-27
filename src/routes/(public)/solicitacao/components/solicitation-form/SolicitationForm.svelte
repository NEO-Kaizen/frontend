<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import DuplicateAlert from './DuplicateAlert.svelte';
	import DuplicateAlertModal from './DuplicateAlertModal.svelte';
	import StepComplementary from './StepComplementary.svelte';
	import StepDemand from './StepDemand.svelte';
	import StepIdentification from './StepIdentification.svelte';
	import StepOperational from './StepOperational.svelte';
	import StepsForm from './StepsForm.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { checkDemandDuplicates } from '$lib/services/duplicate.service';
	import { clearProtocol, loadProtocol, saveProtocol } from '$lib/services/last-protocol.service';
	import { submitDemand } from '$lib/services/request.service';
	import {
		clearDraft,
		loadDraft,
		saveDraft,
		type SolicitationDraft
	} from '$lib/services/solicitation-draft.service';
	import type { SessionUser } from '$lib/types/auth';
	import type { DuplicateCheckResponse } from '$lib/types/duplicate';
	import type { SolicitationMode } from '$lib/types/portal-config';
	import type { RequesterProfileBlock } from '$lib/types/user';
	import type {
		ComplementaryData,
		CreateRequestPayload,
		Criticality,
		DemandBlock,
		DemandData,
		Frequency,
		IdentificationData,
		OperationalData,
		OperationalImpact,
		RequestCategory,
		RequestType,
		YesNo,
		YesNoDetail
	} from '$lib/types/request';

	interface Props {
		user?: SessionUser | null;
		requesterProfile?: RequesterProfileBlock | null;
		solicitationMode: SolicitationMode;
		categoryOptions?: { value: string; label: string }[];
	}

	let {
		user = null,
		requesterProfile = null,
		solicitationMode,
		categoryOptions = []
	}: Props = $props();

	const hasSession = $derived(Boolean(user));
	const shouldLockIdentity = $derived(solicitationMode === 'AUTHENTICATED' && hasSession);
	const lockedRequesterFields = $derived.by(() => {
		const fields: (keyof IdentificationData)[] = [];
		if (requesterProfile?.area?.trim()) fields.push('area');
		if (requesterProfile?.department?.trim()) fields.push('department');
		if (requesterProfile?.manager?.trim()) fields.push('manager');
		return fields;
	});
	const lockedFieldsForStep1 = $derived.by(() => {
		const base: (keyof IdentificationData)[] = shouldLockIdentity
			? ['fullName', 'corporateEmail']
			: [];
		return [...base, ...lockedRequesterFields];
	});

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

	// Alerta de duplicidade (RF16): estado transitório da tela, fora do rascunho
	// do localStorage. A consulta roda só ao concluir a aba de Demanda.
	let duplicateAlert = $state<DuplicateCheckResponse | null>(null);
	let duplicateCheckKey = $state('');
	let duplicateRequestId = 0;
	let isCheckingDuplicates = $state(false);
	let isDuplicateDialogOpen = $state(false);

	const currentDemandKey = $derived(JSON.stringify(buildDemandBlock()));
	// Alerta só vale para a Demanda consultada: editar qualquer campo o remove
	// da tela até a próxima checagem.
	const activeDuplicateAlert = $derived(
		duplicateAlert && currentDemandKey === duplicateCheckKey ? duplicateAlert : null
	);
	const highConfidenceItems = $derived(
		activeDuplicateAlert?.confidence === 'high' ? activeDuplicateAlert.items.slice(0, 3) : []
	);
	const mediumConfidenceItems = $derived(
		activeDuplicateAlert?.confidence === 'medium' ? activeDuplicateAlert.items.slice(0, 5) : []
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

	function getSessionIdentity(): Pick<IdentificationData, 'fullName' | 'corporateEmail'> {
		return hasSession
			? { fullName: user?.name ?? '', corporateEmail: user?.email ?? '' }
			: { fullName: '', corporateEmail: '' };
	}

	// Dados de solicitante salvos em "Meus dados" — pré-preenchem a etapa 1
	// quando o rascunho não tem valor para o campo.
	function getProfileRequester(): Pick<
		IdentificationData,
		'area' | 'department' | 'manager' | 'additionalContact'
	> {
		return {
			area: requesterProfile?.area ?? '',
			department: requesterProfile?.department ?? '',
			manager: requesterProfile?.manager ?? '',
			additionalContact: requesterProfile?.additionalContact ?? ''
		};
	}

	let identification = $state<IdentificationData>({
		...getSessionIdentity(),
		...getProfileRequester()
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

	function hydrateFromDraft(): void {
		const draft = loadDraft(user?.id ?? null);
		if (!draft) return;

		currentStep = draft.currentStep;
		completedSteps = new Set(draft.completedSteps);
		visitedSteps = new Set(draft.visitedSteps);

		// O rascunho manda; o perfil preenche apenas os campos ainda vazios.
		const fromProfile = getProfileRequester();
		const merged: IdentificationData = {
			...draft.identification,
			area: draft.identification.area || fromProfile.area,
			department: draft.identification.department || fromProfile.department,
			manager: draft.identification.manager || fromProfile.manager,
			additionalContact: draft.identification.additionalContact || fromProfile.additionalContact
		};

		// Campos travados pelo perfil ignoram valores antigos do rascunho — o
		// perfil é a fonte de verdade (admin pode tê-los alterado após o rascunho).
		if (lockedRequesterFields.includes('area')) merged.area = fromProfile.area;
		if (lockedRequesterFields.includes('department')) merged.department = fromProfile.department;
		if (lockedRequesterFields.includes('manager')) merged.manager = fromProfile.manager;

		identification = shouldLockIdentity ? { ...merged, ...getSessionIdentity() } : merged;
		demand = draft.demand;
		operational = draft.operational;
		complementary = draft.complementary;
	}

	// Restaura a tela de sucesso após reload: o protocolo da última solicitação
	// persiste na sessão (issue #147). Sem rascunho ativo, mostra a solicitação
	// enviada — com o CTA de acompanhamento.
	function restoreSubmittedScreen(): void {
		const userId = user?.id ?? null;
		const restoredProtocol = loadProtocol();
		if (!loadDraft(userId) && restoredProtocol) {
			submitted = true;
			submittedProtocol = restoredProtocol;
		}
	}

	if (browser) {
		hydrateFromDraft();
		restoreSubmittedScreen();
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
		// Não grava rascunho após o envio (ou restauração da tela de sucesso):
		// senão um rascunho vazio sobrescreveria a sessão no reload.
		if (!submitted) saveDraft(draft, user?.id ?? null);
	});

	function validateCurrentStep(): boolean {
		if (currentStep === 1) return step1Ref?.validate() ?? false;
		if (currentStep === 2) return step2Ref?.validate() ?? false;
		if (currentStep === 3) return step3Ref?.validate() ?? false;
		return step4Ref?.validate() ?? true;
	}

	function advanceFromCurrentStep(): void {
		completedSteps = new Set([...completedSteps, currentStep]);
		const nextStep = currentStep + 1;
		visitedSteps = new Set([...visitedSteps, nextStep]);
		currentStep = nextStep;
	}

	function buildDemandBlock(): DemandBlock {
		return {
			title: demand.title.trim(),
			category: demand.category as RequestCategory,
			processName: demand.processName.trim(),
			requestType: demand.requestType as RequestType,
			description: demand.description.trim(),
			problem: demand.problem.trim(),
			justification: demand.justification.trim(),
			expectedResult: demand.expectedResult.trim()
		};
	}

	function resetDuplicateState(): void {
		duplicateRequestId += 1;
		duplicateAlert = null;
		duplicateCheckKey = '';
		isCheckingDuplicates = false;
		isDuplicateDialogOpen = false;
	}

	// Decide se a aba de Demanda pode ser concluída. Retorna `false` quando a
	// alta bloqueia (modal aberto) ou quando a média acabou de aparecer para
	// leitura; nesses casos um novo clique repete a decisão sem nova consulta.
	async function canLeaveDemandStep(): Promise<boolean> {
		const demandBlock = buildDemandBlock();
		const demandKey = JSON.stringify(demandBlock);

		if (duplicateAlert && demandKey === duplicateCheckKey) {
			if (duplicateAlert.confidence === 'high') {
				isDuplicateDialogOpen = true;
				return false;
			}
			if (duplicateAlert.confidence === 'medium') {
				duplicateAlert = null;
				return true;
			}
		}

		const requestId = ++duplicateRequestId;
		isCheckingDuplicates = true;
		duplicateAlert = null;
		duplicateCheckKey = demandKey;

		const result = await checkDemandDuplicates(demandBlock);

		// Cancelar/resetar ou uma nova checagem tornam esta resposta obsoleta.
		if (requestId !== duplicateRequestId) return false;

		isCheckingDuplicates = false;

		// A Demanda mudou ou a etapa não é mais a atual: descarta a resposta.
		if (currentStep !== 2 || JSON.stringify(buildDemandBlock()) !== demandKey) return false;

		// Falha de rede/500 degrada para "sem alerta" e não bloqueia o cadastro.
		if (!result.ok || result.data.items.length === 0) return true;

		if (result.data.confidence === 'high') {
			duplicateAlert = result.data;
			isDuplicateDialogOpen = true;
			return false;
		}

		if (result.data.confidence === 'medium') {
			duplicateAlert = result.data;
			return false;
		}

		return true;
	}

	async function handleNext() {
		if (isCheckingDuplicates) return;
		if (!validateCurrentStep()) return;

		if (currentStep === 2) {
			if (await canLeaveDemandStep()) advanceFromCurrentStep();
			return;
		}

		advanceFromCurrentStep();
	}

	function handleReviewDuplicates(): void {
		isDuplicateDialogOpen = false;
	}

	function handleCreateDespiteDuplicates(): void {
		isDuplicateDialogOpen = false;
		resetDuplicateState();
		advanceFromCurrentStep();
	}

	function handleBack() {
		if (isCheckingDuplicates) return;
		if (currentStep > 1) {
			currentStep = currentStep - 1;
		}
	}

	async function handleStepClick(stepId: number) {
		if (isCheckingDuplicates) return;
		if (!visitedSteps.has(stepId)) return;

		// Qualquer salto para depois da Demanda passa pela aba 2: valida o bloco
		// e respeita o Alerta de duplicidade, mesmo vindo da etapa 1.
		if (stepId > 2 && currentStep < 3) {
			currentStep = 2;
			if (!validateCurrentStep()) return;
			if (!(await canLeaveDemandStep())) return;
			currentStep = stepId;
			return;
		}

		currentStep = stepId;
	}

	function handleCancel() {
		resetForm();
		goto(resolve('/'));
	}

	async function goToSolicitation() {
		if (!submittedProtocol) return;
		await goto(resolve('/(public)/acompanhar/[protocolo]', { protocolo: submittedProtocol }));
	}

	function resetForm() {
		clearDraft(user?.id ?? null);
		clearProtocol();
		resetDuplicateState();
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
			...getSessionIdentity(),
			...getProfileRequester()
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

		const requesterIdentity = shouldLockIdentity
			? { fullName: user?.name ?? '', corporateEmail: user?.email ?? '' }
			: {
					fullName: identification.fullName.trim(),
					corporateEmail: identification.corporateEmail.trim()
				};

		return {
			requester: {
				...requesterIdentity,
				area: identification.area.trim(),
				department: identification.department.trim() || undefined,
				manager: identification.manager.trim(),
				additionalContact: identification.additionalContact.trim() || undefined
			},
			demand: buildDemandBlock(),
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
			clearDraft(user?.id ?? null);
			saveProtocol(result.data.protocol);
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
		disabled={isSubmitting || submitted || isCheckingDuplicates}
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
				{#if submittedProtocol}
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
				{:else}
					<p class="success-protocol">Você pode acompanhar o andamento na página inicial.</p>
				{/if}
				<div class="success-btn">
					{#if submittedProtocol}
						<Button variant="primary" onclick={goToSolicitation}>Ver Solicitação</Button>
					{/if}
					<Button variant="outline" onclick={handleCancel} loading={isSubmitting}>
						<Icon iconName="home" />
						Ir para início</Button
					>
				</div>
			</div>
		{:else}
			<div hidden={currentStep !== 1}>
				<StepIdentification
					bind:this={step1Ref}
					bind:data={identification}
					lockedFields={lockedFieldsForStep1}
				/>
			</div>
			<div hidden={currentStep !== 2}>
				<StepDemand bind:this={step2Ref} bind:data={demand} {categoryOptions} />

				<div class="duplicate-live" aria-live="polite" aria-atomic="true">
					{#if mediumConfidenceItems.length > 0}
						<DuplicateAlert items={mediumConfidenceItems} />
					{/if}
				</div>
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
				<Button variant="outline-neutral" onclick={handleCancel} disabled={isCheckingDuplicates}>
					Cancelar
				</Button>

				<div class="actions-right" aria-busy={isCheckingDuplicates}>
					{#if currentStep > 1}
						<Button variant="outline" onclick={handleBack} disabled={isCheckingDuplicates}>
							<Icon iconName="arrowBack" iconSize="md" />
							Voltar</Button
						>
					{/if}

					{#if currentStep < 4}
						<Button variant="primary" onclick={handleNext}>
							{#if isCheckingDuplicates}
								Verificando…
							{:else}
								Avançar
								<Icon iconName="arrowForward" iconSize="md" />
							{/if}
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

	{#if !submitted && isDuplicateDialogOpen && highConfidenceItems.length > 0}
		<DuplicateAlertModal
			items={highConfidenceItems}
			onreview={handleReviewDuplicates}
			oncontinue={handleCreateDespiteDuplicates}
		/>
	{/if}
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
		color: var(--heading-color);
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
