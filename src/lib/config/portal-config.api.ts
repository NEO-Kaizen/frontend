import { apiClient } from '$lib/api/client';
import { MOCK_DOMAINS } from '$lib/mocks';
import { ApiError } from '$lib/types/result';
import type {
	AccessSection,
	AssetKey,
	AssetsSection,
	CategoriesSection,
	IdentitySection,
	PortalAssetsPatch,
	PortalConfig,
	PrioritizationWeightsSection,
	StatusesSection,
	ThemeSection,
	UpdateAccessRequest,
	UpdateCategoriesRequest,
	UpdateIdentityRequest,
	UpdatePrioritizationWeightsRequest,
	UpdateStatusesRequest,
	UpdateThemeRequest
} from '$lib/types/portal-config';

const PORTAL_CONFIG_PATH = '/portal-config';
const ASSETS_SECTION_PATH = `${PORTAL_CONFIG_PATH}/assets`;

// Leitura da configuração pública do portal (GET). O endpoint real é definido
// pela issue #90; em dev o mock retorna o estado em memória.
export async function fetchPortalConfig(fetchImpl?: typeof fetch): Promise<PortalConfig> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { fetchPortalConfigMock } = await import('$lib/mocks/portal-config.mock');
		return fetchPortalConfigMock();
	}

	return apiClient<PortalConfig>(PORTAL_CONFIG_PATH, {}, fetchImpl);
}

// Escrita por seção (PATCH /portal-config/:section) — cada card salva a sua
// seção de forma independente; o backend retorna apenas a seção consolidada.
async function patchSection<T>(section: string, body: unknown): Promise<T> {
	return apiClient<T>(`${PORTAL_CONFIG_PATH}/${section}`, {
		method: 'PATCH',
		body: JSON.stringify(body)
	});
}

export async function updateAccess(payload: UpdateAccessRequest): Promise<AccessSection> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updateAccessMock } = await import('$lib/mocks/portal-config.mock');
		return updateAccessMock(payload);
	}

	return patchSection<AccessSection>('access', payload);
}

export async function updateIdentity(payload: UpdateIdentityRequest): Promise<IdentitySection> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updateIdentityMock } = await import('$lib/mocks/portal-config.mock');
		return updateIdentityMock(payload);
	}

	return patchSection<IdentitySection>('identity', payload);
}

export async function updateTheme(payload: UpdateThemeRequest): Promise<ThemeSection> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updateThemeMock } = await import('$lib/mocks/portal-config.mock');
		return updateThemeMock(payload);
	}

	return patchSection<ThemeSection>('theme', payload);
}

// Assets (PATCH multipart): a parte `assets` (JSON) traz as chaves definidas por
// URL e as partes nomeadas por chave trazem os binários novos. A parte JSON só é
// enviada quando há URLs/flag a definir — um upload apenas de binário omite o
// `assets`, evitando o 400 de "ao menos uma chave de asset". Commit atômico.
// Guard em dev/prod evita enviar multipart vazio (paridade com mock).
export async function updateAssets(
	patch: PortalAssetsPatch,
	files: Partial<Record<AssetKey, File>>
): Promise<AssetsSection> {
	const hasFiles = Object.values(files).some(Boolean);
	if (Object.keys(patch).length === 0 && !hasFiles) {
		throw new ApiError(400, 'Envie ao menos uma chave de asset (JSON ou arquivo).');
	}

	const body = new FormData();
	if (Object.keys(patch).length > 0) {
		body.append('assets', JSON.stringify(patch));
	}

	for (const [key, file] of Object.entries(files) as [AssetKey, File | undefined][]) {
		if (file) body.append(key, file);
	}

	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updateAssetsMock } = await import('$lib/mocks/portal-config.mock');
		return updateAssetsMock(patch, files);
	}

	return apiClient<AssetsSection>(ASSETS_SECTION_PATH, { method: 'PATCH', body });
}

export async function updateCategories(
	payload: UpdateCategoriesRequest
): Promise<CategoriesSection> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updateCategoriesMock } = await import('$lib/mocks/portal-config.mock');
		return updateCategoriesMock(payload);
	}

	return patchSection<CategoriesSection>('categories', payload);
}

export async function updateStatuses(payload: UpdateStatusesRequest): Promise<StatusesSection> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updateStatusesMock } = await import('$lib/mocks/portal-config.mock');
		return updateStatusesMock(payload);
	}

	return patchSection<StatusesSection>('statuses', payload);
}

export async function updatePrioritizationWeights(
	payload: UpdatePrioritizationWeightsRequest
): Promise<PrioritizationWeightsSection> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updatePrioritizationWeightsMock } = await import('$lib/mocks/portal-config.mock');
		return updatePrioritizationWeightsMock(payload);
	}

	return patchSection<PrioritizationWeightsSection>('prioritization-weights', payload);
}
