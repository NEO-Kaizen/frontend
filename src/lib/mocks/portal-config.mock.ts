import { ApiError } from '$lib/types/result';
import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
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
	STATUS_VISIBILITIES,
	THEME_TOKEN_KEYS,
	type AssetKey,
	type PortalCategory,
	type PortalConfig,
	type PortalAssetsPatch,
	type PortalStatus,
	type PortalTheme,
	type PrioritizationWeights,
	type SolicitationMode,
	type StatusTone,
	type StatusToneTokens,
	type ThemeTokens,
	type UpdatePortalConfigPayload
} from '$lib/types/portal-config';

// Estado do mock em memória — inicia com os defaults locais e recebe os PATCHes
// durante a sessão de desenvolvimento. Espelha o contrato de CONTRATO-BACKEND.md.
let mockConfig: PortalConfig = structuredClone(DEFAULT_PORTAL_CONFIG);

const SOLICITATION_MODES: readonly SolicitationMode[] = ['PUBLIC', 'AUTHENTICATED'];

// Allowlist espelhada do contrato: o mock rejeita exatamente o que a API real
// rejeitaria (campo desconhecido ou valor fora dos aceitos).
const ALLOWED_UPDATE_FIELDS: readonly (keyof UpdatePortalConfigPayload)[] = [
	'solicitationMode',
	'platformName',
	'protocolMask',
	'theme',
	'assets',
	'categories',
	'statuses',
	'prioritizationWeights'
];

const MOCK_LATENCY_MS = 500;

export function fetchPortalConfigMock(): Promise<PortalConfig> {
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(mockConfig));
}

export function updatePortalConfigMock(payload: UpdatePortalConfigPayload): Promise<PortalConfig> {
	validateUpdatePayload(payload);
	mockConfig = {
		...mockConfig,
		...payload,
		// `assets` é parcial: mescla só as chaves enviadas sobre o estado atual.
		assets: payload.assets ? { ...mockConfig.assets, ...payload.assets } : mockConfig.assets
	};
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(mockConfig));
}

// Upload de asset — aceita apenas kinds da allowlist e arquivos dentro das
// regras do contrato (tipo/tamanho por kind). Retorna um object URL local;
// o mock não persiste entre reinícios do dev server (dados fictícios).
export function uploadAssetMock(asset: AssetKey, file: File): Promise<string> {
	if (!ASSET_KEYS.includes(asset)) {
		return Promise.reject(new ApiError(400, `Tipo de asset não permitido: "${asset}".`));
	}

	if (file.size > ASSET_FILE_RULES[asset].maxBytes) {
		return Promise.reject(new ApiError(413, 'Arquivo excede o tamanho máximo permitido.'));
	}

	if (!isValidAssetFile(asset, file)) {
		return Promise.reject(new ApiError(415, 'Tipo de arquivo não permitido para este asset.'));
	}

	return delay(MOCK_LATENCY_MS).then(() => URL.createObjectURL(file));
}

function validateUpdatePayload(payload: UpdatePortalConfigPayload): void {
	for (const field of Object.keys(payload) as (keyof UpdatePortalConfigPayload)[]) {
		if (!ALLOWED_UPDATE_FIELDS.includes(field)) {
			throw new ApiError(400, `Campo não permitido: "${field}".`);
		}
	}

	if (
		payload.solicitationMode !== undefined &&
		!SOLICITATION_MODES.includes(payload.solicitationMode)
	) {
		throw new ApiError(400, 'Modo de solicitação inválido.');
	}

	if (payload.platformName !== undefined && !isValidPlatformName(payload.platformName)) {
		throw new ApiError(
			400,
			'Nome da plataforma deve ter entre 1 e 80 caracteres (após remover espaços).'
		);
	}

	if (payload.protocolMask !== undefined && !isValidProtocolMask(payload.protocolMask)) {
		throw new ApiError(
			400,
			'Máscara de protocolo deve ter entre 1 e 10 caracteres, apenas letras e números.'
		);
	}

	if (payload.theme !== undefined) {
		validateThemePatch(payload.theme);
	}

	if (payload.assets !== undefined) {
		validateAssetsPatch(payload.assets);
	}

	if (payload.categories !== undefined) {
		validateCategoriesPatch(payload.categories);
	}

	if (payload.statuses !== undefined) {
		validateStatusesPatch(payload.statuses);
	}

	if (payload.prioritizationWeights !== undefined) {
		validatePrioritizationWeights(payload.prioritizationWeights);
	}
}

// O tema é atômico: as duas paletas completas (light/dark), cada uma com todos
// os papéis em hex válido e os quatro tons de status com color/background/text.
function validateThemePatch(theme: PortalTheme): void {
	if (typeof theme !== 'object' || theme === null) {
		throw new ApiError(400, 'O tema deve ser um objeto com as paletas "light" e "dark".');
	}

	validateThemeTokens(theme.light, 'light');
	validateThemeTokens(theme.dark, 'dark');
}

function validateThemeTokens(tokens: ThemeTokens, palette: 'light' | 'dark'): void {
	if (typeof tokens !== 'object' || tokens === null) {
		throw new ApiError(400, `A paleta "${palette}" do tema deve ser um objeto.`);
	}

	for (const key of THEME_TOKEN_KEYS) {
		if (!isValidHexColor(tokens[key])) {
			throw new ApiError(400, `Cor inválida em "theme.${palette}.${key}" (esperado #RRGGBB).`);
		}
	}

	validateStatusToneTokens(tokens.statuses, palette);
}

