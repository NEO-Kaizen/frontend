import type {
	CriterionNotes,
	EvaluatePrioritizationResponse,
	ListCriteriaResponse,
	PrioritizationCriterion,
	PrioritizationLevel
} from '$lib/types/prioritization';

const mockCriteria: PrioritizationCriterion[] = [
	{ id: 'impacto_operacional', name: 'Impacto operacional', weight: 10 },
	{ id: 'risco_operacional', name: 'Risco operacional', weight: 10 },
	{ id: 'urgencia', name: 'Urgência', weight: 10 },
	{ id: 'volumetria', name: 'Volumetria', weight: 10 },
	{ id: 'esforco_manual', name: 'Esforço manual', weight: 10 },
	{ id: 'impacto_cliente', name: 'Impacto no cliente', weight: 10 },
	{ id: 'prazo_regulatorio', name: 'Prazo regulatório', weight: 10 },
	{ id: 'areas_impactadas', name: 'Áreas impactadas', weight: 10 },
	{ id: 'alinhamento_estrategico', name: 'Alinhamento estratégico', weight: 10 },
	{ id: 'complexidade_estimada', name: 'Complexidade estimada', weight: 10 }
];

// Simulação de persistência do Backend para que a reavaliação carregue as
// notas salvas durante a sessão de desenvolvimento (via /requests/:protocol/internal).
const savedNotesByProtocol = new Map<string, CriterionNotes>();

export function getSavedPrioritizationNotes(protocol: string): CriterionNotes {
	return savedNotesByProtocol.get(protocol.toLowerCase().trim()) ?? {};
}

// RN-007: score = (Σ (nota × peso) / Σ peso) × 10, 1 casa decimal (10..50).
function computeScore(notes: CriterionNotes): number {
	const totalWeight = mockCriteria.reduce((total, criterion) => total + criterion.weight, 0);

	const weighted = mockCriteria.reduce((total, criterion) => {
		return total + (notes[criterion.id] ?? 0) * criterion.weight;
	}, 0);

	const raw = totalWeight > 0 ? (weighted / totalWeight) * 10 : 0;
	return Math.round(raw * 10) / 10;
}

// RN-008: faixas contíguas de classificação (10.0–20.0 Baixa | 20.1–30.0 Média |
// 30.1–40.0 Alta | 40.1–50.0 Crítica).
function classify(score: number): PrioritizationLevel {
	if (score > 40) return 'Crítica';
	if (score > 30) return 'Alta';
	if (score > 20) return 'Média';
	return 'Baixa';
}

export function computePrioritizationResult(notes: CriterionNotes): {
	score: number;
	classification: PrioritizationLevel;
} {
	const score = computeScore(notes);
	return { score, classification: classify(score) };
}

// GET /prioritization/criteria — lista os critérios ativos e seus pesos.
export function getPrioritizationCriteriaMock(): Promise<ListCriteriaResponse> {
	const criteria = mockCriteria.map(({ id, name, weight }) => ({ id, name, weight }));
	return Promise.resolve({ criteria });
}

// PUT /prioritization/:protocol/score — calcula no "servidor" (mock) e persiste.
export function savePrioritizationMock(
	protocol: string,
	notes: CriterionNotes
): Promise<EvaluatePrioritizationResponse> {
	const normalized = protocol.toLowerCase().trim();

	if (notes && typeof notes === 'object' && !Array.isArray(notes)) {
		savedNotesByProtocol.set(normalized, notes);
	}

	const { score, classification } = computePrioritizationResult(notes);

	return Promise.resolve({
		protocol,
		score,
		classification,
		calculatedAt: new Date().toISOString(),
		calculatedBy: 103
	});
}
