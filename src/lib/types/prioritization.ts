export type CriterionNote = 1 | 2 | 3 | 4 | 5;

export const MIN_NOTE: CriterionNote = 1;
export const MAX_NOTE: CriterionNote = 5;

export interface PrioritizationCriterion {
	id: number;
	name: string;
	subtitle: string;
}

// Nota por critério (chave = id do critério). O backend é a validação
// definitiva; o score final nunca é enviado pelo frontend como fonte de verdade.
export type CriterionNotes = Partial<Record<number, CriterionNote>>;

export type PrioritizationLevel = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface PrioritizationResult {
	score: number;
	maxScore: number;
	level: PrioritizationLevel;
}

// Resposta do GET — critérios oficiais + notas já existentes (vazias na
// primeira avaliação; preenchidas numa reavaliação).
export interface PrioritizationData {
	criteria: PrioritizationCriterion[];
	notes: CriterionNotes;
}

// Corpo do POST — apenas as notas por critério.
export interface SavePrioritizationPayload {
	notes: CriterionNotes;
}
