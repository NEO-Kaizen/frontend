import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { Plugin } from 'vite';
import { MOCK_API_PREFIX } from './config';
import { handleMockRequest } from './router';

export interface MockApiPluginOptions {
	// Backend real usado pelo proxy dos domínios desligados em `MOCK_DOMAINS`.
	realApiUrl?: string;
}

// Plugin dev-only: `apply: 'serve'` garante que nada disto entra no build de
// produção. O middleware responde `/__mock/**` antes do SvelteKit, com HTTP
// fiel ao contrato (cookie de sessão, multipart, paginação/filtros).
export function mockApiPlugin(options: MockApiPluginOptions = {}): Plugin {
	return {
		name: 'maat-mock-api',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				if (!isMockRequest(request.url)) {
					next();
					return;
				}

				void respond(request, response, options);
			});
		}
	};
}

function isMockRequest(url: string | undefined): boolean {
	if (!url) return false;
	return url === MOCK_API_PREFIX || url.startsWith(`${MOCK_API_PREFIX}/`);
}

async function respond(
	request: IncomingMessage,
	response: ServerResponse,
	options: MockApiPluginOptions
): Promise<void> {
	try {
		const webRequest = toWebRequest(request);
		const webResponse = await handleMockRequest(webRequest, { realApiUrl: options.realApiUrl });
		await writeResponse(response, webResponse);
	} catch (error) {
		console.error('[mock-api]', error);

		if (!response.headersSent) {
			response.statusCode = 500;
			response.setHeader('content-type', 'application/json');
		}

		response.end(JSON.stringify({ message: 'Erro interno no mock.' }));
	}
}

// Node IncomingMessage → Web Request, permitindo `request.json()` e
// `request.formData()` (multipart) nos handlers.
function toWebRequest(request: IncomingMessage): Request {
	const host = request.headers.host ?? 'localhost';
	const url = new URL(request.url ?? '/', `http://${host}`);
	const method = request.method ?? 'GET';
	const headers = new Headers();

	for (const [name, value] of Object.entries(request.headers)) {
		if (Array.isArray(value)) {
			for (const item of value) headers.append(name, item);
		} else if (value !== undefined) {
			headers.set(name, value);
		}
	}

	const init: RequestInit & { duplex?: 'half' } = { method, headers };

	if (method !== 'GET' && method !== 'HEAD') {
		init.body = Readable.toWeb(request) as unknown as ReadableStream;
		init.duplex = 'half';
	}

	return new Request(url, init);
}

async function writeResponse(response: ServerResponse, webResponse: Response): Promise<void> {
	response.statusCode = webResponse.status;

	for (const [name, value] of webResponse.headers) {
		if (name === 'set-cookie') continue;
		response.setHeader(name, value);
	}

	const cookies = webResponse.headers.getSetCookie();

	if (cookies.length > 0) {
		response.setHeader('set-cookie', cookies);
	}

	if (webResponse.status === 204 || webResponse.status === 304) {
		response.end();
		return;
	}

	response.end(await webResponse.text());
}
