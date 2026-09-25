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
	hasActiveStatus,
	areStatusNamesUnique,
	MAX_CATEGORIES,
	MAX_STATUSES,
	ASSET_FILE_RULES
} from '$lib/utils/validations';
import {
	ASSET_KEYS,
	PRIORITIZATION_CRITERIA,
	STATUS_TONES,
	THEME_TOKEN_KEYS,
	type AssetKey,
	type AccessSection,
	type AssetsSection,
	type CategoriesSection,
	type IdentitySection,
	type PortalCategory,
	type PortalConfig,
	type PortalAssetsPatch,
	type PortalStatus,
	type PortalTheme,
	type PrioritizationWeightsSection,
	type PrioritizationWeights,
	type SolicitationMode,
	type StatusesSection,
	type StatusTone,
	type StatusToneTokens,
	type ThemeGradient,
	type ThemeSection,
	type ThemeTokens,
	type UpdateAccessRequest,
	type UpdateCategoriesRequest,
	type UpdateIdentityRequest,
	type UpdatePrioritizationWeightsRequest,
	type UpdateStatusesRequest,
	type UpdateThemeRequest
} from '$lib/types/portal-config';

// Estado do mock em memória — inicia com os defaults locais e recebe os PATCHes
// por seção durante a sessão de desenvolvimento. Espelha o contrato de
// `contratos/portal-config-api.md`.
let mockConfig: PortalConfig = structuredClone(DEFAULT_PORTAL_CONFIG);

const SOLICITATION_MODES: readonly SolicitationMode[] = ['PUBLIC', 'AUTHENTICATED'];

const MOCK_LATENCY_MS = 500;

// Rótulos de exibição dos modos — usados nas mensagens de erro do mock para
// refletir o que o usuário vê na tela (colunas Triagem/Mapeamento), não o
// valor técnico do contrato (`none`/`free`/`conclusion_only`).
const STATUS_MODE_LABELS: Record<string, string> = {
	none: '—',
	free: 'Livre',
	conclusion_only: 'Conclusão'
};

export function fetchPortalConfigMock(): Promise<PortalConfig> {
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(mockConfig));
}

// Leitura síncrona do modo atual — usada pelo mock de acompanhamento
// (`requester-tracking.mock`) para reproduzir o 403 do backend quando o
// portal está em AUTHENTICATED. Não altera comportamento existente.
export function getMockSolicitationMode(): SolicitationMode {
	return mockConfig.solicitationMode;
}

export function getMockStatuses(): PortalStatus[] {
	return structuredClone(mockConfig.statuses);
}

export function updateAccessMock(payload: UpdateAccessRequest): Promise<AccessSection> {
	if (!SOLICITATION_MODES.includes(payload.solicitationMode)) {
		throw new ApiError(400, 'Modo de solicitação inválido.');
	}

	mockConfig = { ...mockConfig, solicitationMode: payload.solicitationMode };
	return delay(MOCK_LATENCY_MS).then(() => ({ solicitationMode: mockConfig.solicitationMode }));
}

export function updateIdentityMock(payload: UpdateIdentityRequest): Promise<IdentitySection> {
	if (payload.platformName === undefined && payload.protocolMask === undefined) {
		throw new ApiError(400, 'Informe ao menos um campo da identidade.');
	}

	if (payload.platformName !== undefined) {
		if (!isValidPlatformName(payload.platformName)) {
			throw new ApiError(
				400,
				'Nome da plataforma deve ter entre 1 e 80 caracteres (após remover espaços).'
			);
		}
		mockConfig = { ...mockConfig, platformName: payload.platformName.trim() };
	}

	if (payload.protocolMask !== undefined) {
		if (!isValidProtocolMask(payload.protocolMask)) {
			throw new ApiError(
				400,
				'Máscara de protocolo deve ter entre 1 e 10 caracteres, apenas letras e números.'
			);
		}
		mockConfig = { ...mockConfig, protocolMask: payload.protocolMask.trim() };
	}

	return delay(MOCK_LATENCY_MS).then(() => ({
		platformName: mockConfig.platformName,
		protocolMask: mockConfig.protocolMask
	}));
}

export function updateThemeMock(payload: UpdateThemeRequest): Promise<ThemeSection> {
	validateTheme(payload.theme);
	mockConfig = { ...mockConfig, theme: structuredClone(payload.theme) };
	return delay(MOCK_LATENCY_MS).then(() => ({ theme: structuredClone(mockConfig.theme) }));
}

