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

export function isClosingStatus(name: string, statuses: PortalStatus[]): boolean {
	return findStatus(name, statuses)?.closesRequest ?? false;
}
