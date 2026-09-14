import {
	fetchPortalConfig,
	updatePortalConfig,
	uploadAssetApi
} from '$lib/config/portal-config.api';
import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import { ApiError, type Result } from '$lib/types/result';
import {
	isValidAssetFile,
	isValidAssetUrl,
	isValidCategoryName,
	isValidCategoryDescription,
	isValidStatusName,
	isValidPlatformName,
	isValidProtocolMask,
	areCategoryNamesUnique,
	hasActiveCategory,
	areStatusNamesUnique,
	MAX_CATEGORIES,
	MAX_STATUSES,
	ASSET_FILE_RULES
} from '$lib/utils/validations';
import { ASSET_KEYS, STATUS_TONES, STATUS_VISIBILITIES } from '$lib/types/portal-config';
import type {
	AssetKey,
	PortalCategory,
	PortalConfig,
	PortalAssetsPatch,
	PortalStatus,
	SolicitationMode,
	StatusTone,
	StatusVisibility,
	UpdatePortalConfigPayload
} from '$lib/types/portal-config';

// Carrega a configuração do portal com fallback. Nunca joga exceção para o
// layout: qualquer falha de rede ou valor inválido cai no default local por
// campo — a aplicação permanece utilizável (critério #89/#96).
export async function loadPortalConfig(): Promise<PortalConfig> {
	try {
		const raw = await fetchPortalConfig();
		return sanitizePortalConfig(raw);
	} catch (error) {
		console.warn('[portal-config] Falha ao carregar configuração; usando defaults.', error);
		return DEFAULT_PORTAL_CONFIG;
	}
}

const SOLICITATION_MODES: readonly SolicitationMode[] = ['PUBLIC', 'AUTHENTICATED'];

