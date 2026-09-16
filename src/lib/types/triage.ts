import type { RequestCategory, TriageResult } from './request';

export interface TriageAssessment {
	adherentToScope: 'Sim' | 'Não' | '';
	changeCategory: 'Sim' | 'Não' | '';
	newCategory: RequestCategory | '';
	adherentJustification: string;
	preliminaryComplexity: string;
	perceivedRisks: string;
	suggestedResponsible: string;
	suggestedResponsibleJustification: string;
	exitStatus: TriageResult | '';
	result: string;
	conclusionJustification: string;
}

export const TRIAGE_EXIT_OPTIONS: { value: TriageResult; label: string }[] = [
	{ value: 'Elegível para avaliação', label: 'Elegível para avaliação' },
	{ value: 'Pendente de informações', label: 'Pendente de informações' },
	{ value: 'Fora do escopo', label: 'Fora do escopo' },
	{ value: 'Direcionada para outra área', label: 'Direcionada para outra área' },
	{ value: 'Duplicada', label: 'Duplicada' },
	{ value: 'Cancelada', label: 'Cancelada' },
	{ value: 'Backlog', label: 'Backlog' }
];

export function createEmptyTriageAssessment(): TriageAssessment {
	return {
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
