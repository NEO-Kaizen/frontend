import { getPrioritizationCriteria, savePrioritization } from '$lib/api/prioritization.api';
import { ApiError, type Result } from '$lib/types/result';
import type {
	CriterionNotes,
	PrioritizationCriterion,
	PrioritizationResult
} from '$lib/types/prioritization';
import { MAX_NOTE, MIN_NOTE } from '$lib/types/prioritization';

type SavePrioritizationError = {
	status?: number;
	message: string;
	missingCriterionIds?: string[];
};

type SavePrioritizationResult =
	{ ok: true; data: PrioritizationResult } | { ok: false; error: SavePrioritizationError };

type ValidationResult =
	{ ok: true } | { ok: false; error: { message: string; missingCriterionIds: string[] } };

// Carrega os critérios oficiais ativos (GET /prioritization/criteria).
// As notas já salvas para reavaliação vêm no /requests/:protocol/internal
// (contrato aprovado) e são repassadas ao componente via prop.
export async function loadPrioritizationCriteria(): Promise<Result<PrioritizationCriterion[]>> {
	try {
		const data = await getPrioritizationCriteria();
		const criteria = data.criteria.map(({ id, name, weight }) => ({ id, name, weight }));
		return { ok: true, data: criteria };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: { status: error.status, message: error.message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

function validateNotes(
	criteria: PrioritizationCriterion[],
	notes: CriterionNotes
): ValidationResult {
	const missingCriterionIds = criteria
		.filter((criterion) => {
			const note = notes[criterion.id];
			return note === undefined || note < MIN_NOTE || note > MAX_NOTE;
		})
		.map((criterion) => criterion.id);

	if (missingCriterionIds.length > 0) {
		return {
			ok: false,
			error: {
				message: 'Preencha todos os critérios com uma nota de 1 a 5 antes de salvar.',
				missingCriterionIds
			}
		};
	}

	return { ok: true };
}

export async function submitPrioritization(
	protocol: string,
	criteria: PrioritizationCriterion[],
	notes: CriterionNotes,
	justification?: string
): Promise<SavePrioritizationResult> {
	const validation = validateNotes(criteria, notes);
	if (!validation.ok) {
		return {
			ok: false,
			error: {
				message: validation.error.message,
				missingCriterionIds: validation.error.missingCriterionIds
			}
		};
	}

	try {
		// Campo opcional: só-espaços vira ausência e some do JSON.
		const trimmed = justification?.trim();
		const data = await savePrioritization(protocol, {
			notes,
			justification: trimmed ? trimmed : undefined
		});

		const result: PrioritizationResult = {
			score: data.score,
			maxScore: criteria.length * MAX_NOTE,
			level: data.classification
		};

		return { ok: true, data: result };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: { status: error.status, message: error.message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}
