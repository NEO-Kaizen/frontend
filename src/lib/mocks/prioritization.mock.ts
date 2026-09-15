import type {
	CriterionNotes,
	PrioritizationCriterion,
	PrioritizationLevel,
	PrioritizationResult
} from '$lib/types/prioritization';

const mockCriteria: PrioritizationCriterion[] = [
	{ id: 'impacto_operacional', name: 'Impacto Operacional', subtitle: 'Efeito na operação' },
	{
		id: 'risco_operacional',
		name: 'Risco Operacional',
		subtitle: 'Risco financeiro ou compliance'
	},
	{ id: 'urgencia', name: 'Urgência', subtitle: 'Necessidade temporal' },
	{ id: 'volumetria', name: 'Volumetria', subtitle: 'Volume de transações' },
	{ id: 'esforco_manual', name: 'Esforço Manual', subtitle: 'Trabalho manual envolvido' },
	{
		id: 'impacto_cliente',
		name: 'Impacto no Cliente',
		subtitle: 'Efeito na experiência do cliente'
	},
	{ id: 'prazo_regulatorio', name: 'Prazo Regulatório', subtitle: 'Prazos legais ou regulatórios' },
	{ id: 'areas_impactadas', name: 'Áreas Impactadas', subtitle: 'Número de áreas afetadas' },
	{
		id: 'alinhamento_estrategico',
		name: 'Alinhamento Estratégico',
		subtitle: 'Alinhamento com as prioridades da área'
	},
	{
		id: 'complexidade_estimada',
		name: 'Complexidade Estimada',
		subtitle: 'Complexidade técnica envolvida'
	}
];

// Simulação de persistência do Backend para que a reavaliação carregue as
// notas salvas durante a sessão de desenvolvimento.
const savedNotesByProtocol = new Map<string, CriterionNotes>();

function computeResult(notes: CriterionNotes): PrioritizationResult {
	const score = mockCriteria.reduce((total, criterion) => {
		return total + (notes[criterion.id] ?? 0);
	}, 0);

	const maxScore = mockCriteria.length * 5;

	let level: PrioritizationLevel;
	if (score >= Math.round(maxScore * 0.75)) {
		level = 'Crítica';
	} else if (score >= Math.round(maxScore * 0.5)) {
		level = 'Alta';
	} else if (score >= Math.round(maxScore * 0.33)) {
		level = 'Média';
	} else {
		level = 'Baixa';
	}

	return { score, maxScore, level };
}

export function getPrioritizationMock(protocol: string): Promise<{
	criteria: PrioritizationCriterion[];
	notes: CriterionNotes;
}> {
	const normalized = protocol.toLowerCase().trim();
	const notes = savedNotesByProtocol.get(normalized) ?? {};

	return Promise.resolve({ criteria: mockCriteria, notes });
}

export function savePrioritizationMock(
	protocol: string,
	notes: CriterionNotes
): Promise<PrioritizationResult> {
	const normalized = protocol.toLowerCase().trim();

	if (notes && typeof notes === 'object' && !Array.isArray(notes)) {
		savedNotesByProtocol.set(normalized, notes);
	}

	return Promise.resolve(computeResult(notes));
}
