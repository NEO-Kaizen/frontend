import type { InternalRequestDetail, YesNoDetail } from '$lib/types/request';
import type { PendingFieldRef } from '$lib/types/pendency';

// Seção agrupada de campos selecionáveis (mesmos paths do modo de edição).
export interface FieldCandidateSection {
	id: string;
	title: string;
	fields: PendingFieldRef[];
}

function toRef(fieldKey: string, fieldLabel: string, value: unknown): PendingFieldRef {
	const normalized = value ?? '';
	const currentValue =
		normalized === null || normalized === undefined || String(normalized).trim() === ''
			? '---'
			: String(normalized);
	return { fieldKey, fieldLabel, currentValue };
}

function formatYesNo(value: YesNoDetail | undefined): string {
	if (value === undefined) return '---';
	if (value === false) return 'Não';
	const trimmed = value.trim();
	return trimmed === '' ? 'Sim' : `Sim — ${trimmed}`;
}

// Devolve os campos marcáveis da solicitação com o valor atual exibido na
// seleção. `requester.fullName`/`corporateEmail` seguem a regra do contrato §5:
// só são marcáveis quando a solicitação NÃO tem usuário de origem. Como o
// detalhe interno ainda não expõe esse id da origem, ficam fora por padrão;
// ligar `includeIdentityFields` quando o backend prover o flag.
export function toFieldCandidateSections(
	solicitation: InternalRequestDetail,
	options: { includeIdentityFields?: boolean } = {}
): FieldCandidateSection[] {
	const { requester, demand, operational, complementary } = solicitation;
	const sections: FieldCandidateSection[] = [];

	const requesterFields: PendingFieldRef[] = [];

	if (options.includeIdentityFields) {
		requesterFields.push(
			toRef('requester.fullName', 'Nome', requester.fullName),
			toRef('requester.corporateEmail', 'E-mail Corporativo', requester.corporateEmail)
		);
	}

	requesterFields.push(
		toRef('requester.area', 'Área do solicitante', requester.area),
		toRef('requester.department', 'Departamento', requester.department),
		toRef('requester.manager', 'Gestor Responsável', requester.manager),
		toRef('requester.additionalContact', 'Contato adicional', requester.additionalContact)
	);

	sections.push({
		id: 'requester',
		title: 'Identificação do solicitante',
		fields: requesterFields
	});

	sections.push({
		id: 'demand',
		title: 'Detalhes da demanda',
		fields: [
			toRef('demand.title', 'Título Resumido', demand.title),
			toRef('demand.requestType', 'Tipo de Solicitação', demand.requestType),
			toRef('demand.category', 'Categoria', demand.category),
			toRef('demand.processName', 'Nome do Processo Atual', demand.processName),
			toRef('demand.description', 'Descrição da necessidade', demand.description),
			toRef('demand.problem', 'Problema ou oportunidade', demand.problem),
			toRef('demand.expectedResult', 'Resultado esperado', demand.expectedResult),
			toRef('demand.justification', 'Justificativa da solicitação', demand.justification)
		]
	});

	sections.push({
		id: 'operational',
		title: 'Informações operacionais',
		fields: [
			toRef(
				'operational.processDescription',
				'Descrição do Processo',
				operational.processDescription
			),
			toRef('operational.processSteps', 'Etapas do Processo', operational.processSteps),
			toRef('operational.systemsUsed', 'Sistemas Utilizados', operational.systemsUsed),
			toRef(
				'operational.executionFrequency',
				'Frequência de Execução',
				operational.executionFrequency
			),
			toRef('operational.volumetry', 'Volumetria Aproximada', operational.volumetry),
			toRef('operational.peopleInvolved', 'Pessoas Envolvidas', operational.peopleInvolved),
			toRef(
				'operational.averageExecutionTime',
				'Tempo Médio de Execução',
				operational.averageExecutionTime
			),
			toRef(
				'operational.monthlyEffortHours',
				'Esforço Mensal (horas)',
				operational.monthlyEffortHours
			),
			toRef(
				'operational.hasManualControls',
				'Controles Manuais',
				formatYesNo(operational.hasManualControls)
			),
			toRef('operational.mainRisks', 'Principais Riscos', operational.mainRisks),
			toRef('operational.clientImpact', 'Impacto ao Cliente', operational.clientImpact),
			toRef('operational.operationalImpact', 'Impacto Operacional', operational.operationalImpact),
			toRef('operational.desiredDeadline', 'Prazo Desejado', operational.desiredDeadline),
			toRef(
				'operational.perceivedCriticality',
				'Criticidade Percebida',
				operational.perceivedCriticality
			)
		]
	});

	sections.push({
		id: 'complementary',
		title: 'Informações complementares',
		fields: [
			toRef(
				'complementary.hasProcessDocumentation',
				'Documentação de Processo',
				formatYesNo(complementary?.hasProcessDocumentation)
			),
			toRef(
				'complementary.hasSimilarSolution',
				'Solução Similar',
				formatYesNo(complementary?.hasSimilarSolution)
			),
			toRef(
				'complementary.dependsOnOtherAreas',
				'Depende de Outras Áreas',
				formatYesNo(complementary?.dependsOnOtherAreas)
			),
			toRef(
				'complementary.handlesRestrictedInfo',
				'Trata Dados Restritos',
				formatYesNo(complementary?.handlesRestrictedInfo)
			),
			toRef(
				'complementary.additionalNotes',
				'Observações Adicionais',
				complementary?.additionalNotes
			)
		]
	});

	return sections;
}

// Índice flat por fieldKey — resolve o campo a partir do path clicado na tela.
export function buildFieldLookup(
	solicitation: InternalRequestDetail,
	options: { includeIdentityFields?: boolean } = {}
): Map<string, PendingFieldRef> {
	const lookup = new Map<string, PendingFieldRef>();
	for (const section of toFieldCandidateSections(solicitation, options)) {
		for (const field of section.fields) {
			lookup.set(field.fieldKey, field);
		}
	}
	return lookup;
}
