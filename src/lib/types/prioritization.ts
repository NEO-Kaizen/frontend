export type CriterionNote = 1 | 2 | 3 | 4 | 5;

export const MIN_NOTE: CriterionNote = 1;
export const MAX_NOTE: CriterionNote = 5;

// Critério de priorização (tabela `criteria`).
export interface PrioritizationCriterion {
	id: string; // chave oficial snake_case (D-O1)
	name: string;
	weight: number; // fonte única de pesos — D-O3 (Backend nunca lê peso do Frontend)
}

// Nota por critério (chave = id do critério). O backend é a validação
// definitiva; o score final nunca é enviado pelo frontend como fonte de verdade.
export type CriterionNotes = Partial<Record<string, CriterionNote>>;

export type PrioritizationLevel = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface PrioritizationResult {
	score: number;
	maxScore: number;
	level: PrioritizationLevel;
}

// ---- Contrato Backend (docs/issue-51.md / priorização) ----

// GET /prioritization/criteria — item de lista
export interface CriterionResponse {
	id: string;
	name: string;
	weight: number;
}

// GET /prioritization/criteria — envelope de resposta
export interface ListCriteriaResponse {
	criteria: CriterionResponse[];
}

// PUT /prioritization/:protocol/score — corpo da requisição
export interface EvaluatePrioritizationRequest {
	notes: CriterionNotes;
	justification?: string;
}

// PUT /prioritization/:protocol/score — resposta (cálculo no servidor, RN-007/RN-008)
export interface EvaluatePrioritizationResponse {
	protocol: string;
	score: number; // 10..50, 1 casa decimal
	classification: PrioritizationLevel;
	calculatedAt: string;
	calculatedBy: number;
}
