import {
	createEmptyTriageAssessment,
	type CreateTriagePayload,
	type TriageAssessment
} from '$lib/types/triage';
import type { PortalCategory, PortalStatus } from '$lib/types/portal-config';
import { isTriageExitStatus } from '$lib/utils/status';

function trim(value: string): string {
	return value.trim();
}

function isRequired(value: string): boolean {
	return trim(value).length > 0;
}

export interface TriageValidationContext {
	statuses?: PortalStatus[];
	categories?: PortalCategory[];
}

export function toTriageDraft(source: TriageAssessment | null | undefined): TriageAssessment {
	if (!source) return createEmptyTriageAssessment();
	return {
		id: source.id ?? '',
		adherentToScope: source.adherentToScope ?? '',
		adherentJustification: source.adherentJustification ?? '',
		changeCategory: source.changeCategory ?? '',
		newCategory: source.newCategory ?? '',
		preliminaryComplexity: source.preliminaryComplexity ?? '',
		perceivedRisks: source.perceivedRisks ?? '',
		suggestedResponsible: source.suggestedResponsible ?? '',
		suggestedResponsibleJustification: source.suggestedResponsibleJustification ?? '',
		exitStatus: source.exitStatus ?? '',
		result: source.result ?? '',
		conclusionJustification: source.conclusionJustification ?? ''
	};
}

export function toTriagePayload(draft: TriageAssessment): CreateTriagePayload {
	// Omite valores condicionais obsoletos: não envia justificativa quando
	// aderente nem nova categoria quando não há troca — evita persistência
	// de seleção anterior após toggle do controlador. Nunca envia `id`
	// (uuid do registro, gerado pelo backend no POST).
	const adherent = draft.adherentToScope === 'Não' ? trim(draft.adherentJustification) : '';
	const newCategory = draft.changeCategory === 'Sim' ? draft.newCategory : '';
	return {
		adherentToScope: draft.adherentToScope,
		adherentJustification: adherent,
		changeCategory: draft.changeCategory,
		newCategory,
		preliminaryComplexity: trim(draft.preliminaryComplexity),
		perceivedRisks: trim(draft.perceivedRisks),
		suggestedResponsible: trim(draft.suggestedResponsible),
		suggestedResponsibleJustification: trim(draft.suggestedResponsibleJustification),
		exitStatus: draft.exitStatus,
		result: trim(draft.result),
		conclusionJustification: trim(draft.conclusionJustification)
	};
}

export function validateTriageDraft(
	draft: TriageAssessment,
	context: TriageValidationContext = {}
): Record<string, string> {
	const errors: Record<string, string> = {};

	if (!draft.adherentToScope) {
		errors['adherentToScope'] = 'Selecione uma opção.';
	}

	if (draft.adherentToScope === 'Não' && !isRequired(draft.adherentJustification)) {
		errors['adherentJustification'] = 'Informe a justificativa quando não aderente ao escopo.';
	}

	if (!draft.changeCategory) {
		errors['changeCategory'] = 'Selecione uma opção.';
	}

	if (draft.changeCategory === 'Sim') {
		if (!draft.newCategory) {
			errors['newCategory'] = 'Selecione a nova categoria.';
		} else if (context.categories) {
			const active = context.categories.some(
				(category) => category.isActive && category.name === draft.newCategory
			);
			if (!active) {
				errors['newCategory'] = 'Categoria deve estar ativa no cadastro.';
			}
		}
	}

	if (draft.adherentToScope === 'Sim') {
		if (!isRequired(draft.preliminaryComplexity)) {
			errors['preliminaryComplexity'] = 'Informe a complexidade preliminar.';
		}
		if (!isRequired(draft.perceivedRisks)) {
			errors['perceivedRisks'] = 'Informe os riscos percebidos.';
		}
	}

	if (draft.exitStatus === '' || draft.exitStatus === null || draft.exitStatus === undefined) {
		errors['exitStatus'] = 'Selecione o status de saída.';
	} else if (context.statuses && !isTriageExitStatus(Number(draft.exitStatus), context.statuses)) {
		errors['exitStatus'] =
			'Status de saída deve ser um status ativo com triageMode free ou conclusion_only e isRestricted=false.';
	}

	if (!isRequired(draft.result)) {
		errors['result'] = 'Informe o resultado.';
	}

	if (!isRequired(draft.conclusionJustification)) {
		errors['conclusionJustification'] = 'Informe a justificativa da conclusão.';
	}

	// maxlength checks (trimmed length)
	if (trim(draft.adherentJustification).length > 1000) {
		errors['adherentJustification'] = 'Limite de 1000 caracteres excedido.';
	}
	if (trim(draft.preliminaryComplexity).length > 4000) {
		errors['preliminaryComplexity'] = 'Limite de 4000 caracteres excedido.';
	}
	if (trim(draft.perceivedRisks).length > 4000) {
		errors['perceivedRisks'] = 'Limite de 4000 caracteres excedido.';
	}
	if (trim(draft.suggestedResponsible).length > 150) {
		errors['suggestedResponsible'] = 'Limite de 150 caracteres excedido.';
	}
	if (trim(draft.suggestedResponsibleJustification).length > 1000) {
		errors['suggestedResponsibleJustification'] = 'Limite de 1000 caracteres excedido.';
	}
	if (trim(draft.result).length > 1000) {
		errors['result'] = 'Limite de 1000 caracteres excedido.';
	}
	if (trim(draft.conclusionJustification).length > 4000) {
		errors['conclusionJustification'] = 'Limite de 4000 caracteres excedido.';
	}

	return errors;
}

export function validateTriageField(
	draft: TriageAssessment,
	path: string,
	context: TriageValidationContext = {}
): Record<string, string> {
	const all = validateTriageDraft(draft, context);
	const picked: Record<string, string> = {};
	if (all[path]) picked[path] = all[path];
	// Para campos condicionais, ao validar o controlador também validar dependente e vice-versa
	// Mapeamento simples: se path for controlador, incluir dependente; se for dependente, incluir controlador
	const related: Record<string, string[]> = {
		adherentToScope: [
			'adherentToScope',
			'adherentJustification',
			'preliminaryComplexity',
			'perceivedRisks'
		],
		adherentJustification: ['adherentJustification', 'adherentToScope'],
		changeCategory: ['changeCategory', 'newCategory'],
		newCategory: ['newCategory', 'changeCategory'],
		exitStatus: ['exitStatus'],
		result: ['result'],
		conclusionJustification: ['conclusionJustification'],
		preliminaryComplexity: ['preliminaryComplexity'],
		perceivedRisks: ['perceivedRisks'],
		suggestedResponsible: ['suggestedResponsible'],
		suggestedResponsibleJustification: ['suggestedResponsibleJustification']
	};
	const keys = related[path] ?? [path];
	for (const key of keys) {
		if (all[key]) picked[key] = all[key];
	}
	return picked;
}
