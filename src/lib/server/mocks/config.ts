// Configuração do mock server-side. Este módulo (e todo o diretório `mocks/`)
// só é carregado pelo plugin de desenvolvimento (`apply: 'serve'`), portanto
// nunca entra no bundle de produção nem no código do app.
//
// O cliente sempre fala com `PUBLIC_API_URL`; em dev ele aponta para `/__mock`.

// Base HTTP sob a qual o app aponta em desenvolvimento (`PUBLIC_API_URL`).
export const MOCK_API_PREFIX = '/__mock';

// Domínios da API atendidos pelo middleware.
export type MockDomain = 'auth' | 'users' | 'request' | 'prioritization' | 'portal-config';

// Interruptor global: `false` faz todos os domínios irem para o backend real
// via proxy. Basta trocar aqui (arquivo dev-only, nunca empacotado) para
// desligar o mock por completo sem mexer no `.env`.
export const USE_MOCK_API = true;

// Granularidade por domínio: `false` encaminha o domínio para o backend real
// (`PUBLIC_REAL_API_URL`), permitindo migrar um domínio de cada vez.
export const MOCK_DOMAINS: Record<MockDomain, boolean> = {
	auth: true,
	users: true,
	request: true,
	prioritization: true,
	'portal-config': true
};

export function isMockEnabled(domain: MockDomain): boolean {
	return USE_MOCK_API && MOCK_DOMAINS[domain];
}
