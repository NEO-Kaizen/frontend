<script lang="ts">
	import { page } from '$app/state';
	import type { YesNoDetail, InternalRequestDetail } from '$lib/types/request';
	import {
		CRITICALITY_OPTIONS,
		FREQUENCY_OPTIONS,
		IMPACT_OPTIONS,
		REQUEST_TYPE_OPTIONS
	} from '$lib/types/request';
	import { formatDate, formatDateTime } from '$lib/utils/dates';
	import Field from './Field.svelte';
	import ToggleSection from './ToggleSection.svelte';
	import YesNoDetailEditor from './YesNoDetailEditor.svelte';
	import { buildDirtyChecker, todayISO, type EditableDraft } from './edit-validation';

	interface Props {
		solicitation: InternalRequestDetail;
		isEditMode?: boolean;
		draft?: EditableDraft | null;
		errors?: Record<string, string>;
		onFieldChange?: (path: string, value: string) => void;
		onFieldBlur?: (path: string) => void;
	}

	let {
		solicitation,
		isEditMode = false,
		draft = null,
		errors = {},
		onFieldChange,
		onFieldBlur
	}: Props = $props();

	const categoryOptions = $derived(
		page.data.portalConfig.categories
			.filter((category) => category.isActive)
			.map((category) => ({ value: category.name, label: category.name }))
	);

	function formatYesNoDetail(value: YesNoDetail | undefined): string {
		if (value === undefined) return '---';
		if (value === false) return 'Não';
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed === '') return 'Sim';
			return `Sim — ${trimmed}`;
		}
		return '---';
	}

	function formatPeople(value: number | null | undefined): string {
		if (value === null || value === undefined) return '---';
		return String(value);
	}

	function formatSchedule(preferences: string[] | null): string {
		if (!preferences || preferences.length === 0) return '---';
		return preferences.map((p) => formatDateTime(p)).join('  •');
	}

	let desiredDeadlineDisplay = $derived(formatDate(solicitation.operational.desiredDeadline));
	let scheduleDisplay = $derived(formatSchedule(solicitation.schedulePreferences));
	let today = $derived(todayISO());
	let dirtyCheck = $derived(isEditMode && draft ? buildDirtyChecker(draft, solicitation) : null);

	function emit(path: string): (value: string) => void {
		return (value: string) => onFieldChange?.(path, value);
	}

	function emitBlur(path: string): () => void {
		return () => onFieldBlur?.(path);
	}

	function err(path: string): string {
		return errors[path] ?? '';
	}

	function isDirty(path: string): boolean {
		return dirtyCheck?.(path) ?? false;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="info-section">
	<ToggleSection id="section-requester" title="IDENTIFICAÇÃO DO SOLICITANTE" open={true}>
		<div class="grid">
			<Field label="Nome" value={solicitation.requester.fullName} />
			<Field label="Email Corporativo" value={solicitation.requester.corporateEmail} />
			<Field
				label="Área do solicitante"
				value={solicitation.requester.area}
				{isEditMode}
				editValue={draft?.requester.area ?? ''}
				error={err('requester.area')}
				dirty={isDirty('requester.area')}
				onEditInput={emit('requester.area')}
				onEditBlur={emitBlur('requester.area')}
			/>
			<Field
				label="Departamento"
				value={solicitation.requester.department}
				{isEditMode}
				editValue={draft?.requester.department ?? ''}
				error={err('requester.department')}
				dirty={isDirty('requester.department')}
				onEditInput={emit('requester.department')}
				onEditBlur={emitBlur('requester.department')}
			/>
			<Field
				label="Gestor Responsável"
				value={solicitation.requester.manager}
				{isEditMode}
				editValue={draft?.requester.manager ?? ''}
				error={err('requester.manager')}
				dirty={isDirty('requester.manager')}
				onEditInput={emit('requester.manager')}
				onEditBlur={emitBlur('requester.manager')}
			/>
			<Field
				label="Contato adicional"
				value={solicitation.requester.additionalContact}
				{isEditMode}
				editValue={draft?.requester.additionalContact ?? ''}
				error={err('requester.additionalContact')}
				dirty={isDirty('requester.additionalContact')}
				onEditInput={emit('requester.additionalContact')}
				onEditBlur={emitBlur('requester.additionalContact')}
			/>
		</div>
	</ToggleSection>

	<ToggleSection id="section-demand" title="DETALHES DA DEMANDA">
		<div class="grid">
			<Field
				label="Título Resumido"
				value={solicitation.demand.title}
				{isEditMode}
				maxlength={150}
				editValue={draft?.demand.title ?? ''}
				error={err('demand.title')}
				dirty={isDirty('demand.title')}
				onEditInput={emit('demand.title')}
				onEditBlur={emitBlur('demand.title')}
			/>
			<Field
				label="Categoria"
				value={solicitation.demand.category}
				{isEditMode}
				kind="select"
				options={categoryOptions}
				editValue={draft?.demand.category ?? ''}
				error={err('demand.category')}
				dirty={isDirty('demand.category')}
				onEditInput={emit('demand.category')}
				onEditBlur={emitBlur('demand.category')}
			/>
			<Field
				label="Nome do Processo Atual"
				value={solicitation.demand.processName}
				{isEditMode}
				maxlength={150}
				editValue={draft?.demand.processName ?? ''}
				error={err('demand.processName')}
				dirty={isDirty('demand.processName')}
				onEditInput={emit('demand.processName')}
				onEditBlur={emitBlur('demand.processName')}
			/>
			<Field
				label="Tipo de Solicitação"
				value={solicitation.demand.requestType}
				{isEditMode}
				kind="select"
				options={REQUEST_TYPE_OPTIONS}
				editValue={draft?.demand.requestType ?? ''}
				error={err('demand.requestType')}
				dirty={isDirty('demand.requestType')}
				onEditInput={emit('demand.requestType')}
				onEditBlur={emitBlur('demand.requestType')}
			/>
		</div>
		<div class="multiline-stack">
			<Field
				label="Descrição da necessidade"
				value={solicitation.demand.description}
				multiline
				{isEditMode}
				kind="textarea"
				rows={5}
				maxlength={4000}
				editValue={draft?.demand.description ?? ''}
				error={err('demand.description')}
				dirty={isDirty('demand.description')}
				onEditInput={emit('demand.description')}
				onEditBlur={emitBlur('demand.description')}
			/>
			<Field
				label="Problema ou oportunidade"
				value={solicitation.demand.problem}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={4000}
				editValue={draft?.demand.problem ?? ''}
				error={err('demand.problem')}
				dirty={isDirty('demand.problem')}
				onEditInput={emit('demand.problem')}
				onEditBlur={emitBlur('demand.problem')}
			/>
			<Field
				label="Resultado esperado"
				value={solicitation.demand.expectedResult}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={4000}
				editValue={draft?.demand.expectedResult ?? ''}
				error={err('demand.expectedResult')}
				dirty={isDirty('demand.expectedResult')}
				onEditInput={emit('demand.expectedResult')}
				onEditBlur={emitBlur('demand.expectedResult')}
			/>
			<Field
				label="Justificativa da solicitação"
				value={solicitation.demand.justification}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={4000}
				editValue={draft?.demand.justification ?? ''}
				error={err('demand.justification')}
				dirty={isDirty('demand.justification')}
				onEditInput={emit('demand.justification')}
				onEditBlur={emitBlur('demand.justification')}
			/>
		</div>
	</ToggleSection>

	<ToggleSection id="section-operational" title="INFORMAÇÕES OPERACIONAIS">
		<div class="grid">
			<Field
				label="Frequência de Execução"
				value={solicitation.operational.executionFrequency}
				{isEditMode}
				kind="select"
				options={FREQUENCY_OPTIONS}
				editValue={draft?.operational.executionFrequency ?? ''}
				error={err('operational.executionFrequency')}
				dirty={isDirty('operational.executionFrequency')}
				onEditInput={emit('operational.executionFrequency')}
				onEditBlur={emitBlur('operational.executionFrequency')}
			/>
			<Field
				label="Volumetria Aproximada"
				value={solicitation.operational.volumetry}
				{isEditMode}
				maxlength={100}
				editValue={draft?.operational.volumetry ?? ''}
				error={err('operational.volumetry')}
				dirty={isDirty('operational.volumetry')}
				onEditInput={emit('operational.volumetry')}
				onEditBlur={emitBlur('operational.volumetry')}
			/>
			<Field
				label="Pessoas Envolvidas"
				value={formatPeople(solicitation.operational.peopleInvolved)}
				{isEditMode}
				kind="number"
				min="1"
				step="1"
				editValue={draft?.operational.peopleInvolved ?? ''}
				error={err('operational.peopleInvolved')}
				dirty={isDirty('operational.peopleInvolved')}
				onEditInput={emit('operational.peopleInvolved')}
				onEditBlur={emitBlur('operational.peopleInvolved')}
			/>
			<Field
				label="Tempo Médio de Execução"
				value={solicitation.operational.averageExecutionTime}
				{isEditMode}
				maxlength={60}
				editValue={draft?.operational.averageExecutionTime ?? ''}
				error={err('operational.averageExecutionTime')}
				dirty={isDirty('operational.averageExecutionTime')}
				onEditInput={emit('operational.averageExecutionTime')}
				onEditBlur={emitBlur('operational.averageExecutionTime')}
			/>
			<Field
				label="Esforço Mensal (horas)"
				value={formatPeople(solicitation.operational.monthlyEffortHours)}
				{isEditMode}
				kind="number"
				min="0"
				step="0.1"
				editValue={draft?.operational.monthlyEffortHours ?? ''}
				error={err('operational.monthlyEffortHours')}
				dirty={isDirty('operational.monthlyEffortHours')}
				onEditInput={emit('operational.monthlyEffortHours')}
				onEditBlur={emitBlur('operational.monthlyEffortHours')}
			/>
			<Field
				label="Sistemas Utilizados"
				value={solicitation.operational.systemsUsed}
				{isEditMode}
				maxlength={255}
				editValue={draft?.operational.systemsUsed ?? ''}
				error={err('operational.systemsUsed')}
				dirty={isDirty('operational.systemsUsed')}
				onEditInput={emit('operational.systemsUsed')}
				onEditBlur={emitBlur('operational.systemsUsed')}
			/>
			<Field
				label="Impacto Operacional"
				value={solicitation.operational.operationalImpact}
				{isEditMode}
				kind="select"
				options={IMPACT_OPTIONS}
				editValue={draft?.operational.operationalImpact ?? ''}
				error={err('operational.operationalImpact')}
				dirty={isDirty('operational.operationalImpact')}
				onEditInput={emit('operational.operationalImpact')}
				onEditBlur={emitBlur('operational.operationalImpact')}
			/>
			<Field
				label="Criticidade Percebida"
				value={solicitation.operational.perceivedCriticality}
				{isEditMode}
				kind="select"
				options={CRITICALITY_OPTIONS}
				editValue={draft?.operational.perceivedCriticality ?? ''}
				error={err('operational.perceivedCriticality')}
				dirty={isDirty('operational.perceivedCriticality')}
				onEditInput={emit('operational.perceivedCriticality')}
				onEditBlur={emitBlur('operational.perceivedCriticality')}
			/>
			<Field
				label="Prazo Desejado"
				value={desiredDeadlineDisplay}
				{isEditMode}
				kind="date"
				min={today}
				editValue={draft?.operational.desiredDeadline ?? ''}
				error={err('operational.desiredDeadline')}
				dirty={isDirty('operational.desiredDeadline')}
				onEditInput={emit('operational.desiredDeadline')}
				onEditBlur={emitBlur('operational.desiredDeadline')}
			/>
		</div>
		<div class="yesno-pair-row">
			<YesNoDetailEditor
				label="Controles Manuais"
				display={formatYesNoDetail(solicitation.operational.hasManualControls)}
				value={draft?.operational.hasManualControls}
				{isEditMode}
				detailLabel="Detalhamento dos controles manuais"
				choiceError={err('operational.hasManualControls')}
				detailError={err('operational.hasManualControlsDetail')}
				choiceDirty={isDirty('operational.hasManualControls')}
				detailDirty={isDirty('operational.hasManualControlsDetail')}
				onChoiceInput={emit('operational.hasManualControls')}
				onDetailInput={emit('operational.hasManualControlsDetail')}
				onChoiceBlur={emitBlur('operational.hasManualControls')}
				onDetailBlur={emitBlur('operational.hasManualControlsDetail')}
			/>
		</div>
		<div class="multiline-stack">
			<Field
				label="Descrição do Processo"
				value={solicitation.operational.processDescription}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={4000}
				editValue={draft?.operational.processDescription ?? ''}
				error={err('operational.processDescription')}
				dirty={isDirty('operational.processDescription')}
				onEditInput={emit('operational.processDescription')}
				onEditBlur={emitBlur('operational.processDescription')}
			/>
			<Field
				label="Etapas do Processo"
				value={solicitation.operational.processSteps}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={4000}
				editValue={draft?.operational.processSteps ?? ''}
				error={err('operational.processSteps')}
				dirty={isDirty('operational.processSteps')}
				onEditInput={emit('operational.processSteps')}
				onEditBlur={emitBlur('operational.processSteps')}
			/>
			<Field
				label="Principais Riscos"
				value={solicitation.operational.mainRisks}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={2000}
				editValue={draft?.operational.mainRisks ?? ''}
				error={err('operational.mainRisks')}
				dirty={isDirty('operational.mainRisks')}
				onEditInput={emit('operational.mainRisks')}
				onEditBlur={emitBlur('operational.mainRisks')}
			/>
			<Field
				label="Impacto ao Cliente"
				value={solicitation.operational.clientImpact}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={2000}
				editValue={draft?.operational.clientImpact ?? ''}
				error={err('operational.clientImpact')}
				dirty={isDirty('operational.clientImpact')}
				onEditInput={emit('operational.clientImpact')}
				onEditBlur={emitBlur('operational.clientImpact')}
			/>
		</div>
	</ToggleSection>

	<ToggleSection id="section-complementary" title="INFORMAÇÕES COMPLEMENTARES">
		<div class="grid">
			<YesNoDetailEditor
				label="Possui Documentação de Processo"
				display={formatYesNoDetail(solicitation.complementary?.hasProcessDocumentation)}
				value={draft?.complementary?.hasProcessDocumentation}
				{isEditMode}
				optional
				detailLabel="Detalhes da documentação"
				choiceError={err('complementary.hasProcessDocumentation')}
				detailError={err('complementary.hasProcessDocumentationDetail')}
				choiceDirty={isDirty('complementary.hasProcessDocumentation')}
				detailDirty={isDirty('complementary.hasProcessDocumentationDetail')}
				onChoiceInput={emit('complementary.hasProcessDocumentation')}
				onDetailInput={emit('complementary.hasProcessDocumentationDetail')}
				onChoiceBlur={emitBlur('complementary.hasProcessDocumentation')}
				onDetailBlur={emitBlur('complementary.hasProcessDocumentationDetail')}
			/>
			<YesNoDetailEditor
				label="Possui Solução Similar"
				display={formatYesNoDetail(solicitation.complementary?.hasSimilarSolution)}
				value={draft?.complementary?.hasSimilarSolution}
				{isEditMode}
				optional
				detailLabel="Detalhes da solução semelhante"
				choiceError={err('complementary.hasSimilarSolution')}
				detailError={err('complementary.hasSimilarSolutionDetail')}
				choiceDirty={isDirty('complementary.hasSimilarSolution')}
				detailDirty={isDirty('complementary.hasSimilarSolutionDetail')}
				onChoiceInput={emit('complementary.hasSimilarSolution')}
				onDetailInput={emit('complementary.hasSimilarSolutionDetail')}
				onChoiceBlur={emitBlur('complementary.hasSimilarSolution')}
				onDetailBlur={emitBlur('complementary.hasSimilarSolutionDetail')}
			/>
			<YesNoDetailEditor
				label="Depende de Outras Áreas"
				display={formatYesNoDetail(solicitation.complementary?.dependsOnOtherAreas)}
				value={draft?.complementary?.dependsOnOtherAreas}
				{isEditMode}
				optional
				detailLabel="Quais áreas?"
				choiceError={err('complementary.dependsOnOtherAreas')}
				detailError={err('complementary.dependsOnOtherAreasDetail')}
				choiceDirty={isDirty('complementary.dependsOnOtherAreas')}
				detailDirty={isDirty('complementary.dependsOnOtherAreasDetail')}
				onChoiceInput={emit('complementary.dependsOnOtherAreas')}
				onDetailInput={emit('complementary.dependsOnOtherAreasDetail')}
				onChoiceBlur={emitBlur('complementary.dependsOnOtherAreas')}
				onDetailBlur={emitBlur('complementary.dependsOnOtherAreasDetail')}
			/>
			<YesNoDetailEditor
				label="Trata Dados Restritos"
				display={formatYesNoDetail(solicitation.complementary?.handlesRestrictedInfo)}
				value={draft?.complementary?.handlesRestrictedInfo}
				{isEditMode}
				optional
				detailLabel="Detalhes de LGPD/Sigilo"
				choiceError={err('complementary.handlesRestrictedInfo')}
				detailError={err('complementary.handlesRestrictedInfoDetail')}
				choiceDirty={isDirty('complementary.handlesRestrictedInfo')}
				detailDirty={isDirty('complementary.handlesRestrictedInfoDetail')}
				onChoiceInput={emit('complementary.handlesRestrictedInfo')}
				onDetailInput={emit('complementary.handlesRestrictedInfoDetail')}
				onChoiceBlur={emitBlur('complementary.handlesRestrictedInfo')}
				onDetailBlur={emitBlur('complementary.handlesRestrictedInfoDetail')}
			/>
		</div>
		<div class="multiline-stack">
			<Field
				label="Observações Adicionais"
				value={solicitation.complementary?.additionalNotes}
				multiline
				{isEditMode}
				kind="textarea"
				maxlength={2000}
				editValue={draft?.complementary?.additionalNotes ?? ''}
				error={err('complementary.additionalNotes')}
				dirty={isDirty('complementary.additionalNotes')}
				onEditInput={emit('complementary.additionalNotes')}
				onEditBlur={emitBlur('complementary.additionalNotes')}
			/>
		</div>

		<div class="sub-block">
			<p class="sub-title">Preferências de Horários</p>
			{#if solicitation.schedulePreferences && solicitation.schedulePreferences.length > 0}
				<ul class="schedule-list">
					{#each solicitation.schedulePreferences as pref (pref)}
						<li class="schedule-item">{formatDateTime(pref)}</li>
					{/each}
				</ul>
			{:else}
				<p class="fallback-text">{scheduleDisplay}</p>
			{/if}
		</div>

		<div class="sub-block">
			<p class="sub-title">Anexos</p>
			{#if solicitation.attachments.length === 0}
				<p class="fallback-text">Nenhum anexo enviado — ---</p>
			{:else}
				<ul class="attachments-list">
					{#each solicitation.attachments as attachment (attachment.fileName)}
						<li class="attachment-item">
							<span class="attachment-name">{attachment.fileName}</span>
							<span class="attachment-meta"
								>{attachment.mimeType} • {formatBytes(attachment.sizeBytes)}</span
							>
							{#if attachment.canDownload && attachment.downloadUrl}
								<a
									href={attachment.downloadUrl}
									target="_blank"
									rel="external noopener noreferrer"
									class="attachment-link"
								>
									Visualizar
								</a>
							{:else}
								<button
									type="button"
									class="attachment-link disabled"
									disabled
									title="Download indisponível"
									aria-disabled="true"
								>
									Download indisponível
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="meta-footer">
			<div class="grid">
				<Field label="Data de Abertura" value={formatDateTime(solicitation.openedAt)} />
				<Field label="Última Atualização" value={formatDateTime(solicitation.lastUpdate)} />
				{#if solicitation.mappingDate}
					<Field label="Data de Mapeamento" value={formatDate(solicitation.mappingDate)} />
				{/if}
				{#if solicitation.meeting}
					<Field
						label="Reunião Agendada"
						value={formatDateTime(solicitation.meeting.scheduledFor)}
					/>
				{/if}
				<Field label="Responsável Atual" value={solicitation.assignee?.name ?? 'Não atribuído'} />
			</div>
		</div>
	</ToggleSection>
</div>

<style>
	.info-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md) var(--spacing-lg);
		margin-bottom: var(--spacing-md);
		align-items: start;
	}

	.yesno-pair-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-md) var(--spacing-lg);
		margin-bottom: var(--spacing-md);
		align-items: start;
	}

	/* Quando em modo leitura o YesNoDetailEditor renderiza um único Field,
	   o wrapper precisa colapsar para não criar coluna vazia. */
	.yesno-pair-row:empty {
		display: none;
	}

	.multiline-stack {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		min-width: 0;
	}

	.sub-block {
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--white-gray);
	}

	.sub-title {
		font-family: var(--font-inter);
		font-size: 12px;
		font-weight: 700;
		color: var(--black);
		letter-spacing: 0.02em;
		margin: 0 0 8px 0;
	}

	.fallback-text {
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--gray);
		margin: 0;
	}

	.schedule-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.attachments-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12px;
	}

	.schedule-item {
		font-family: var(--font-inter);
		font-size: 14px;
		color: var(--black);
	}

	.attachment-item {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: var(--surface);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		flex: 0 0 auto;
		width: auto;
		max-width: 100%;
	}

	.attachment-name {
		font-family: var(--font-inter);
		font-size: 14px;
		font-weight: 600;
		color: var(--black);
	}

	.attachment-meta {
		font-family: var(--font-inter);
		font-size: 12px;
		color: var(--gray);
	}

	.attachment-link {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 600;
		color: var(--secondary-color);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.attachment-link:hover {
		text-decoration: underline;
	}

	.attachment-link.disabled {
		color: var(--gray);
		cursor: not-allowed;
		text-decoration: none;
		opacity: 0.7;
	}

	.meta-footer {
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--white-gray);
	}

	@media (max-width: 768px) {
		.grid,
		.yesno-pair-row {
			grid-template-columns: 1fr;
		}
	}
</style>
