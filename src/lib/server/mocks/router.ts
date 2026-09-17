import { isMockEnabled, MOCK_API_PREFIX, type MockDomain } from './config';
import type { MockContext } from './context';
import * as authHandlers from './handlers/auth';
import * as portalConfigHandlers from './handlers/portal-config';
import * as prioritizationHandlers from './handlers/prioritization';
import * as requestsHandlers from './handlers/requests';
import * as usersHandlers from './handlers/users';
import { errorResponse, messageResponse } from './http';

interface Route {
	method: string;
	domain: MockDomain;
	pattern: RegExp;
	handle: (context: MockContext) => Promise<Response> | Response;
}

// A ordem importa: rotas específicas (`/users/metrics`, `/queue/metrics`,
// `/requests/:protocol/internal`) vêm antes das rotas com parâmetro solto.
const routes: Route[] = [
	{ method: 'POST', domain: 'auth', pattern: /^\/auth\/login$/, handle: authHandlers.login },
	{ method: 'POST', domain: 'auth', pattern: /^\/auth\/logout$/, handle: authHandlers.logout },
	{ method: 'GET', domain: 'auth', pattern: /^\/auth\/me$/, handle: authHandlers.me },
	{
		method: 'PUT',
		domain: 'auth',
		pattern: /^\/auth\/change-password$/,
		handle: authHandlers.changePassword
	},

	{ method: 'GET', domain: 'users', pattern: /^\/users\/metrics$/, handle: usersHandlers.metrics },
	{ method: 'GET', domain: 'users', pattern: /^\/users$/, handle: usersHandlers.list },
	{ method: 'POST', domain: 'users', pattern: /^\/users$/, handle: usersHandlers.create },
	{
		method: 'PATCH',
		domain: 'users',
		pattern: /^\/users\/([^/]+)\/status$/,
		handle: usersHandlers.updateStatus
	},
	{
		method: 'POST',
		domain: 'users',
		pattern: /^\/users\/([^/]+)\/reset-password$/,
		handle: usersHandlers.resetPassword
	},

	{ method: 'POST', domain: 'request', pattern: /^\/requests$/, handle: requestsHandlers.create },
	{ method: 'GET', domain: 'request', pattern: /^\/requests$/, handle: requestsHandlers.list },
	{
		method: 'GET',
		domain: 'request',
		pattern: /^\/queue\/metrics$/,
		handle: requestsHandlers.queueMetrics
	},
	{ method: 'GET', domain: 'request', pattern: /^\/queue$/, handle: requestsHandlers.queue },
	{
		method: 'GET',
		domain: 'request',
		pattern: /^\/requests\/([^/]+)\/internal$/,
		handle: requestsHandlers.internal
	},
	{
		method: 'PATCH',
		domain: 'request',
		pattern: /^\/requests\/([^/]+)\/internal$/,
		handle: requestsHandlers.updateInternal
	},
	{
		method: 'GET',
		domain: 'request',
		pattern: /^\/requests\/([^/]+)$/,
		handle: requestsHandlers.detail
	},

	{
		method: 'GET',
		domain: 'prioritization',
		pattern: /^\/prioritization\/criteria$/,
		handle: prioritizationHandlers.criteria
	},
	{
		method: 'PUT',
		domain: 'prioritization',
		pattern: /^\/prioritization\/([^/]+)\/score$/,
		handle: prioritizationHandlers.score
	},

	{
		method: 'GET',
		domain: 'portal-config',
		pattern: /^\/portal-config$/,
		handle: portalConfigHandlers.get
	}
];

export interface MockRouterOptions {
	realApiUrl?: string;
}

export async function handleMockRequest(
	request: Request,
	options: MockRouterOptions = {}
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const path = url.pathname.slice(MOCK_API_PREFIX.length) || '/';
		const match = matchRoute(request.method, path);

		if (!match) {
			return messageResponse('Rota de mock não encontrada.', 404);
		}

		if (!isMockEnabled(match.route.domain)) {
			return proxyToRealApi(request, options.realApiUrl, path, url.search);
		}

		return await match.route.handle({ request, url, params: match.params });
	} catch (error) {
		return errorResponse(error);
	}
}

function matchRoute(method: string, path: string): { route: Route; params: string[] } | null {
	for (const route of routes) {
		if (route.method !== method) continue;

		const result = route.pattern.exec(path);

		if (result) {
			return { route, params: result.slice(1).map((value) => decodeURIComponent(value)) };
		}
	}

	return null;
}

// Domínio desligado em `MOCK_DOMAINS`: encaminha para o backend real em vez de
// responder o mock, preservando cookies e multipart.
async function proxyToRealApi(
	request: Request,
	realApiUrl: string | undefined,
	path: string,
	search: string
): Promise<Response> {
	if (!realApiUrl) {
		return messageResponse(
			'Mock desabilitado para esta rota, mas PUBLIC_REAL_API_URL não está definida.',
			502
		);
	}

	const base = realApiUrl.replace(/\/$/, '');
	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.delete('content-length');

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
	const init: RequestInit & { duplex?: 'half' } = {
		method: request.method,
		headers,
		redirect: 'manual'
	};

	if (hasBody) {
		init.body = request.body;
		init.duplex = 'half';
	}

	return fetch(`${base}${path}${search}`, init);
}
