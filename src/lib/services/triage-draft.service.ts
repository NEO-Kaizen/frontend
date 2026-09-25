import { browser } from '$app/environment';
import type { TriageAssessment } from '$lib/types/triage';

const STORAGE_PREFIX = 'maat:triage:';
const DRAFT_SUFFIX = ':draft';

function triageKey(protocol: string): string {
	return `${STORAGE_PREFIX}${protocol.trim().toLowerCase()}`;
}

function draftKey(protocol: string): string {
	return `${triageKey(protocol)}${DRAFT_SUFFIX}`;
}

function isValidTriage(value: unknown): value is TriageAssessment {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	// `id` é opcional aqui (drafts legados não têm); `exitStatus` aceita número
	// (FK) ou "" (não selecionado) — literal legado (string não-vazia) é
	// inválido e descartado pelo `load*` (migração v2.3).
	return (
		(v.id === undefined || typeof v.id === 'string') &&
		typeof v.adherentToScope === 'string' &&
		typeof v.changeCategory === 'string' &&
		typeof v.newCategory === 'string' &&
		typeof v.adherentJustification === 'string' &&
		typeof v.preliminaryComplexity === 'string' &&
		typeof v.perceivedRisks === 'string' &&
		typeof v.suggestedResponsible === 'string' &&
		typeof v.suggestedResponsibleJustification === 'string' &&
		(v.exitStatus === '' || typeof v.exitStatus === 'number') &&
		typeof v.result === 'string' &&
		typeof v.conclusionJustification === 'string' &&
		(v.lastTechnicalMessage === undefined || typeof v.lastTechnicalMessage === 'string') &&
		isValidTriageAssignee(v.assignee)
	);
}

function isValidTriageAssignee(value: unknown): boolean {
	if (value === undefined || value === null) return true;
	if (typeof value !== 'object' || Array.isArray(value)) return false;
	const assignee = value as Record<string, unknown>;
	return (
		(assignee.id === null || typeof assignee.id === 'string') &&
		(assignee.name === null || typeof assignee.name === 'string') &&
		(assignee.email === undefined || assignee.email === null || typeof assignee.email === 'string')
	);
}

// ---- Persistência do triage finalizado (após PATCH) ----
// Usado pelo mock para sobreviver a reload. Representa o estado "salvo" no servidor.

export function saveTriageToSession(protocol: string, triage: TriageAssessment | null): void {
	if (!browser) return;
	try {
		const key = triageKey(protocol);
		if (triage === null) {
			sessionStorage.removeItem(key);
			return;
		}
		sessionStorage.setItem(key, JSON.stringify(triage));
	} catch {
		// storage pode estar cheio/bloqueado — falha silenciosa (mock em memória continua)
	}
}

export function loadTriageFromSession(protocol: string): TriageAssessment | null {
	if (!browser) return null;
	try {
		const raw = sessionStorage.getItem(triageKey(protocol));
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isValidTriage(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function clearTriageFromSession(protocol: string): void {
	if (!browser) return;
	try {
		sessionStorage.removeItem(triageKey(protocol));
	} catch {
		// ignore
	}
}

// ---- Rascunho não-finalizado (edição em andamento) ----
// Mantém digitação mesmo antes de finalizar, tanto na 1ª quanto nas seguintes edições.

export function saveDraftToSession(protocol: string, draft: TriageAssessment): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(draftKey(protocol), JSON.stringify(draft));
	} catch {
		// ignore
	}
}

export function loadDraftFromSession(protocol: string): TriageAssessment | null {
	if (!browser) return null;
	try {
		const raw = sessionStorage.getItem(draftKey(protocol));
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isValidTriage(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

export function clearDraftFromSession(protocol: string): void {
	if (!browser) return;
	try {
		sessionStorage.removeItem(draftKey(protocol));
	} catch {
		// ignore
	}
}
