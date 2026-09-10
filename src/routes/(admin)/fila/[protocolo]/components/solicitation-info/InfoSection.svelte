<script lang="ts">
	import type { YesNoDetail, AdminRequestDetail } from '$lib/types/request';
	import { formatDate, formatDateTime } from '$lib/utils/dates';
	import Field from './field.svelte';
	import ToggleSection from './toggleSection.svelte';

	interface Props {
		solicitation: AdminRequestDetail;
	}

	let { solicitation }: Props = $props();

	function formatYesNoDetail(value: YesNoDetail | undefined): string {
		if (value === undefined) return '---';
		if (value === false) return 'Não';
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed === '') return 'Sim	';
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
			<Field label="Área do solicitante" value={solicitation.requester.area} />
			<Field label="Departamento" value={solicitation.requester.department} />
			<Field label="Gestor Responsável" value={solicitation.requester.manager} />
			<Field label="Contato adicional" value={solicitation.requester.additionalContact} />
		</div>
	</ToggleSection>

	<ToggleSection id="section-demand" title="DETALHES DA DEMANDA">
		<div class="grid">
			<Field label="Título Resumido" value={solicitation.demand.title} />
			<Field label="Categoria" value={solicitation.demand.category} />
			<Field label="Nome do Processo Atual" value={solicitation.demand.processName} />
			<Field label="Tipo de Solicitação" value={solicitation.demand.requestType} />
		</div>
		<div class="multiline-stack">
			<Field label="Descrição da necessidade" value={solicitation.demand.description} multiline />
			<Field label="Problema ou oportunidade" value={solicitation.demand.problem} multiline />
			<Field label="Resultado esperado" value={solicitation.demand.expectedResult} multiline />
			<Field
				label="Justificativa da solicitação"
				value={solicitation.demand.justification}
				multiline
			/>
		</div>
	</ToggleSection>

	<ToggleSection id="section-operational" title="INFORMAÇÕES OPERACIONAIS">
		<div class="grid">
			<Field label="Frequência de Execução" value={solicitation.operational.executionFrequency} />
			<Field label="Volumetria Aproximada" value={solicitation.operational.volumetry} />
			<Field
				label="Pessoas Envolvidas"
				value={formatPeople(solicitation.operational.peopleInvolved)}
			/>
			<Field
				label="Tempo Médio de Execução"
				value={solicitation.operational.averageExecutionTime}
			/>
			<Field
				label="Esforço Mensal (horas)"
				value={formatPeople(solicitation.operational.monthlyEffortHours)}
			/>
			<Field label="Sistemas Utilizados" value={solicitation.operational.systemsUsed} />
			<Field label="Impacto Operacional" value={solicitation.operational.operationalImpact} />
			<Field label="Criticidade Percebida" value={solicitation.operational.perceivedCriticality} />
			<Field label="Prazo Desejado" value={desiredDeadlineDisplay} />
			<Field
				label="Controles Manuais"
				value={formatYesNoDetail(solicitation.operational.hasManualControls)}
			/>
		</div>
		<div class="multiline-stack">
			<Field
				label="Descrição do Processo"
				value={solicitation.operational.processDescription}
				multiline
			/>
			<Field label="Etapas do Processo" value={solicitation.operational.processSteps} multiline />
			<Field label="Principais Riscos" value={solicitation.operational.mainRisks} multiline />
			<Field label="Impacto ao Cliente" value={solicitation.operational.clientImpact} multiline />
		</div>
	</ToggleSection>

	<ToggleSection id="section-complementary" title="INFORMAÇÕES COMPLEMENTARES">
		<div class="grid">
			<Field
				label="Possui Documentação de Processo"
				value={formatYesNoDetail(solicitation.complementary?.hasProcessDocumentation)}
			/>
			<Field
				label="Possui Solução Similar"
				value={formatYesNoDetail(solicitation.complementary?.hasSimilarSolution)}
			/>
			<Field
				label="Depende de Outras Áreas"
				value={formatYesNoDetail(solicitation.complementary?.dependsOnOtherAreas)}
			/>
			<Field
				label="Trata Dados Restritos"
				value={formatYesNoDetail(solicitation.complementary?.handlesRestrictedInfo)}
			/>
		</div>
		<div class="multiline-stack">
			<Field
				label="Observações Adicionais"
				value={solicitation.complementary?.additionalNotes}
				multiline
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
			{#if !solicitation.isSchedulingAllowed}
				<div class="scheduling-info" aria-disabled="true">
					Agendamento fora da Sprint — {solicitation.schedulingReason ??
						'Agendamento indisponível no momento'}
				</div>
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
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-md) var(--spacing-lg);
		margin-bottom: var(--spacing-md);
	}

	.multiline-stack {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
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

	.scheduling-info {
		margin-top: 12px;
		padding: 10px 12px;
		background: var(--status-yellow-bg);
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		font-family: var(--font-inter);
		font-size: 13px;
		color: var(--status-yellow);
	}

	.attachment-item {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: #fafafa;
		border: 1px solid var(--white-gray);
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
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
