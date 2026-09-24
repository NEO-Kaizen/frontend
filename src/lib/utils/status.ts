import type { PortalStatus, StatusTone } from '$lib/types/portal-config';

const FALLBACK_TONE: StatusTone = 'neutral';

const TONE_FAMILY: Record<StatusTone, string> = {
	error: 'red',
	success: 'green',
	info: 'blue',
	warning: 'yellow',
	neutral: 'neutral'
};

function findStatus(name: string, statuses: PortalStatus[]): PortalStatus | undefined {
	return statuses.find((status) => status.name === name);
}

function findStatusById(id: number, statuses: PortalStatus[]): PortalStatus | undefined {
	return statuses.find((status) => status.id === id);
}

export function statusTone(name: string, statuses: PortalStatus[]): StatusTone {
	return findStatus(name, statuses)?.tone ?? FALLBACK_TONE;
}

export function statusToneClass(name: string, statuses: PortalStatus[]): string {
	return `status-${TONE_FAMILY[statusTone(name, statuses)]}`;
}

export function statusThemeVars(
	name: string,
	statuses: PortalStatus[]
): { bg: string; color: string; border: string } {
	const family = TONE_FAMILY[statusTone(name, statuses)];

	return {
		bg: `var(--status-${family}-bg)`,
		color: `var(--status-${family})`,
		border: `var(--status-${family})`
	};
}

// v4: isTerminal encerra a solicitação (qualquer status pode ser terminal; por padrão só 16,17)
export function isClosingStatus(name: string, statuses: PortalStatus[]): boolean {
	const s = findStatus(name, statuses);
	return s ? (s.isTerminal ?? s.closesRequest ?? false) : false;
}

export function isTerminalStatus(id: number, statuses: PortalStatus[]): boolean {
	return findStatusById(id, statuses)?.isTerminal ?? false;
}

// v4: triageMode/mappingMode + isRestricted
export function isTriageExitStatus(id: number, statuses: PortalStatus[]): boolean {
	const s = findStatusById(id, statuses);
	if (!s || s.isActive !== true || s.isRestricted) return false;
	const mode = s.triageMode ?? (s.isTriageExit ? 'free' : 'none');
	return mode === 'free' || mode === 'conclusion_only';
}

export function isFreeStatus(id: number, statuses: PortalStatus[]): boolean {
	const s = findStatusById(id, statuses);
	if (!s || !s.isActive || s.isRestricted) return false;
	return s.triageMode === 'free' || s.mappingMode === 'free';
}

export function isConclusionStatus(id: number, statuses: PortalStatus[]): boolean {
	const s = findStatusById(id, statuses);
	if (!s || !s.isActive || s.isRestricted) return false;
	return s.triageMode === 'conclusion_only' || s.mappingMode === 'conclusion_only';
}

export function triageExitOptions(statuses: PortalStatus[]): { value: string; label: string }[] {
	return statuses
		.filter(
			(s) =>
				s.isActive &&
				!s.isRestricted &&
				(s.triageMode === 'free' || s.triageMode === 'conclusion_only')
		)
		.map((status) => ({ value: String(status.id), label: status.name }));
}

export function triageConclusionOptions(
	statuses: PortalStatus[]
): { value: string; label: string }[] {
	return triageExitOptions(statuses);
}

export function mappingConclusionOptions(
	statuses: PortalStatus[]
): { value: string; label: string }[] {
	return statuses
		.filter(
			(s) =>
				s.isActive &&
				!s.isRestricted &&
				(s.mappingMode === 'free' || s.mappingMode === 'conclusion_only')
		)
		.map((status) => ({ value: String(status.id), label: status.name }));
}

export function freeStatusOptions(statuses: PortalStatus[]): { value: string; label: string }[] {
	return statuses
		.filter(
			(s) => s.isActive && !s.isRestricted && (s.triageMode === 'free' || s.mappingMode === 'free')
		)
		.map((status) => ({ value: String(status.id), label: status.name }));
}

// Fallback isPublic: solicitante vê último status público quando status atual é interno
export function displayStatusName(name: string, statuses: PortalStatus[]): string {
	const s = findStatus(name, statuses);
	if (!s) return name;
	const isPublic = s.isPublic ?? s.visibility === 'PUBLIC';
	if (isPublic) return name;
	const lastPublic = [...statuses]
		.sort((a, b) => a.order - b.order)
		.findLast((st) => (st.isPublic ?? st.visibility === 'PUBLIC') && st.order < s.order);
	if (lastPublic) return lastPublic.name;
	const firstPublic = statuses.find((st) => st.isPublic ?? st.visibility === 'PUBLIC');
	return firstPublic?.name ?? name;
}

export function isRestrictedStatus(id: number, statuses: PortalStatus[]): boolean {
	return findStatusById(id, statuses)?.isRestricted ?? false;
}

export function isCoreStatus(id: number, statuses: PortalStatus[]): boolean {
	return findStatusById(id, statuses)?.isCore ?? false;
}
