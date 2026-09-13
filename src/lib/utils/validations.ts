const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

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
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : null;
	}

	if (value.trim() === '') {
		return null;
	}

	const number = Number(value);

	return Number.isFinite(number) ? number : null;
}

export function isValidDate(value: string): boolean {
	if (!value) {
		return false;
	}

	const date = new Date(value);

	return !Number.isNaN(date.getTime());
}

export function isFutureOrToday(value: string, reference: string): boolean {
	return value >= reference;
}

export function isProtocol(value: string, prefix: string): boolean {
	const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	return new RegExp(`^${escapedPrefix}-[A-Z0-9]{4}-[A-Z0-9]{4}$`, 'i').test(value);
}

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const PASSWORD_REQUIREMENTS = ['Mínimo de 8 caracteres', 'Contém letras e números'] as const;
