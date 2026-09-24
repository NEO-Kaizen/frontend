<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { formatDate, formatDateTime } from '$lib/utils/dates';
	import type {
		PublicRequestDetails,
		RequesterAttachment,
		RequesterRequestDetails
	} from '$lib/types/requester-tracking';
	import Field from '../../../../(admin)/fila/[protocolo]/components/solicitation-info/Field.svelte';
	import ToggleSection from '../../../../(admin)/fila/[protocolo]/components/solicitation-info/ToggleSection.svelte';

	interface Props {
		details: PublicRequestDetails | RequesterRequestDetails;
		mode: 'public' | 'authenticated';
	}

	let { details, mode }: Props = $props();

	function isAuthenticated(
		value: PublicRequestDetails | RequesterRequestDetails
	): value is RequesterRequestDetails {
		return mode === 'authenticated' && 'operational' in value;
	}

	function formatYesNoDetail(value: false | string | undefined): string {
		if (value === undefined) return '---';
		if (value === false) return 'Não';
		const trimmed = value.trim();
		if (trimmed === '') return 'Sim';
		return `Sim — ${trimmed}`;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function attachmentHref(attachment: RequesterAttachment): string {
		// URLs do backend (`/requests/...`) vivem em outra origem — prefixar a
		// API. Mocks (`/mocks/...`) são relativos ao próprio frontend.
		if (attachment.downloadUrl.startsWith('/requests/')) {
			return `${env.PUBLIC_API_URL}${attachment.downloadUrl}`;
		}
		return attachment.downloadUrl;
	}

	function formatSchedule(preferences: string[] | null): string {
		if (!preferences || preferences.length === 0) return '---';
		return preferences.map((p) => formatDateTime(p)).join('  •  ');
	}
</script>

<div class="requester-details">
	{#if details.lastTechnicalMessage && details.lastTechnicalMessage.trim() !== ''}
		<ToggleSection id="tracking-return" title="RETORNO DA EQUIPE" open={true}>
			<Field label="Mensagem da equipe" value={details.lastTechnicalMessage} multiline />
		</ToggleSection>
	{/if}
	<ToggleSection id="tracking-requester" title="IDENTIFICAÇÃO DO SOLICITANTE" open={true}>
		<div class="grid">
			<Field label="Nome" value={details.requester.fullName} />
			<Field label="Email Corporativo" value={details.requester.corporateEmail} />
			<Field label="Área do solicitante" value={details.requester.area} />
			<Field label="Departamento" value={details.requester.department} />
			<Field label="Gestor Responsável" value={details.requester.manager} />
			<Field label="Contato adicional" value={details.requester.additionalContact} />
		</div>
	</ToggleSection>

	<ToggleSection id="tracking-demand" title="DETALHES DA DEMANDA" open={true}>
		<div class="grid">
			<Field label="Título Resumido" value={details.demand.title} />
			<Field label="Categoria" value={details.demand.category} />
			<Field label="Nome do Processo Atual" value={details.demand.processName} />
			<Field label="Tipo de Solicitação" value={details.demand.requestType} />
		</div>
		<div class="multiline-stack">
			<Field label="Descrição da necessidade" value={details.demand.description} multiline />
			<Field label="Problema ou oportunidade" value={details.demand.problem} multiline />
			<Field label="Resultado esperado" value={details.demand.expectedResult} multiline />
			<Field label="Justificativa da solicitação" value={details.demand.justification} multiline />
		</div>
	</ToggleSection>

	{#if isAuthenticated(details)}
		<ToggleSection id="tracking-operational" title="PROCESSO ATUAL" open={false}>
			<div class="grid">
				<Field label="Frequência de Execução" value={details.operational.executionFrequency} />
				<Field label="Volumetria Aproximada" value={details.operational.volumetry} />
				<Field label="Pessoas Envolvidas" value={details.operational.peopleInvolved ?? '---'} />
				<Field label="Tempo Médio de Execução" value={details.operational.averageExecutionTime} />
				<Field
					label="Esforço Mensal (horas)"
					value={details.operational.monthlyEffortHours ?? '---'}
				/>
				<Field label="Sistemas Utilizados" value={details.operational.systemsUsed} />
				<Field
					label="Controles Manuais"
					value={formatYesNoDetail(details.operational.hasManualControls)}
				/>
			</div>
			<div class="multiline-stack">
				<Field
					label="Descrição do Processo"
					value={details.operational.processDescription}
					multiline
				/>
				<Field label="Etapas do Processo" value={details.operational.processSteps} multiline />
			</div>
		</ToggleSection>

		<ToggleSection id="tracking-impacts-auth" title="IMPACTOS" open={false}>
			<div class="grid">
				<Field label="Impacto Operacional" value={details.operational.operationalImpact} />
				<Field label="Criticidade Percebida" value={details.operational.perceivedCriticality} />
				<Field label="Prazo Desejado" value={formatDate(details.operational.desiredDeadline)} />
			</div>
			<div class="multiline-stack">
				<Field label="Principais Riscos" value={details.operational.mainRisks} multiline />
				<Field label="Impacto ao Cliente" value={details.operational.clientImpact} multiline />
			</div>
		</ToggleSection>

		<ToggleSection
			id="tracking-complementary"
			title="DOCUMENTAÇÃO, DEPENDÊNCIAS E OUTROS"
			open={false}
		>
			<div class="grid">
				<Field
					label="Possui Documentação de Processo"
					value={formatYesNoDetail(details.complementary?.hasProcessDocumentation)}
				/>
				<Field
					label="Possui Solução Similar"
					value={formatYesNoDetail(details.complementary?.hasSimilarSolution)}
				/>
				<Field
					label="Depende de Outras Áreas"
					value={formatYesNoDetail(details.complementary?.dependsOnOtherAreas)}
				/>
				<Field
					label="Trata Dados Restritos"
					value={formatYesNoDetail(details.complementary?.handlesRestrictedInfo)}
				/>
			</div>
			<div class="multiline-stack">
				<Field
					label="Observações Adicionais"
					value={details.complementary?.additionalNotes}
					multiline
				/>
			</div>
			<div class="sub-block">
				<p class="sub-title">Preferências de Horários</p>
				<p class="fallback-text">{formatSchedule(details.schedulePreferences)}</p>
			</div>
		</ToggleSection>
	{:else}
		<ToggleSection id="tracking-impacts" title="IMPACTOS" open={false}>
			<div class="grid">
				<Field label="Impacto Operacional" value={details.impacts.operationalImpact} />
				<Field label="Criticidade Percebida" value={details.impacts.perceivedCriticality} />
				<Field label="Prazo Desejado" value={formatDate(details.impacts.desiredDeadline)} />
			</div>
			<div class="multiline-stack">
				<Field label="Principais Riscos" value={details.impacts.mainRisks} multiline />
				<Field label="Impacto ao Cliente" value={details.impacts.clientImpact} multiline />
			</div>
		</ToggleSection>
	{/if}

	<ToggleSection id="tracking-attachments" title="ANEXOS" open={false}>
		{#if isAuthenticated(details)}
			{#if details.attachments.length === 0}
				<p class="fallback-text">Nenhum anexo enviado — ---</p>
			{:else}
				<ul class="attachments-list">
					{#each details.attachments as attachment (attachment.id)}
						<li class="attachment-item">
							<span class="attachment-name">{attachment.fileName}</span>
							<span class="attachment-meta"
								>{attachment.mimeType} • {formatBytes(attachment.sizeBytes)}</span
							>
							{#if attachment.canDownload}
								<a
									href={attachmentHref(attachment)}
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
		{:else}
			<p class="fallback-text">Anexos disponíveis após autenticação.</p>
		{/if}
		<div class="meta-footer">
			<div class="grid">
				<Field label="Data de Abertura" value={formatDateTime(details.openedAt)} />
				<Field label="Última Atualização" value={formatDateTime(details.lastUpdate)} />
			</div>
		</div>
	</ToggleSection>
</div>

<style>
	.requester-details {
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

	.attachments-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 12px;
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