// Assets: simula o commit atômico do multipart. Cada arquivo enviado vira uma
// URL local (object URL) e cada URL do patch é aplicada diretamente.
export function updateAssetsMock(
	patch: PortalAssetsPatch,
	files: Partial<Record<AssetKey, File>>
): Promise<AssetsSection> {
	// Espelha o guard do backend: exige ao menos uma parte (JSON com chaves ou
	// arquivo). Um PATCH sem nenhuma das duas é rejeitado.
	const hasFiles = Object.values(files).some((file) => Boolean(file));
	if (Object.keys(patch).length === 0 && !hasFiles) {
		throw new ApiError(400, 'Envie ao menos uma chave de asset (JSON ou arquivo).');
	}

	for (const key of Object.keys(patch)) {
		if (key === 'logoUsePrimaryColor') {
			if (typeof patch.logoUsePrimaryColor !== 'boolean') {
				throw new ApiError(400, 'Valor inválido para "assets.logoUsePrimaryColor".');
			}
			continue;
		}
		if (!ASSET_KEYS.includes(key as AssetKey)) {
			throw new ApiError(400, `Campo não permitido em "assets": "${key}".`);
		}
		const url = patch[key as AssetKey];
		if (typeof url !== 'string' || !isValidAssetUrl(url)) {
			throw new ApiError(400, `Valor inválido para "assets.${key}": URL relativa ou http(s).`);
		}
	}

	for (const [key, file] of Object.entries(files) as [AssetKey, File | undefined][]) {
		if (!file) continue;

		if (!ASSET_KEYS.includes(key)) {
			throw new ApiError(400, `Tipo de asset não permitido: "${key}".`);
		}
		if (file.size > ASSET_FILE_RULES[key].maxBytes) {
			throw new ApiError(413, 'Arquivo excede o tamanho máximo permitido.');
		}
		if (!isValidAssetFile(key, file)) {
			throw new ApiError(415, 'Tipo de arquivo não permitido para este asset.');
		}
	}

	const nextAssets = { ...mockConfig.assets };

	for (const key of Object.keys(patch)) {
		if (key === 'logoUsePrimaryColor') {
			nextAssets.logoUsePrimaryColor = patch.logoUsePrimaryColor === true;
			continue;
		}
		nextAssets[key as AssetKey] = patch[key as AssetKey] as string;
	}
	for (const [key, file] of Object.entries(files) as [AssetKey, File | undefined][]) {
		if (file) nextAssets[key] = URL.createObjectURL(file);
	}

	mockConfig = { ...mockConfig, assets: nextAssets };
	return delay(MOCK_LATENCY_MS).then(() => ({ assets: structuredClone(mockConfig.assets) }));
}

export function updateCategoriesMock(payload: UpdateCategoriesRequest): Promise<CategoriesSection> {
	validateCategories(payload.categories);
	mockConfig = { ...mockConfig, categories: structuredClone(payload.categories) };
	return delay(MOCK_LATENCY_MS).then(() => ({
		categories: structuredClone(mockConfig.categories)
	}));
}

export function updateStatusesMock(payload: UpdateStatusesRequest): Promise<StatusesSection> {
	validateStatuses(payload.statuses);
	mockConfig = { ...mockConfig, statuses: structuredClone(payload.statuses) };
	return delay(MOCK_LATENCY_MS).then(() => ({ statuses: structuredClone(mockConfig.statuses) }));
}

export function updatePrioritizationWeightsMock(
	payload: UpdatePrioritizationWeightsRequest
): Promise<PrioritizationWeightsSection> {
	validatePrioritizationWeights(payload.prioritizationWeights);
	mockConfig = {
		...mockConfig,
		prioritizationWeights: { ...payload.prioritizationWeights }
	};
	return delay(MOCK_LATENCY_MS).then(() => ({
		prioritizationWeights: { ...mockConfig.prioritizationWeights }
	}));
}

// O tema é atômico: as duas paletas completas (light/dark), cada uma com todos
// os papéis em hex válido e os cinco tons de status com color/background.
function validateTheme(theme: PortalTheme): void {
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
	validateGradient(tokens.gradient, palette);
}

// Gradiente por paleta: `from`/`to` em hex e `angle` opcional inteiro 0..360.
function validateGradient(gradient: ThemeGradient, palette: 'light' | 'dark'): void {
	if (typeof gradient !== 'object' || gradient === null) {
		throw new ApiError(400, `O gradiente da paleta "${palette}" deve ser um objeto.`);
	}

	for (const key of ['from', 'to'] as const) {
		if (!isValidHexColor(gradient[key])) {
			throw new ApiError(
				400,
				`Cor inválida em "theme.${palette}.gradient.${key}" (esperado #RRGGBB ou #RRGGBBAA).`
			);
		}
	}

	if (
		gradient.angle !== undefined &&
		(!Number.isInteger(gradient.angle) || gradient.angle < 0 || gradient.angle > 360)
	) {
		throw new ApiError(400, `"theme.${palette}.gradient.angle" deve ser inteiro entre 0 e 360.`);
	}
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

		for (const key of ['color', 'background'] as const) {
			if (!isValidHexColor(token[key])) {
				throw new ApiError(
					400,
					`Cor inválida em "theme.${palette}.statuses.${tone}.${key}" (esperado #RRGGBB ou #RRGGBBAA).`
				);
			}
		}

		if (typeof token.backgroundLocked !== 'boolean') {
			throw new ApiError(
				400,
				`"theme.${palette}.statuses.${tone}.backgroundLocked" deve ser booleano.`
			);
		}
	}
}

