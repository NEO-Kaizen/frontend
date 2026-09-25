import { dev } from '$app/environment';

// Único ponto de ligar/desligar mocks. Em produção `dev` é constante `false`
// e as branches dos *.api.ts são eliminadas do bundle (DCE).
export const MOCKS_ENABLED = false;

// Toggle por domínio — desligar tudo via MOCKS_ENABLED; novos domínios entram aqui.
// A anotação explícita mantém `MOCK_DOMAINS && MOCK_DOMAINS.<domínio>`
// compilando mesmo com `MOCKS_ENABLED = false` (sem ela o tipo colapsa
// para `false` e os acessos viram `never`, quebrando o `check`).
type MockDomains = {
	auth: true;
	dashboard: true;
	reports: true;
	request: true;
	portalConfig: true;
	users: true;
	prioritization: true;
	pendingItems: true;
	triage: true;
	mapping: true;
	internalNotes: true;
	auditHistory: true;
};
export const MOCK_DOMAINS: false | MockDomains =
	dev &&
	MOCKS_ENABLED &&
	({
		auth: true,
		dashboard: true,
		reports: true,
		request: true,
		portalConfig: true,
		users: true,
		prioritization: true,
		pendingItems: true,
		triage: true,
		mapping: true,
		internalNotes: true,
		auditHistory: true
	} as const);
