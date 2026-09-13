const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

// Regras da identidade da plataforma (Card 2 / CONTRATO-BACKEND.md) — fonte
// única usada pelo service (sanitize), pelo mock e pela store (anti-salvar).
export const MAX_PLATFORM_NAME_LENGTH = 80;

export const MAX_PROTOCOL_MASK_LENGTH = 40;

export const PROTOCOL_MASK_PATTERN = /^[A-Za-z0-9-]+$/;

export function isValidPlatformName(value: string): boolean {
	const trimmed = value.trim();
	return trimmed.length > 0 && trimmed.length <= MAX_PLATFORM_NAME_LENGTH;
}

export function isValidProtocolMask(value: string): boolean {
	const trimmed = value.trim();
	return (
		trimmed.length > 0 &&
		trimmed.length <= MAX_PROTOCOL_MASK_LENGTH &&
		PROTOCOL_MASK_PATTERN.test(trimmed)
	);
}

export function isRequired(value: string): boolean {
	return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
	return EMAIL_PATTERN.test(value);
}

export function isValidText(value: string): boolean {
	return TEXT_PATTERN.test(value);
}

export function parseNumber(value: number | string | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (value.trim() === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

export function isValidDate(value: string): boolean {
	if (!value) return false;
	const date = new Date(value);
	return !Number.isNaN(date.getTime());
}

export function isFutureOrToday(value: string, reference: string): boolean {
	return value >= reference;
}

// Protocolo no formato "{prefixo}-XXXX-XXXX" — o prefixo (primeiro bloco) é
// configurável via PortalConfig.protocolMask. `prefix` é escapado para regex.
export function isProtocol(value: string, prefix: string): boolean {
	const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`^${escapedPrefix}-[A-Z0-9]{4}-[A-Z0-9]{4}$`, 'i').test(value);
}