// A lista de categorias é atômica: 1..50 itens, ids presentes, nomes únicos
// (sem diferenciar maiúsculas) e ao menos uma categoria ativa.
function validateCategories(categories: PortalCategory[]): void {
	if (!Array.isArray(categories) || categories.length === 0 || categories.length > MAX_CATEGORIES) {
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

// A lista de status é atômica: 1..50 itens, ids presentes,
// isCore/isPublic/isTerminal/triageMode/mappingMode/isRestricted, nomes únicos
// e ao menos um ativo. A ordem de exibição é a ordem do array. 409 para
// rename/remove core (7 vitais).
function validateStatuses(statuses: PortalStatus[]): void {
	if (!Array.isArray(statuses) || statuses.length === 0 || statuses.length > MAX_STATUSES) {
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
		if (typeof status.isCore !== 'boolean') {
			throw new ApiError(400, 'Campo "isCore" deve ser booleano.');
		}
		if (typeof status.isPublic !== 'boolean') {
			throw new ApiError(400, 'Campo "isPublic" deve ser booleano.');
		}
		if (typeof status.isTerminal !== 'boolean') {
			throw new ApiError(400, 'Campo "isTerminal" deve ser booleano.');
		}
		if (!STATUS_TONES.includes(status.tone)) {
			throw new ApiError(400, 'Tom visual não permitido para o status.');
		}
		if (typeof status.isActive !== 'boolean') {
			throw new ApiError(400, 'Campo "isActive" deve ser booleano.');
		}
		if (!['none', 'free', 'conclusion_only'].includes(status.triageMode as string)) {
			throw new ApiError(400, 'Campo "triageMode" deve ser none|free|conclusion_only.');
		}
		if (!['none', 'free', 'conclusion_only'].includes(status.mappingMode as string)) {
			throw new ApiError(400, 'Campo "mappingMode" deve ser none|free|conclusion_only.');
		}
		if (typeof status.isRestricted !== 'boolean') {
			throw new ApiError(400, 'Campo "isRestricted" deve ser booleano.');
		}
	}

	if (!areStatusNamesUnique(statuses)) {
		throw new ApiError(400, 'Nomes de status não podem se repetir.');
	}
	if (statuses.some((s) => s.isCore && !s.isActive)) {
		throw new ApiError(400, 'Status vital (isCore) não pode ser inativado.');
	}
	if (
		statuses.some((s) => s.isRestricted && (s.triageMode !== 'none' || s.mappingMode !== 'none'))
	) {
		const conflict = statuses.find(
			(s) => s.isRestricted && (s.triageMode !== 'none' || s.mappingMode !== 'none')
		) as PortalStatus;
		const parts: string[] = [];
		if (conflict.triageMode !== 'none') {
			parts.push(`Triagem como “${STATUS_MODE_LABELS[conflict.triageMode]}”`);
		}
		if (conflict.mappingMode !== 'none') {
			parts.push(`Mapeamento como “${STATUS_MODE_LABELS[conflict.mappingMode]}”`);
		}
		throw new ApiError(
			400,
			`O status “${conflict.name}” está Restrito mas tem ${parts.join(' e ')}. Defina ambos como “—” antes de salvar.`
		);
	}
	const defaultNames = new Map<number, string>([
		[1, 'Solicitação enviada'],
		[3, 'Em triagem'],
		[4, 'Pendente de informações'],
		[6, 'Mapeamento agendado'],
		[7, 'Em mapeamento'],
		[16, 'Concluído'],
		[17, 'Cancelado']
	]);
	for (const s of statuses) {
		const expected = defaultNames.get(s.id);
		if (expected && s.name !== expected) {
			throw new ApiError(409, `Status vital "${expected}" não pode ser renomeado.`);
		}
	}
	if (statuses.filter((s) => [1, 3, 4, 6, 7, 16, 17].includes(s.id)).length !== 7) {
		throw new ApiError(409, 'Status vitais não podem ser removidos.');
	}

	if (!hasActiveStatus(statuses)) {
		throw new ApiError(400, 'Ao menos um status deve estar ativo.');
	}
}

// O objeto de pesos é completo e atômico: todas as chaves da allowlist devem
// estar presentes, cada peso é um inteiro de 1 a 10.
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
			throw new ApiError(400, 'Peso de priorização deve ser um inteiro de 1 a 10.');
		}
	}

	if (seen.size !== PRIORITIZATION_CRITERIA.length) {
		throw new ApiError(400, 'Envie todos os critérios de priorização com seus pesos.');
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
