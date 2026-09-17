import type { MockContext } from '../context';
import { findAuthUserByEmail, findAuthUserById, toSessionUser } from '../data/auth-users';
import {
	clearSessionCookie,
	isRecord,
	jsonResponse,
	MockHttpError,
	readJsonBody,
	readSessionId,
	sessionCookie
} from '../http';

export async function login({ request }: MockContext): Promise<Response> {
	const body = await readJsonBody(request);

	if (!isRecord(body) || typeof body.email !== 'string' || typeof body.password !== 'string') {
		throw new MockHttpError(400, 'Informe e-mail e senha.');
	}

	const user = findAuthUserByEmail(body.email);

	if (!user || user.password !== body.password) {
		throw new MockHttpError(401, 'Credenciais inválidas.');
	}

	const response = jsonResponse(toSessionUser(user));
	response.headers.append('set-cookie', sessionCookie(user.id));
	return response;
}

export function logout(): Response {
	const response = jsonResponse({ ok: true });
	response.headers.append('set-cookie', clearSessionCookie());
	return response;
}

export function me({ request }: MockContext): Response {
	const user = resolveSessionUser(request);
	return jsonResponse(toSessionUser(user));
}

export async function changePassword({ request }: MockContext): Promise<Response> {
	const user = resolveSessionUser(request);
	const body = await readJsonBody(request);

	if (
		!isRecord(body) ||
		typeof body.currentPassword !== 'string' ||
		typeof body.newPassword !== 'string' ||
		typeof body.confirmNewPassword !== 'string'
	) {
		throw new MockHttpError(400, 'Preencha a senha atual e a nova senha.');
	}

	if (user.password !== body.currentPassword) {
		throw new MockHttpError(400, 'Senha atual incorreta.');
	}

	if (body.newPassword !== body.confirmNewPassword) {
		throw new MockHttpError(400, 'As senhas não conferem.');
	}

	user.password = body.newPassword;
	user.mustChangePassword = false;

	const response = jsonResponse({ ok: true });
	response.headers.append('set-cookie', sessionCookie(user.id));
	return response;
}

function resolveSessionUser(request: Request) {
	const sessionId = readSessionId(request);
	const user = sessionId ? findAuthUserById(sessionId) : undefined;

	if (!user) {
		throw new MockHttpError(401, 'Sessão expirada ou inválida.');
	}

	return user;
}
