import { getPrioritization, savePrioritization } from '$lib/api/prioritization.api';
import type {
	CriterionNotes,
	PrioritizationData,
	PrioritizationResult
} from '$lib/types/prioritization';
import { MAX_NOTE, MIN_NOTE } from '$lib/types/prioritization';

type PrioritizationDataResult =
	| { ok: true; data: PrioritizationData }
	| { ok: false; error: { status?: number; message: string } };

type SavePrioritizationResult =
	| { ok: true; data: PrioritizationResult }
	| {
			ok: false;
			error: { status?: number; message: string; missingCriterionIds?: number[] };
	  };

type ValidationResult =
	{ ok: true } | { ok: false; error: { message: string; missingCriterionIds: number[] } };

function validateNotes(
	criteria: PrioritizationData['criteria'],
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

export async function loadPrioritization(protocol: string): Promise<PrioritizationDataResult> {
	try {
		const data = await getPrioritization(protocol);
		return { ok: true, data };
	} catch (error) {
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function submitPrioritization(
	protocol: string,
	criteria: PrioritizationData['criteria'],
	notes: CriterionNotes
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
		const data = await savePrioritization(protocol, { notes });
		return { ok: true, data };
	} catch (error) {

		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}
