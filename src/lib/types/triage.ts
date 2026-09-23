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
}

// Criação — body do POST (sem id, gerado pelo backend como uuid do registro)
export type CreateTriagePayload = Omit<TriageAssessment, 'id'>;

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
		conclusionJustification: ''
	};
}