// Persiste atualizações parciais da configuração (PATCH). Sanitiza o payload
// para a allowlist do contrato antes de enviar e sanitiza a resposta do
// backend; nunca expõe exceção à UI.
export async function savePortalConfig(
	payload: UpdatePortalConfigPayload
): Promise<Result<PortalConfig>> {
	try {
		const raw = await updatePortalConfig(sanitizeUpdatePayload(payload));
		return { ok: true, data: sanitizePortalConfig(raw) };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: 'Não foi possível salvar as configurações.'
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// Upload de um asset (Card 4). Valida localmente tipo e tamanho (espelho das
// regras do contrato) antes de qualquer chamada de rede; retorna a URL do
// asset pronto para ser salva no PATCH. Nunca expõe exceção à UI.
export async function uploadAsset(asset: AssetKey, file: File): Promise<Result<string>> {
	const rule = ASSET_FILE_RULES[asset];

	if (file.size > rule.maxBytes) {
		return { ok: false, error: { message: 'Arquivo excede o tamanho máximo permitido.' } };
	}

	if (!isValidAssetFile(asset, file)) {
		return { ok: false, error: { message: 'Tipo de arquivo não permitido para este asset.' } };
	}

	try {
		const url = await uploadAssetApi(asset, file);
		return { ok: true, data: url };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: 'Não foi possível enviar o arquivo.' }
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

// Mantém apenas as chaves da allowlist do contrato, valores dos campos simples
// e assets parciais validados (URL relativa ou http(s)). Campos desconhecidos
// ou inválidos são descartados — o backend contínua sendo a autoridade.
function sanitizeUpdatePayload(payload: UpdatePortalConfigPayload): UpdatePortalConfigPayload {
	const sanitized: UpdatePortalConfigPayload = {};

	if (payload.solicitationMode !== undefined) {
		sanitized.solicitationMode = payload.solicitationMode;
	}
	if (payload.platformName !== undefined) {
		sanitized.platformName = payload.platformName;
	}
	if (payload.protocolMask !== undefined) {
		sanitized.protocolMask = payload.protocolMask;
	}

	if (payload.assets !== undefined) {
		const assets: PortalAssetsPatch = {};
		for (const key of ASSET_KEYS) {
			const value = payload.assets[key];
			if (typeof value === 'string' && isValidAssetUrl(value)) {
				assets[key] = value.trim();
			}
		}
		sanitized.assets = assets;
	}

	if (payload.categories !== undefined) {
		const categories = sanitizeCategories(payload.categories);
		if (categories.length > 0) {
			sanitized.categories = categories;
		}
	}

	if (payload.statuses !== undefined) {
		const statuses = sanitizeStatuses(payload.statuses);
		if (statuses.length > 0) {
			sanitized.statuses = statuses;
		}
	}

	return sanitized;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Validação allowlist — apenas as chaves do contrato são lidas; nenhum
// HTML/CSS/JS vindo da API é aceito (apenas strings tipadas com formato válido).
function sanitizePortalConfig(raw: unknown): PortalConfig {
	const source = isRecord(raw) ? raw : {};

	const theme = isRecord(source.theme) ? source.theme : {};
	const assets = isRecord(source.assets) ? source.assets : {};

	return {
		platformName: sanitizePlatformName(source.platformName),
		solicitationMode: sanitizeSolicitationMode(source.solicitationMode),
		protocolMask: sanitizeProtocolMask(source.protocolMask),
		theme: {
			primaryColor: sanitizeHexColor(theme.primaryColor, DEFAULT_PORTAL_CONFIG.theme.primaryColor),
			secondaryColor: sanitizeHexColor(
				theme.secondaryColor,
				DEFAULT_PORTAL_CONFIG.theme.secondaryColor
			),
			backgroundColor: sanitizeHexColor(
				theme.backgroundColor,
				DEFAULT_PORTAL_CONFIG.theme.backgroundColor
			)
		},
		assets: {
			logoUrl: sanitizeAssetUrl(assets.logoUrl, DEFAULT_PORTAL_CONFIG.assets.logoUrl),
			avatarUrl: sanitizeAssetUrl(assets.avatarUrl, DEFAULT_PORTAL_CONFIG.assets.avatarUrl),
			faviconUrl: sanitizeAssetUrl(assets.faviconUrl, DEFAULT_PORTAL_CONFIG.assets.faviconUrl),
			loginImageUrl: sanitizeAssetUrl(
				assets.loginImageUrl,
				DEFAULT_PORTAL_CONFIG.assets.loginImageUrl
			)
		},
		categories: sanitizeCategories(source.categories),
		statuses: sanitizeStatuses(source.statuses)
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function sanitizePlatformName(value: unknown): string {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	return isValidPlatformName(trimmed) ? trimmed : DEFAULT_PORTAL_CONFIG.platformName;
}

function sanitizeSolicitationMode(value: unknown): SolicitationMode {
	return typeof value === 'string' && SOLICITATION_MODES.includes(value as SolicitationMode)
		? (value as SolicitationMode)
		: DEFAULT_PORTAL_CONFIG.solicitationMode;
}

function sanitizeProtocolMask(value: unknown): string {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	return isValidProtocolMask(trimmed) ? trimmed : DEFAULT_PORTAL_CONFIG.protocolMask;
}

function sanitizeHexColor(value: unknown, fallback: string): string {
	return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback;
}

function sanitizeAssetUrl(value: unknown, fallback: string): string {
	if (typeof value !== 'string') return fallback;

	const url = value.trim();
	return isValidAssetUrl(url) ? url : fallback;
}

// Categorias vindas da API ou do payload — itens estruturalmente válidos com
// nome/descrição dentro dos limites e nomes únicos. Descarta cada item inválido
// em vez de derrubar a lista toda; se nada restar ou não houver ao menos uma
// ativa, cai nas categorias padrão.
function sanitizeCategories(value: unknown): PortalCategory[] {
	if (!Array.isArray(value)) return structuredClone(DEFAULT_PORTAL_CONFIG.categories);

	const categories: PortalCategory[] = [];
	for (const item of value) {
		if (!isRecord(item)) continue;

		const name = typeof item.name === 'string' ? item.name.trim() : '';
		const description = typeof item.description === 'string' ? item.description.trim() : '';
		const isActive = item.isActive === true;

		if (
			typeof item.id === 'number' &&
			Number.isInteger(item.id) &&
			item.id > 0 &&
			isValidCategoryName(name) &&
			isValidCategoryDescription(description)
		) {
			categories.push({
				id: item.id,
				name,
				description,
				isActive
			});
		}
	}

	if (categories.length === 0) return structuredClone(DEFAULT_PORTAL_CONFIG.categories);

	if (categories.length > MAX_CATEGORIES) {
		return structuredClone(DEFAULT_PORTAL_CONFIG.categories);
	}

	if (!areCategoryNamesUnique(categories) || !hasActiveCategory(categories)) {
		return structuredClone(DEFAULT_PORTAL_CONFIG.categories);
	}

	return categories;
}

// Status do ciclo de vida vindos da API ou do payload — itens estruturalmente
// válidos (id inteiro positivo, nome nos limites, visibility/tone na allowlist,
// closesRequest booleano). Descarta cada item inválido em vez de derrubar a
// lista toda; se nada restar, exceder o limite ou repetir nomes, cai nos
// status padrão.
function sanitizeStatuses(value: unknown): PortalStatus[] {
	if (!Array.isArray(value)) return structuredClone(DEFAULT_PORTAL_CONFIG.statuses);

	const statuses: PortalStatus[] = [];
	for (const item of value) {
		if (!isRecord(item)) continue;

		const name = typeof item.name === 'string' ? item.name.trim() : '';
		const visibility = sanitizeStatusVisibility(item.visibility);
		const tone = sanitizeStatusTone(item.tone);
		const closesRequest = item.closesRequest === true;

		if (
			typeof item.id === 'number' &&
			Number.isInteger(item.id) &&
			item.id > 0 &&
			isValidStatusName(name)
		) {
			statuses.push({
				id: item.id,
				name,
				visibility,
				closesRequest,
				tone
			});
		}
	}

	if (statuses.length === 0) return structuredClone(DEFAULT_PORTAL_CONFIG.statuses);

	if (statuses.length > MAX_STATUSES) {
		return structuredClone(DEFAULT_PORTAL_CONFIG.statuses);
	}

	if (!areStatusNamesUnique(statuses)) {
		return structuredClone(DEFAULT_PORTAL_CONFIG.statuses);
	}

	return statuses;
}

function sanitizeStatusVisibility(value: unknown): StatusVisibility {
	return typeof value === 'string' && STATUS_VISIBILITIES.includes(value as StatusVisibility)
		? (value as StatusVisibility)
		: DEFAULT_PORTAL_CONFIG.statuses[0].visibility;
}

function sanitizeStatusTone(value: unknown): StatusTone {
	return typeof value === 'string' && STATUS_TONES.includes(value as StatusTone)
		? (value as StatusTone)
		: DEFAULT_PORTAL_CONFIG.statuses[0].tone;
}
