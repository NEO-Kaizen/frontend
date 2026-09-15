import { dev } from '$app/environment';

// Único ponto de ligar/desligar mocks. Em produção `dev` é constante `false`
// e as branches dos *.api.ts são eliminadas do bundle (DCE).
export const MOCKS_ENABLED = dev;

// Toggle por domínio — desligar tudo via MOCKS_ENABLED; novos domínios entram aqui.
export const MOCK_DOMAINS =
	dev &&
	MOCKS_ENABLED &&
	({
		auth: true,
		request: true,
		portalConfig: true,
		users: true,
		prioritization: true
	} as const);
