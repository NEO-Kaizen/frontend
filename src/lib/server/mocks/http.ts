// Utilitários HTTP do mock. Erros de domínio viram respostas com o status do
// contrato (401, 404, 409...), mantendo o mesmo formato de erro do `apiClient`.

export class MockHttpError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'MockHttpError';
		this.status = status;
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Lê o corpo JSON traduzindo corpo ausente/malformado em 400 (contrato), em vez
// de deixar o erro de parse virar 500 no roteador.
export async function readJsonBody(request: Request): Promise<unknown> {
	try {
		return await request.json();
	} catch {
		throw new MockHttpError(400, 'Corpo da requisição inválido.');
	}
}

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

export function messageResponse(message: string, status: number): Response {
	return jsonResponse({ message }, status);
}

export function errorResponse(error: unknown): Response {
	if (error instanceof MockHttpError) {
		return messageResponse(error.message, error.status);
	}

	console.error('[mock-api]', error);
	return messageResponse('Erro interno no mock.', 500);
}

const SESSION_COOKIE_NAME = 'session_id';

// Lê o `session_id` do header Cookie — o "backend" do mock resolve a sessão a
// partir do próprio cookie, sem JWT nem estado no cliente.
export function readSessionId(request: Request): string | null {
	const header = request.headers.get('cookie');
	if (!header) return null;

	for (const entry of header.split(';')) {
		const separator = entry.indexOf('=');
		if (separator === -1) continue;

		const name = entry.slice(0, separator).trim();
		if (name !== SESSION_COOKIE_NAME) continue;

		const value = entry.slice(separator + 1).trim();
		return value ? decodeURIComponent(value) : null;
	}

	return null;
}

export function sessionCookie(userId: string): string {
	return `${SESSION_COOKIE_NAME}=${encodeURIComponent(userId)}; Path=/; HttpOnly; SameSite=Lax`;
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
