import { base } from '$app/paths';
import { fetchPortalConfig } from '$lib/config/portal-config.api';
import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import type { PortalConfig, SolicitationMode } from '$lib/types/portal-config';

// Carrega a configuração do portal com fallback. Nunca joga exceção para o
// layout: qualquer falha de rede ou valor inválido cai no default local por
// campo — a aplicação permanece utilizável (critério #89/#96).
export async function loadPortalConfig(fetchImpl?: typeof fetch): Promise<PortalConfig> {
	try {
		const raw = await fetchPortalConfig(fetchImpl);
		return sanitizePortalConfig(raw);
	} catch (error) {
		console.warn('[portal-config] Falha ao carregar configuração; usando defaults.', error);
		return DEFAULT_PORTAL_CONFIG;
	}
}

const SOLICITATION_MODES: readonly SolicitationMode[] = ['PUBLIC', 'AUTHENTICATED'];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const MAX_PLATFORM_NAME_LENGTH = 80;

// Prefixo de protocolo: apenas o primeiro bloco, com caracteres seguros de
// exibição (letras/dígitos/hífen). Sem espaços ou símbolos arbitrários.
const PROTOCOL_MASK = /^[A-Za-z0-9-]+$/;
const MAX_PROTOCOL_MASK_LENGTH = 40;

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
	return trimmed.length > 0 && trimmed.length <= MAX_PLATFORM_NAME_LENGTH
		? trimmed
		: DEFAULT_PORTAL_CONFIG.platformName;
}

function sanitizeSolicitationMode(value: unknown): SolicitationMode {
	return typeof value === 'string' && SOLICITATION_MODES.includes(value as SolicitationMode)
		? (value as SolicitationMode)
		: DEFAULT_PORTAL_CONFIG.solicitationMode;
}

function sanitizeProtocolMask(value: unknown): string {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	return trimmed.length > 0 &&
		trimmed.length <= MAX_PROTOCOL_MASK_LENGTH &&
		PROTOCOL_MASK.test(trimmed)
		? trimmed
		: DEFAULT_PORTAL_CONFIG.protocolMask;
}

function sanitizeHexColor(value: unknown, fallback: string): string {
	return typeof value === 'string' && HEX_COLOR.test(value) ? value : fallback;
}

function sanitizeAssetUrl(value: unknown, fallback: string): string {
	if (typeof value !== 'string') return fallback;

	const url = value.trim();
	if (!url) return fallback;

	// Assets públicos enviados pelo painel e armazenados pelo backend.
	// Quando a aplicação está publicada/deploy em um subcaminho, transforma:
	// /uploads/portal/imagem.png
	// em:
	// /server03/uploads/portal/imagem.png
	if (url.startsWith('/uploads/portal/')) {
		return `${base}${url}`;
	}

	// Outros assets internos já são processados pelo build do SvelteKit. Continuam aqui.
	// Caminho relativo do próprio app (assets empacotados) é aceito direto.
	if (url.startsWith('/')) return url;

	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : fallback;
	} catch {
		return fallback;
	}
}
