import { createEmptyTriageAssessment, type TriageAssessment } from '$lib/types/triage';

function trim(value: string): string {
	return value.trim();
}

function isRequired(value: string): boolean {
	return trim(value).length > 0;
}

export function toTriageDraft(source: TriageAssessment | null | undefined): TriageAssessment {
	if (!source) return createEmptyTriageAssessment();
	return {
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

export function toTriagePayload(draft: TriageAssessment): TriageAssessment {
	// Omite valores condicionais obsoletos: não envia justificativa quando
	// aderente nem nova categoria quando não há troca — evita persistência
	// de seleção anterior após toggle do controlador.
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

export function validateTriageDraft(draft: TriageAssessment): Record<string, string> {
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

	if (draft.changeCategory === 'Sim' && !draft.newCategory) {
		errors['newCategory'] = 'Selecione a nova categoria.';
	}

	if (draft.adherentToScope === 'Sim') {
		if (!isRequired(draft.preliminaryComplexity)) {
			errors['preliminaryComplexity'] = 'Informe a complexidade preliminar.';
		}
		if (!isRequired(draft.perceivedRisks)) {
			errors['perceivedRisks'] = 'Informe os riscos percebidos.';
		}
	}

	if (!draft.exitStatus) {
		errors['exitStatus'] = 'Selecione o status de saída.';
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
	if (
		draft.newCategory &&
		typeof draft.newCategory === 'string' &&
		trim(draft.newCategory).length > 100
	) {
		// category label max, defensive
	}

	return errors;
}

export function validateTriageField(draft: TriageAssessment, path: string): Record<string, string> {
	const all = validateTriageDraft(draft);
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
