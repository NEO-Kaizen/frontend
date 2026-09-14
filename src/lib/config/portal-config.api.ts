import { apiClient } from '$lib/api/client';
import type { PortalConfig } from '$lib/types/portal-config';

const PORTAL_CONFIG_PATH = '/portal-config';

// Leitura da configuração pública do portal. O endpoint real é definido pela
// issue #90; até lá este caminho falha e o service aplica os defaults locais.
// Quando o contrato existir, o mock de config entra em `mocks/` seguindo o
// padrão dos demais domínios (toggle via MOCK_DOMAINS, DEV inline).
export async function fetchPortalConfig(fetchImpl?: typeof fetch): Promise<PortalConfig> {
	return apiClient<PortalConfig>(PORTAL_CONFIG_PATH, {}, fetchImpl);
}
