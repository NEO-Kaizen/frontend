import { apiClient } from '$lib/api/client';
import type { PortalConfig } from '$lib/types/portal-config';

const PORTAL_CONFIG_PATH = '/portal-config';

// Leitura da configuração pública do portal. O endpoint real é definido pela
// issue #90; em dev o mock server-side (middleware Vite, domínio
// `portal-config`) responde `/portal-config` e o service valida/fallback.
export async function fetchPortalConfig(fetchImpl?: typeof fetch): Promise<PortalConfig> {
	return apiClient<PortalConfig>(PORTAL_CONFIG_PATH, {}, fetchImpl);
}
