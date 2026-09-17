import {
	fetchPortalConfig,
	updateAccess,
	updateAssets,
	updateCategories,
	updateIdentity,
	updatePrioritizationWeights,
	updateStatuses,
	updateTheme
} from '$lib/config/portal-config.api';
import { DEFAULT_PORTAL_CONFIG, DEFAULT_PRIORITIZATION_WEIGHTS } from '$lib/config/portal-defaults';
import { ApiError, type Result } from '$lib/types/result';
import {
	isValidAssetFile,
	isValidAssetUrl,
	isValidCategoryName,
	isValidCategoryDescription,
	isValidStatusName,
	isValidPlatformName,
	isValidProtocolMask,
	isValidPrioritizationWeight,
	isValidHexColor,
	areCategoryNamesUnique,
	hasActiveCategory,
	areStatusNamesUnique,
	MAX_CATEGORIES,
	MAX_STATUSES,
	ASSET_FILE_RULES
} from '$lib/utils/validations';
import {
	ASSET_KEYS,
	PRIORITIZATION_CRITERIA,
	STATUS_TONES,
	STATUS_VISIBILITIES
} from '$lib/types/portal-config';
import type {
	AccessSection,
	AssetKey,
	AssetsSection,
	CategoriesSection,
	IdentitySection,
	PortalAssets,
	PortalCategory,
	PortalConfig,
	PortalAssetsPatch,
	PortalStatus,
	PortalTheme,
	PrioritizationWeights,
	PrioritizationWeightsSection,
	SolicitationMode,
	StatusesSection,
	StatusTone,
	StatusToneTokens,
	StatusVisibility,
	ThemeGradient,
	ThemeSection,
	ThemeTokens,
	UpdateAccessRequest,
	UpdateCategoriesRequest,
	UpdateIdentityRequest,
	UpdatePrioritizationWeightsRequest,
	UpdateStatusesRequest,
	UpdateThemeRequest
} from '$lib/types/portal-config';

// Invariante de ordem de chaves: as funções `sanitize*` reconstroem os objetos
// na mesma ordem de campos de `portal-defaults.ts`. O `SectionState` compara
// `draft` × `pristine`/defaults com `JSON.stringify` (ver
// `$lib/states/section.svelte`), e a ordem das chaves faz parte da serialização
// — reordenar um campo aqui (ou nos defaults) acusa diferença sem mudança de
// valor. Ao adicionar/mover campos, mantenha as duas ordens alinhadas.
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

