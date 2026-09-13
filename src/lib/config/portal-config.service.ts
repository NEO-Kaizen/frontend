import { fetchPortalConfig, updatePortalConfig } from '$lib/config/portal-config.api';
import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import { ApiError, type Result } from '$lib/types/result';
import { isValidPlatformName, isValidProtocolMask } from '$lib/utils/validations';
import type {
	PortalConfig,
	SolicitationMode,
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

// Persiste atualizações parciais da configuração (PATCH). Valida só a allowlist
// antes de enviar e sanitiza a resposta do backend; nunca expõe exceção à UI.
export async function savePortalConfig(
	payload: UpdatePortalConfigPayload
): Promise<Result<PortalConfig>> {
	try {
		const raw = await updatePortalConfig(payload);
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
		}
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
	if (!url) return fallback;

	// Caminho relativo do próprio app (assets empacotados) é aceito direto.
	if (url.startsWith('/')) return url;

	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : fallback;
	} catch {
		return fallback;
	}
}
