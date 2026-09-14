import { apiClient } from '$lib/api/client';
import { MOCK_DOMAINS } from '$lib/mocks';
import type { AssetKey, PortalConfig, UpdatePortalConfigPayload } from '$lib/types/portal-config';

const PORTAL_CONFIG_PATH = '/portal-config';
const ASSETS_PATH = '/assets';

// Leitura da configuração pública do portal. Endpoint real definido pelo
// contrato (CONTRATO-BACKEND.md); em dev o mock retorna o estado em memória
// fechando o loop com o PATCH (dados fictícios, nunca reais).
export async function fetchPortalConfig(): Promise<PortalConfig> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { fetchPortalConfigMock } = await import('$lib/mocks/portal-config.mock');
		return fetchPortalConfigMock();
	}

	return apiClient<PortalConfig>(PORTAL_CONFIG_PATH);
}

// Atualização parcial (PATCH) da configuração — área administrativa. Envia
// apenas os campos alterados da allowlist; a resposta traz o estado completo.
export async function updatePortalConfig(
	payload: UpdatePortalConfigPayload
): Promise<PortalConfig> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { updatePortalConfigMock } = await import('$lib/mocks/portal-config.mock');
		return updatePortalConfigMock(payload);
	}

	return apiClient<PortalConfig>(PORTAL_CONFIG_PATH, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

// Upload de um asset do portal (Card 4). Em DEV o mock retorna um object URL
// local (dados fictícios); o endpoint real recebe multipart com o kind do asset
// e o arquivo, respondendo com a URL definitiva para salvar no PATCH.
export async function uploadAssetApi(asset: AssetKey, file: File): Promise<string> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.portalConfig) {
		const { uploadAssetMock } = await import('$lib/mocks/portal-config.mock');
		return uploadAssetMock(asset, file);
	}

	const body = new FormData();
	body.append('asset', asset);
	body.append('file', file);

	const data = await apiClient<{ url: string }>(ASSETS_PATH, {
		method: 'POST',
		body
	});

	return data.url;
}