function validateStatusToneTokens(
	statuses: Record<StatusTone, StatusToneTokens>,
	palette: 'light' | 'dark'
): void {
	if (typeof statuses !== 'object' || statuses === null) {
		throw new ApiError(400, `Os tons de status da paleta "${palette}" devem ser um objeto.`);
	}

	for (const tone of STATUS_TONES) {
		const token = statuses[tone];
		if (typeof token !== 'object' || token === null) {
			throw new ApiError(400, `Tom de status inválido em "theme.${palette}.statuses.${tone}".`);
		}

		for (const key of ['color', 'background', 'text'] as const) {
			if (!isValidHexColor(token[key])) {
				throw new ApiError(
					400,
					`Cor inválida em "theme.${palette}.statuses.${tone}.${key}" (esperado #RRGGBB).`
				);
			}
		}
	}
}

// Valida o objeto parcial de assets: apenas chaves da allowlist e URLs com
// formato aceito (relativo do próprio app ou http/https).
function validateAssetsPatch(assets: PortalAssetsPatch): void {
	for (const key of Object.keys(assets) as AssetKey[]) {
		if (!ASSET_KEYS.includes(key)) {
			throw new ApiError(400, `Campo não permitido em "assets": "${key}".`);
		}

		const url = assets[key];
		if (typeof url !== 'string' || !isValidAssetUrl(url)) {
			throw new ApiError(400, `Valor inválido para "assets.${key}": URL relativa ou http(s).`);
		}
	}
}

// A lista de categorias é atômica: 1..50 itens, ids presentes, nomes únicos
// (sem diferenciar maiúsculas) e ao menos uma categoria ativa.
function validateCategoriesPatch(categories: PortalCategory[]): void {
	if (categories.length === 0 || categories.length > MAX_CATEGORIES) {
		throw new ApiError(400, 'A lista de categorias deve ter entre 1 e 50 itens.');
	}

	for (const category of categories) {
		if (!Number.isInteger(category.id) || category.id <= 0) {
			throw new ApiError(400, 'Cada categoria precisa de um "id" inteiro positivo.');
		}
		if (!isValidCategoryName(category.name)) {
			throw new ApiError(
				400,
				'Nome da categoria deve ter entre 1 e 40 caracteres (após remover espaços).'
			);
		}
		if (!isValidCategoryDescription(category.description)) {
			throw new ApiError(400, 'Descrição da categoria deve ter no máximo 200 caracteres.');
		}
		if (typeof category.isActive !== 'boolean') {
			throw new ApiError(400, 'Campo "isActive" deve ser booleano.');
		}
	}

	if (!areCategoryNamesUnique(categories)) {
		throw new ApiError(400, 'Nomes de categoria não podem se repetir.');
	}

	if (!hasActiveCategory(categories)) {
		throw new ApiError(400, 'Ao menos uma categoria deve estar ativa.');
	}
}

// A lista de status é atômica: 1..50 itens, ids presentes, visibility/tone na
// allowlist, closesRequest booleano e nomes únicos (sem diferenciar maiúsculas).
function validateStatusesPatch(statuses: PortalStatus[]): void {
	if (statuses.length === 0 || statuses.length > MAX_STATUSES) {
		throw new ApiError(400, 'A lista de status deve ter entre 1 e 50 itens.');
	}

	for (const status of statuses) {
		if (!Number.isInteger(status.id) || status.id <= 0) {
			throw new ApiError(400, 'Cada status precisa de um "id" inteiro positivo.');
		}
		if (!isValidStatusName(status.name)) {
			throw new ApiError(
				400,
				'Nome do status deve ter entre 1 e 40 caracteres (após remover espaços).'
			);
		}
		if (!STATUS_VISIBILITIES.includes(status.visibility)) {
			throw new ApiError(400, 'Visibilidade deve ser "PUBLIC" ou "INTERNAL".');
		}
		if (typeof status.closesRequest !== 'boolean') {
			throw new ApiError(400, 'Campo "closesRequest" deve ser booleano.');
		}
		if (!STATUS_TONES.includes(status.tone)) {
			throw new ApiError(400, 'Tom visual não permitido para o status.');
		}
	}

	if (!areStatusNamesUnique(statuses)) {
		throw new ApiError(400, 'Nomes de status não podem se repetir.');
	}
}

// O objeto de pesos é completo e atômico: todas as chaves da allowlist devem
// estar presentes, cada peso dentro de 1.0..5.0 (passo 0.5).
function validatePrioritizationWeights(weights: PrioritizationWeights): void {
	if (typeof weights !== 'object' || weights === null) {
		throw new ApiError(400, 'Os pesos da priorização devem ser um objeto.');
	}

	const seen = new Set<string>();
	for (const key of Object.keys(weights)) {
		if (!PRIORITIZATION_CRITERIA.includes(key as (typeof PRIORITIZATION_CRITERIA)[number])) {
			throw new ApiError(400, `Critério de priorização não permitido: "${key}".`);
		}
		if (seen.has(key)) {
			throw new ApiError(400, `Critério de priorização duplicado: "${key}".`);
		}
		seen.add(key);

		if (!isValidPrioritizationWeight(weights[key as keyof typeof weights])) {
			throw new ApiError(400, 'Peso de priorização deve estar entre 1.0 e 5.0 (passo 0.5).');
		}
	}

	if (seen.size !== PRIORITIZATION_CRITERIA.length) {
		throw new ApiError(400, 'Envie todos os critérios de priorização com seus pesos.');
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