// Converte a chamada de escrita em `Result` — nunca expõe exceção à UI. A
// mensagem da API é preservada quando existe (ex.: regra de negócio com 409);
// só cai no texto genérico por seção quando a resposta não traz mensagem.
async function persist<T>(section: string, fn: () => Promise<T>): Promise<Result<T>> {
	try {
		return { ok: true, data: await fn() };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message || `Não foi possível salvar ${section}.`
				}
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export function saveAccess(payload: UpdateAccessRequest): Promise<Result<AccessSection>> {
	return persist('o modo de acesso', async () => {
		const data = await updateAccess({
			solicitationMode: sanitizeSolicitationMode(payload.solicitationMode)
		});
		return { solicitationMode: sanitizeSolicitationMode(data.solicitationMode) };
	});
}

export function saveIdentity(payload: UpdateIdentityRequest): Promise<Result<IdentitySection>> {
	return persist('a identidade da plataforma', async () => {
		const request: UpdateIdentityRequest = {};
		if (payload.platformName !== undefined) {
			request.platformName = payload.platformName.trim();
		}
		if (payload.protocolMask !== undefined) {
			request.protocolMask = payload.protocolMask.trim();
		}

		const data = await updateIdentity(request);
		return {
			platformName: sanitizePlatformName(data.platformName),
			protocolMask: sanitizeProtocolMask(data.protocolMask)
		};
	});
}

export function saveTheme(payload: UpdateThemeRequest): Promise<Result<ThemeSection>> {
	return persist('a identidade visual', async () => {
		const data = await updateTheme({ theme: sanitizeTheme(payload.theme) });
		return { theme: sanitizeTheme(data.theme) };
	});
}

// Assets: valida localmente tipo/tamanho dos arquivos antes da rede (espelho das
// regras do contrato) e sanitiza as URLs do patch e da resposta.
export function saveAssets(
	patch: PortalAssetsPatch,
	files: Partial<Record<AssetKey, File>>
): Promise<Result<AssetsSection>> {
	for (const [key, file] of Object.entries(files) as [AssetKey, File | undefined][]) {
		if (!file) continue;

		const rule = ASSET_FILE_RULES[key];
		if (file.size > rule.maxBytes) {
			return Promise.resolve({
				ok: false,
				error: { message: 'Arquivo excede o tamanho máximo permitido.' }
			});
		}
		if (!isValidAssetFile(key, file)) {
			return Promise.resolve({
				ok: false,
				error: { message: 'Tipo de arquivo não permitido para este asset.' }
			});
		}
	}

	const sanitizedPatch: PortalAssetsPatch = {};
	for (const key of ASSET_KEYS) {
		const value = patch[key];
		if (typeof value === 'string' && isValidAssetUrl(value)) {
			sanitizedPatch[key] = value.trim();
		}
	}
	if (typeof patch.logoUsePrimaryColor === 'boolean') {
		sanitizedPatch.logoUsePrimaryColor = patch.logoUsePrimaryColor;
	}

	return persist('os assets', async () => {
		const data = await updateAssets(sanitizedPatch, files);
		return { assets: sanitizeAssets(data.assets) };
	});
}

export function saveCategories(
	payload: UpdateCategoriesRequest
): Promise<Result<CategoriesSection>> {
	return persist('as categorias', async () => {
		const data = await updateCategories({ categories: sanitizeCategories(payload.categories) });
		return { categories: sanitizeCategories(data.categories) };
	});
}

export function saveStatuses(payload: UpdateStatusesRequest): Promise<Result<StatusesSection>> {
	return persist('os status', async () => {
		const data = await updateStatuses({ statuses: sanitizeStatuses(payload.statuses) });
		return { statuses: sanitizeStatuses(data.statuses) };
	});
}

export function savePrioritizationWeights(
	payload: UpdatePrioritizationWeightsRequest
): Promise<Result<PrioritizationWeightsSection>> {
	return persist('os pesos da priorização', async () => {
		const data = await updatePrioritizationWeights({
			prioritizationWeights: sanitizePrioritizationWeights(payload.prioritizationWeights)
		});
		return {
			prioritizationWeights: sanitizePrioritizationWeights(data.prioritizationWeights)
		};
	});
}

// Validação allowlist — apenas as chaves do contrato são lidas; nenhum
// HTML/CSS/JS vindo da API é aceito (apenas strings tipadas com formato válido).
function sanitizePortalConfig(raw: unknown): PortalConfig {
	const source = isRecord(raw) ? raw : {};
	const assets = isRecord(source.assets) ? source.assets : {};

	return {
		platformName: sanitizePlatformName(source.platformName),
		solicitationMode: sanitizeSolicitationMode(source.solicitationMode),
		protocolMask: sanitizeProtocolMask(source.protocolMask),
		theme: sanitizeTheme(source.theme),
		assets: sanitizeAssets(assets),
		categories: sanitizeCategories(source.categories),
		statuses: sanitizeStatuses(source.statuses),
		prioritizationWeights: sanitizePrioritizationWeights(source.prioritizationWeights)
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
	const modes: readonly SolicitationMode[] = ['PUBLIC', 'AUTHENTICATED'];
	return typeof value === 'string' && modes.includes(value as SolicitationMode)
		? (value as SolicitationMode)
		: DEFAULT_PORTAL_CONFIG.solicitationMode;
}

function sanitizeProtocolMask(value: unknown): string {
	const trimmed = typeof value === 'string' ? value.trim() : '';
	return isValidProtocolMask(trimmed) ? trimmed : DEFAULT_PORTAL_CONFIG.protocolMask;
}

function sanitizeHexColor(value: unknown, fallback: string): string {
	return isValidHexColor(value) ? value.toLowerCase() : fallback;
}

// Tema vindo da API ou do payload — valida cada papel das duas paletas com
// fallback por token. A API não fornece tema hoje: `theme` ausente cai nos
// defaults locais e cada chave inválida cai no default daquela chave.
function sanitizeTheme(raw: unknown): PortalTheme {
	const source = isRecord(raw) ? raw : {};
	const fallback = DEFAULT_PORTAL_CONFIG.theme;

	return {
		light: sanitizeThemeTokens(source.light, fallback.light),
		dark: sanitizeThemeTokens(source.dark, fallback.dark)
	};
}

function sanitizeThemeTokens(raw: unknown, fallback: ThemeTokens): ThemeTokens {
	const source = isRecord(raw) ? raw : {};

	return {
		background: sanitizeHexColor(source.background, fallback.background),
		surface: sanitizeHexColor(source.surface, fallback.surface),
		border: sanitizeHexColor(source.border, fallback.border),
		textPrimary: sanitizeHexColor(source.textPrimary, fallback.textPrimary),
		textSecondary: sanitizeHexColor(source.textSecondary, fallback.textSecondary),
		richBlack: sanitizeHexColor(source.richBlack, fallback.richBlack),
		primary: sanitizeHexColor(source.primary, fallback.primary),
		secondary: sanitizeHexColor(source.secondary, fallback.secondary),
		tint: sanitizeHexColor(source.tint, fallback.tint),
		onPrimary: sanitizeHexColor(source.onPrimary, fallback.onPrimary),
		onDark: sanitizeHexColor(source.onDark, fallback.onDark),
		onGradient: sanitizeHexColor(source.onGradient, fallback.onGradient),
		gradient: sanitizeGradient(source.gradient, fallback.gradient),
		statuses: sanitizeStatusToneTokens(source.statuses, fallback.statuses)
	};
}

// Gradiente por paleta: `from`/`to` em hex e `angle` inteiro 0..360 (default do
// fallback quando ausente/ inválido).
function sanitizeGradient(raw: unknown, fallback: ThemeGradient): ThemeGradient {
	const source = isRecord(raw) ? raw : {};

	const angle =
		typeof source.angle === 'number' && Number.isFinite(source.angle)
			? Math.min(360, Math.max(0, Math.round(source.angle)))
			: fallback.angle;

	return {
		from: sanitizeHexColor(source.from, fallback.from),
		to: sanitizeHexColor(source.to, fallback.to),
		angle
	};
}

function sanitizeStatusToneTokens(
	raw: unknown,
	fallback: Record<StatusTone, StatusToneTokens>
): Record<StatusTone, StatusToneTokens> {
	const source = isRecord(raw) ? raw : {};
	const result = {} as Record<StatusTone, StatusToneTokens>;

	for (const tone of STATUS_TONES) {
		const toneSource = isRecord(source[tone]) ? source[tone] : {};
		const toneFallback = fallback[tone];

		result[tone] = {
			color: sanitizeHexColor(toneSource.color, toneFallback.color),
			background: sanitizeHexColor(toneSource.background, toneFallback.background),
			backgroundLocked: toneSource.backgroundLocked === true
		};
	}

	return result;
}

function sanitizeAssets(raw: unknown): PortalAssets {
	const source = isRecord(raw) ? raw : {};
	const fallback = DEFAULT_PORTAL_CONFIG.assets;

	const logoLightUrl = sanitizeAssetUrl(source.logoLightUrl, fallback.logoLightUrl);
	const avatarLightUrl = sanitizeAssetUrl(source.avatarLightUrl, fallback.avatarLightUrl);
	const loginImageLightUrl = sanitizeAssetUrl(
		source.loginImageLightUrl,
		fallback.loginImageLightUrl
	);
	const faviconLightUrl = sanitizeAssetUrl(source.faviconLightUrl, fallback.faviconLightUrl);

	// A variante escura cai para a clara quando ausente/inválida.
	return {
		logoLightUrl,
		logoDarkUrl: sanitizeAssetUrl(source.logoDarkUrl, logoLightUrl),
		logoUsePrimaryColor:
			typeof source.logoUsePrimaryColor === 'boolean'
				? source.logoUsePrimaryColor
				: fallback.logoUsePrimaryColor,
		avatarLightUrl,
		avatarDarkUrl: sanitizeAssetUrl(source.avatarDarkUrl, avatarLightUrl),
		loginImageLightUrl,
		loginImageDarkUrl: sanitizeAssetUrl(source.loginImageDarkUrl, loginImageLightUrl),
		faviconLightUrl,
		faviconDarkUrl: sanitizeAssetUrl(source.faviconDarkUrl, faviconLightUrl)
	};
}

function sanitizeAssetUrl(value: unknown, fallback: string): string {
	if (typeof value !== 'string') return fallback;

	const url = value.trim();
	// `blob:` é aceito apenas para o preview local do mock em desenvolvimento;
	// o backend real devolve URL relativa ou http(s) (contrato portal-config-api).
	if (isValidAssetUrl(url) || url.startsWith('blob:')) return url;

	return fallback;
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
			categories.push({ id: item.id, name, description, isActive });
		}
	}

	if (categories.length === 0) return structuredClone(DEFAULT_PORTAL_CONFIG.categories);
	if (categories.length > MAX_CATEGORIES) return structuredClone(DEFAULT_PORTAL_CONFIG.categories);
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
			statuses.push({ id: item.id, name, visibility, closesRequest, tone });
		}
	}

	if (statuses.length === 0) return structuredClone(DEFAULT_PORTAL_CONFIG.statuses);
	if (statuses.length > MAX_STATUSES) return structuredClone(DEFAULT_PORTAL_CONFIG.statuses);
	if (!areStatusNamesUnique(statuses)) return structuredClone(DEFAULT_PORTAL_CONFIG.statuses);

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

// Pesos de priorização vindos da API ou do payload — apenas as chaves da
// allowlist (PRIORITIZATION_CRITERIA) são lidas; cada peso precisa ser um inteiro
// de 1 a 10. Chave ausente ou valor inválido cai no default (1).
function sanitizePrioritizationWeights(value: unknown): PrioritizationWeights {
	const source = isRecord(value) ? value : {};
	const weights = {} as PrioritizationWeights;

	for (const criterion of PRIORITIZATION_CRITERIA) {
		weights[criterion] = isValidPrioritizationWeight(source[criterion])
			? (source[criterion] as number)
			: DEFAULT_PRIORITIZATION_WEIGHTS[criterion];
	}

	return weights;
}
