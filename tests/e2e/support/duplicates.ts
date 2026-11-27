import type { Page, Route } from '@playwright/test';
import {
	DUPLICATE_ERROR,
	DUPLICATE_ITEMS,
	DUPLICATE_RESPONSES,
	type DuplicateMockScenario
} from '../../../src/lib/mocks/duplicate.mock';
import type { DuplicateAlertItem } from '../../../src/lib/types/duplicate';
import type { DemandBlock } from '../../../src/lib/types/request';
import type { RequesterIdentity } from '../../../src/lib/types/requester-tracking';

export { DUPLICATE_ERROR, DUPLICATE_ITEMS, DUPLICATE_RESPONSES };

export const DUPLICATE_API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

export const DUPLICATE_CHECK_PATH = '/requests/duplicates/check';
export const DUPLICATE_CHECK_ROUTE = `**${DUPLICATE_CHECK_PATH}`;
export const DUPLICATE_TRACKING_ROUTE = '**/requests/*/duplicates';

// Protocolo com caracteres reservados de propósito: prova o encodeURIComponent.
export const DUPLICATE_PROTOCOL = 'ABC/123?x=1';

// Identidade fictícia completa; o header público deve levar só nome e e-mail.
export const DUPLICATE_IDENTITY: RequesterIdentity = {
	name: 'Ana Souza',
	email: 'ana.souza@example.com',
	protocol: DUPLICATE_PROTOCOL,
	verifiedAt: '2026-11-27T12:00:00.000Z'
};

// Corpo de exemplo do contrato (backend#208): apenas campos públicos e sem PII.
export const DUPLICATE_DEMAND: DemandBlock = {
	title: 'Automatizar conciliação bancária',
	requestType: 'Automação',
	category: 'Automação',
	processName: 'Conciliação bancária mensal',
	description: 'Conferência manual de extratos e lançamentos.',
	problem: 'Retrabalho e risco de divergência no fechamento.',
	expectedResult: 'Conciliação automática com trilha de conferência.',
	justification: 'Reduzir esforço manual do time financeiro.'
};

// Allowlist exata do item público — útil para os specs verificarem que nenhum
// campo interno (Protocolo, score, total etc.) vazou no mock.
export const DUPLICATE_ITEM_KEYS = [
	'publicId',
	'title',
	'summary',
	'category',
	'status',
	'period'
] as const satisfies readonly (keyof DuplicateAlertItem)[];

export interface DuplicateRouteScenarios {
	check?: DuplicateMockScenario;
	tracking?: DuplicateMockScenario;
}

async function fulfillDuplicateScenario(
	route: Route,
	scenario: DuplicateMockScenario
): Promise<void> {
	if (scenario === 'error') {
		await route.fulfill({
			status: DUPLICATE_ERROR.statusCode,
			contentType: 'application/json',
			body: JSON.stringify(DUPLICATE_ERROR)
		});
		return;
	}

	await route.fulfill({
		status: 200,
		contentType: 'application/json',
		headers: { 'Cache-Control': 'no-store' },
		body: JSON.stringify(DUPLICATE_RESPONSES[scenario])
	});
}

async function registerDuplicateRoute(
	page: Page,
	pattern: string,
	method: 'GET' | 'POST',
	scenario: DuplicateMockScenario
): Promise<void> {
	await page.route(pattern, async (route) => {
		if (route.request().method() !== method) {
			await route.fallback();
			return;
		}

		await fulfillDuplicateScenario(route, scenario);
	});
}

// Registra as rotas do RF16 no contexto da página. `check` cobre o POST da aba
// de Demanda; `tracking` cobre o GET do Acompanhamento. O cenário `error`
// responde 500 para os testes de degradação (a UI deve continuar o fluxo).
export async function mockDuplicateRoutes(
	page: Page,
	scenarios: DuplicateRouteScenarios
): Promise<void> {
	const check = scenarios.check;

	if (check) {
		await registerDuplicateRoute(page, DUPLICATE_CHECK_ROUTE, 'POST', check);
	}

	const tracking = scenarios.tracking;

	if (tracking) {
		await registerDuplicateRoute(page, DUPLICATE_TRACKING_ROUTE, 'GET', tracking);
	}
}
