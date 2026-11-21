import type { RequestCategory } from './request';

export interface TriageAssessment {
	id: string;
	adherentToScope: 'Sim' | 'Não' | '';
	changeCategory: 'Sim' | 'Não' | '';
	newCategory: RequestCategory | '';
	adherentJustification: string;
	preliminaryComplexity: string;
	perceivedRisks: string;
	suggestedResponsible: string;
	suggestedResponsibleJustification: string;
	exitStatus: number | '';
	result: string;
	conclusionJustification: string;
	// Retorno público ao solicitante — obrigatório se `exitStatus.isPublic`.
	lastTechnicalMessage?: string;
	// Responsável que executou a triagem — readonly, definido pelo backend a
	// partir da custódia no POST. Nunca enviado pelo cliente (ver
	// `CreateTriagePayload`); `suggestedResponsible` é apenas a *sugestão* do
	// analista, não o autor.
	assignee?: { id: string | null; name: string | null; email?: string | null } | null;
}

// Criação — body do POST (sem id, gerado pelo backend como uuid do registro;
// sem `assignee`, definido pelo backend a partir da sessão)
export type CreateTriagePayload = Omit<TriageAssessment, 'id' | 'assignee'>;

export function createEmptyTriageAssessment(): TriageAssessment {
	return {
		id: '',
		adherentToScope: '',
		changeCategory: '',
		newCategory: '',
		adherentJustification: '',
		preliminaryComplexity: '',
		perceivedRisks: '',
		suggestedResponsible: '',
		suggestedResponsibleJustification: '',
		exitStatus: '',
		result: '',
		conclusionJustification: '',
		lastTechnicalMessage: ''
	};
}
