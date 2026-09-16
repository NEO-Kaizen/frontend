import type { AssetKey, PortalCategory, PortalStatus } from '$lib/types/portal-config';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TEXT_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;

// Cor hexadecimal no formato #RRGGBB ou #RRGGBBAA — allowlist usada pelo
// service (sanitize do tema) e pelo mock (validação do PATCH). O alpha opcional
// cobre os fundos translúcidos dos status (ex.: `#ef444410`, ~10% do acento).
// Não aceita nome ou função.
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isValidHexColor(value: unknown): value is string {
	return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

// Regras da identidade da plataforma (Card 2 / CONTRATO-BACKEND.md) — fonte
// única usada pelo service (sanitize), pelo mock e pela store (anti-salvar).
export const MAX_PLATFORM_NAME_LENGTH = 80;

export const MAX_PROTOCOL_MASK_LENGTH = 10;

export const PROTOCOL_MASK_PATTERN = /^[A-Za-z0-9]+$/;

// Regras de upload de assets (Card 4 / CONTRATO-BACKEND.md) — espelho das
// regras propostas para o endpoint POST /assets. Fonte única compartilhada
// pelo service (validação local antes do upload) e pelo mock.
export interface AssetFileRule {
	kinds: readonly string[];
	extensions: readonly string[];
	maxBytes: number;
}

const LOGO_FILE_RULE: AssetFileRule = {
	kinds: ['image/png', 'image/svg+xml'],
	extensions: ['.png', '.svg'],
	maxBytes: 2 * 1024 * 1024
};

const AVATAR_FILE_RULE: AssetFileRule = {
	kinds: ['image/jpeg', 'image/png'],
	extensions: ['.jpg', '.jpeg', '.png'],
	maxBytes: 2 * 1024 * 1024
};

const FAVICON_FILE_RULE: AssetFileRule = {
	kinds: ['image/x-icon', 'image/svg+xml', 'image/png'],
	extensions: ['.ico', '.svg', '.png'],
	maxBytes: 1 * 1024 * 1024
};

const LOGIN_IMAGE_FILE_RULE: AssetFileRule = {
	kinds: ['image/jpeg', 'image/png', 'image/webp'],
	extensions: ['.jpg', '.jpeg', '.png', '.webp'],
	maxBytes: 5 * 1024 * 1024
};

// A variante claro/escuro de cada imagem usa a mesma regra do asset base.
export const ASSET_FILE_RULES = {
	logoLightUrl: LOGO_FILE_RULE,
	logoDarkUrl: LOGO_FILE_RULE,
	avatarLightUrl: AVATAR_FILE_RULE,
	avatarDarkUrl: AVATAR_FILE_RULE,
	loginImageLightUrl: LOGIN_IMAGE_FILE_RULE,
	loginImageDarkUrl: LOGIN_IMAGE_FILE_RULE,
	faviconLightUrl: FAVICON_FILE_RULE,
	faviconDarkUrl: FAVICON_FILE_RULE
} satisfies Record<AssetKey, AssetFileRule>;

export function isValidAssetFile(asset: AssetKey, file: File): boolean {
	const rule = ASSET_FILE_RULES[asset];
	const extension = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
	return rule.extensions.includes(extension) && rule.kinds.includes(file.type);
}

// URL de asset aceita no contrato: caminho relativo do próprio app ou http(s).
// Mesma regra usada pelo service (sanitize da resposta) e pelo mock (validação
// do PATCH de `assets`).
export function isValidAssetUrl(value: string): boolean {
	const url = value.trim();
	if (!url) return false;

	if (url.startsWith('/')) return true;

	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

// ---- Categorias da demanda (Card 5 / CONTRATO-BACKEND.md) ----

export const MAX_CATEGORIES = 50;

export const MAX_CATEGORY_NAME_LENGTH = 40;

export const MAX_CATEGORY_DESCRIPTION_LENGTH = 200;

export function isValidCategoryName(value: string): boolean {
	const trimmed = value.trim();
	return trimmed.length > 0 && trimmed.length <= MAX_CATEGORY_NAME_LENGTH;
}

export function isValidCategoryDescription(value: string): boolean {
	return value.length <= MAX_CATEGORY_DESCRIPTION_LENGTH;
}

// Nomes únicos comparando depois do trim, sem diferenciar maiúsculas.
export function areCategoryNamesUnique(categories: readonly PortalCategory[]): boolean {
	const seen = new Set<string>();
	for (const category of categories) {
		const normalized = category.name.trim().toLowerCase();
		if (seen.has(normalized)) return false;
		seen.add(normalized);
	}
	return true;
}

export function hasActiveCategory(categories: readonly PortalCategory[]): boolean {
	return categories.some((category) => category.isActive);
}

// ---- Status do ciclo de vida (Card 6 / CONTRATO-BACKEND.md) ----

export const MAX_STATUSES = 50;

export const MAX_STATUS_NAME_LENGTH = 40;

export function isValidStatusName(value: string): boolean {
	const trimmed = value.trim();
	return trimmed.length > 0 && trimmed.length <= MAX_STATUS_NAME_LENGTH;
}

// Nomes únicos comparando depois do trim, sem diferenciar maiúsculas.
export function areStatusNamesUnique(statuses: readonly PortalStatus[]): boolean {
	const seen = new Set<string>();
	for (const status of statuses) {
		const normalized = status.name.trim().toLowerCase();
		if (seen.has(normalized)) return false;
		seen.add(normalized);
	}
	return true;
}

// ---- Pesos da priorização (Card 7 / CONTRATO-BACKEND.md) ----

export const PRIORITIZATION_WEIGHT_MIN = 1;

export const PRIORITIZATION_WEIGHT_MAX = 10;

export const PRIORITIZATION_WEIGHT_STEP = 1;

// Valores aceitos para um peso — inteiros de 1 a 10.
export const ALLOWED_PRIORITIZATION_WEIGHTS: readonly number[] = (() => {
	const values: number[] = [];
	for (let value = PRIORITIZATION_WEIGHT_MIN; value <= PRIORITIZATION_WEIGHT_MAX; value += 1) {
		values.push(value);
	}
	return values;
})();

export function isValidPrioritizationWeight(value: unknown): value is number {
	return (
		typeof value === 'number' &&
		Number.isInteger(value) &&
		value >= PRIORITIZATION_WEIGHT_MIN &&
		value <= PRIORITIZATION_WEIGHT_MAX
	);
}

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
