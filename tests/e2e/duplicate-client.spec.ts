import { expect, test, type Page } from '@playwright/test';
import type { DemandBlock } from '../../src/lib/types/request';
import type { RequesterIdentity } from '../../src/lib/types/requester-tracking';
import {
	DUPLICATE_API_URL,
	DUPLICATE_CHECK_PATH,
	DUPLICATE_CHECK_ROUTE,
	DUPLICATE_DEMAND,
	DUPLICATE_ERROR,
	DUPLICATE_IDENTITY,
	DUPLICATE_PROTOCOL,
	DUPLICATE_RESPONSES,
	mockDuplicateRoutes
} from './support/duplicates';

type DuplicateCall =
	| { operation: 'check'; demand: DemandBlock }
	| { operation: 'tracking'; protocol: string; identity?: RequesterIdentity | null };

type CapturedCall = {
	url: string;
	method?: string;
	headers: Record<string, string>;
	body?: string | null;
	credentials?: RequestCredentials;
	status?: number;
	cacheControl?: string | null;
};

type DuplicateCallResult = {
	result: unknown;
	calls: CapturedCall[];
};

async function callDuplicateApi(page: Page, call: DuplicateCall): Promise<DuplicateCallResult> {
	return page.evaluate(async (payload) => {
		// O client importa módulos virtuais do SvelteKit. Este import roda no
		// browser, servido pelo Vite, e exercita exatamente o código do app.
		const loadModule = (path: string) => import(path);
		const api = (await loadModule(
			'/src/lib/api/duplicate.api.ts'
		)) as typeof import('../../src/lib/api/duplicate.api');

		const calls: CapturedCall[] = [];
		const spyFetch: typeof fetch = async (input, init) => {
			const response = await fetch(input, init);

			calls.push({
				url: String(input),
				method: init?.method,
				headers: Object.fromEntries(new Headers(init?.headers).entries()),
				body: typeof init?.body === 'string' ? init.body : null,
				credentials: init?.credentials,
				status: response.status,
				cacheControl: response.headers.get('cache-control')
			});

			return response;
		};

		try {
			const result =
				payload.operation === 'check'
					? await api.checkDuplicates(payload.demand, spyFetch)
					: await api.getTrackingDuplicates(payload.protocol, payload.identity, spyFetch);

			return { result, calls };
		} catch (error) {
			const apiError = error as Error & { status?: number };

			return {
				result: { name: apiError.name, message: apiError.message, status: apiError.status },
				calls
			};
		}
	}, call);
}

test.describe('RF16 — cliente e route mocks', () => {
	for (const scenario of ['high', 'medium', 'none'] as const) {
		test(`checkDuplicates: ${scenario}`, async ({ page }) => {
			await mockDuplicateRoutes(page, { check: scenario });
			await page.goto('/');

			const { result, calls } = await callDuplicateApi(page, {
				operation: 'check',
				demand: DUPLICATE_DEMAND
			});

			expect(result).toEqual(DUPLICATE_RESPONSES[scenario]);
			expect(calls).toHaveLength(1);
			expect(calls[0]).toMatchObject({
				url: `${DUPLICATE_API_URL}${DUPLICATE_CHECK_PATH}`,
				method: 'POST',
				credentials: 'include',
				status: 200,
				cacheControl: 'no-store'
			});

			expect(calls[0].headers['content-type']).toBe('application/json');
			expect(calls[0].headers['x-requester-identity']).toBeUndefined();
			expect(JSON.parse(calls[0].body ?? '{}')).toEqual({ demand: DUPLICATE_DEMAND });
		});
	}

	test('checkDuplicates: erro 500 vira ApiError', async ({ page }) => {
		await mockDuplicateRoutes(page, { check: 'error' });
		await page.goto('/');

		const { result, calls } = await callDuplicateApi(page, {
			operation: 'check',
			demand: DUPLICATE_DEMAND
		});

		expect(result).toMatchObject({
			name: 'ApiError',
			status: DUPLICATE_ERROR.statusCode,
			message: DUPLICATE_ERROR.message
		});
		expect(calls[0]).toMatchObject({
			url: `${DUPLICATE_API_URL}${DUPLICATE_CHECK_PATH}`,
			method: 'POST',
			credentials: 'include',
			status: DUPLICATE_ERROR.statusCode
		});
	});

	for (const scenario of ['high', 'medium', 'none'] as const) {
		test(`getTrackingDuplicates: público ${scenario}`, async ({ page }) => {
			await mockDuplicateRoutes(page, { tracking: scenario });
			await page.goto('/');

			const { result, calls } = await callDuplicateApi(page, {
				operation: 'tracking',
				protocol: DUPLICATE_PROTOCOL,
				identity: DUPLICATE_IDENTITY
			});

			expect(result).toEqual(DUPLICATE_RESPONSES[scenario]);
			expect(calls).toHaveLength(1);
			expect(calls[0].url).toBe(
				`${DUPLICATE_API_URL}/requests/${encodeURIComponent(DUPLICATE_PROTOCOL)}/duplicates`
			);
			expect(calls[0].credentials).toBe('include');
			expect(calls[0].status).toBe(200);
			expect(calls[0].cacheControl).toBe('no-store');
			expect(JSON.parse(calls[0].headers['x-requester-identity'] ?? '{}')).toEqual({
				name: DUPLICATE_IDENTITY.name,
				email: DUPLICATE_IDENTITY.email
			});
		});
	}

	test('getTrackingDuplicates: erro 500 vira ApiError', async ({ page }) => {
		await mockDuplicateRoutes(page, { tracking: 'error' });
		await page.goto('/');

		const { result, calls } = await callDuplicateApi(page, {
			operation: 'tracking',
			protocol: DUPLICATE_PROTOCOL,
			identity: DUPLICATE_IDENTITY
		});

		expect(result).toMatchObject({
			name: 'ApiError',
			status: DUPLICATE_ERROR.statusCode,
			message: DUPLICATE_ERROR.message
		});
		expect(calls[0]).toMatchObject({
			credentials: 'include',
			status: DUPLICATE_ERROR.statusCode
		});
	});

	test('getTrackingDuplicates: autenticado não envia identidade', async ({ page }) => {
		await mockDuplicateRoutes(page, { tracking: 'none' });
		await page.goto('/');

		const { result, calls } = await callDuplicateApi(page, {
			operation: 'tracking',
			protocol: DUPLICATE_PROTOCOL,
			identity: null
		});

		expect(result).toEqual(DUPLICATE_RESPONSES.none);
		expect(calls).toHaveLength(1);
		expect(calls[0].headers['x-requester-identity']).toBeUndefined();
		expect(calls[0].credentials).toBe('include');
	});

	test('mockDuplicateRoutes: método divergente cai no fallback', async ({ page }) => {
		await page.route(DUPLICATE_CHECK_ROUTE, (route) =>
			route.fulfill({ status: 418, contentType: 'text/plain', body: 'fallback' })
		);
		await mockDuplicateRoutes(page, { check: 'high' });
		await page.goto('/');

		const status = await page.evaluate(
			async (url) => (await fetch(url, { method: 'GET' })).status,
			`${DUPLICATE_API_URL}${DUPLICATE_CHECK_PATH}`
		);

		expect(status).toBe(418);
	});
});
