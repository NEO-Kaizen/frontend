import { browser } from '$app/environment';
import type { CriterionNotes, PrioritizationResult } from '$lib/types/prioritization';

const STORAGE_PREFIX = 'maat:prioritization:';
const DRAFT_SUFFIX = ':draft';

function prioritizationKey(protocol: string): string {
	return `${STORAGE_PREFIX}${protocol.trim().toLowerCase()}`;
}

function draftKey(protocol: string): string {
	return `${prioritizationKey(protocol)}${DRAFT_SUFFIX}`;
}

export interface PrioritizationDraft {
	notes: CriterionNotes;
	justification: string;
	// Result persistido após cálculo — permite reabrir calculadora com score visível sem recalcular (R5)
	result?: PrioritizationResult | null;
}

function isValidResult(value: unknown): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value !== 'object' || value === null) return false;
	const r = value as Record<string, unknown>;
	return (
		typeof r.score === 'number' &&
		typeof r.maxScore === 'number' &&
		typeof r.level === 'string' &&
		['Baixa', 'Média', 'Alta', 'Crítica'].includes(r.level as string)
	);
}

function isValidDraft(value: unknown): value is PrioritizationDraft {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	if (typeof v.justification !== 'string') return false;
	if (typeof v.notes !== 'object' || v.notes === null || Array.isArray(v.notes)) return false;
	// Valida notas: chaves string com valores 1..5 ou ausência
	for (const [k, note] of Object.entries(v.notes as Record<string, unknown>)) {
		if (typeof k !== 'string') return false;
		if (note !== undefined && note !== null) {
			if (typeof note !== 'number' || note < 1 || note > 5) return false;
		}
	}
	if ('result' in v && !isValidResult(v.result)) return false;
	return true;
}

// ---- Draft não-finalizado (antes de salvar) ----
// Mantém digitação mesmo antes de salvar, sobrevive a reload/minimizar/fechar via sessionStorage
export function savePrioritizationDraft(protocol: string, draft: PrioritizationDraft | null): void {
	if (!browser) return;
	try {
		const key = draftKey(protocol);
		if (draft === null) {
			sessionStorage.removeItem(key);
			return;
		}
		sessionStorage.setItem(key, JSON.stringify(draft));
	} catch {
		// storage pode estar cheio/bloqueado — falha silenciosa
	}
}

export function loadPrioritizationDraft(protocol: string): PrioritizationDraft | null {
	if (!browser) return null;
	try {
		const raw = sessionStorage.getItem(draftKey(protocol));
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isValidDraft(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function clearPrioritizationDraft(protocol: string): void {
	if (!browser) return;
	try {
		sessionStorage.removeItem(draftKey(protocol));
	} catch {
		// ignore
	}
}

// ---- Final salvo (para reidratação após PUT) ----
// Opcional: espelha triage-draft.service, permite reidratar mesmo após reload
// O backend/mock já persiste via savedNotesByProtocol, mas sessionStorage garante reload rápido
export function savePrioritizationFinal(protocol: string, data: PrioritizationDraft | null): void {
	if (!browser) return;
	try {
		const key = prioritizationKey(protocol);
		if (data === null) {
			sessionStorage.removeItem(key);
			return;
		}
		sessionStorage.setItem(key, JSON.stringify(data));
	} catch {
		// ignore
	}
}

export function loadPrioritizationFinal(protocol: string): PrioritizationDraft | null {
	if (!browser) return null;
	try {
		const raw = sessionStorage.getItem(prioritizationKey(protocol));
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isValidDraft(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function clearPrioritizationFinal(protocol: string): void {
	if (!browser) return;
	try {
		sessionStorage.removeItem(prioritizationKey(protocol));
	} catch {
		// ignore
	}
}
