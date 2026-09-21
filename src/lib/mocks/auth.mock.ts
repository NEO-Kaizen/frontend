import { browser } from '$app/environment';
import type {
	ChangePasswordPayload,
	LoginCredentials,
	LoginResponse,
	SessionUser
} from '$lib/types/auth';
import { ApiError } from '$lib/types/result';

type MockUser = SessionUser & { password: string };

const MOCK_USERS: MockUser[] = [
	{
		id: '1',
		name: 'Ana Souza',
		email: 'analista@maat.com.br',
		role: 'Analista',
		mustChangePassword: false,
		password: 'admin'
	},
	{
		id: '2',
		name: 'Marcos Lima',
		email: 'gestor@maat.com.br',
		role: 'Gestor',
		mustChangePassword: false,
		password: 'admin'
	},
	{
		id: '3',
		name: 'Adriana Castro',
		email: 'admin@maat.com.br',
		role: 'Administrador',
		mustChangePassword: false,
		password: 'admin'
	},
	{
		id: '4',
		name: 'Carlos Mendes',
		email: 'solicitante@maat.com.br',
		role: 'Solicitante',
		mustChangePassword: false,
		password: 'temp123'
	}
];

const SESSION_COOKIE_NAME = 'session_id';

export function loginMock(credentials: LoginCredentials): Promise<LoginResponse> {
	const email = credentials.email.trim().toLowerCase();
	const user = MOCK_USERS.find((candidate) => candidate.email === email);

	if (!user || user.password !== credentials.password) {
		return Promise.reject(new ApiError(401, 'Credenciais inválidas.'));
	}

	setMockSessionCookie(user.id);

	return Promise.resolve(toSessionUser(user));
}

export function logoutMock(): Promise<null> {
	clearMockSessionCookie();
	return Promise.resolve(null);
}

// `sessionId` é o valor do cookie repassado pelo server (hooks); no browser o
// cookie é lido diretamente. Sem JWT nem decodificação local — o mock guarda o
// id do usuário na própria sessão.
export function getMeMock(sessionId?: string): Promise<SessionUser> {
	const userId = sessionId ?? readSessionCookie();
	const user = userId ? MOCK_USERS.find((candidate) => candidate.id === userId) : undefined;

	if (!user) {
		return Promise.reject(new ApiError(401, 'Sessão expirada ou inválida.'));
	}

	return Promise.resolve(toSessionUser(user));
}

export function changePasswordMock(payload: ChangePasswordPayload): Promise<void> {
	const userId = readSessionCookie();
	const user = userId ? MOCK_USERS.find((candidate) => candidate.id === userId) : undefined;

	if (!user) {
		return Promise.reject(new ApiError(401, 'Sessão expirada ou inválida.'));
	}

	if (user.password !== payload.currentPassword) {
		return Promise.reject(new ApiError(400, 'Senha atual incorreta.'));
	}

	if (payload.newPassword !== payload.confirmNewPassword) {
		return Promise.reject(new ApiError(400, 'As senhas não conferem.'));
	}

	user.password = payload.newPassword;
	user.mustChangePassword = false;

	setMockSessionCookie(user.id);

	return Promise.resolve();
}

function toSessionUser(user: MockUser): SessionUser {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		mustChangePassword: user.mustChangePassword
	};
}

/**
 * Sessão mockada atual (ou `null` sem login / fora do browser). Usada pelo
 * mock de acompanhamento para distinguir analista de solicitante, como o
 * backend faz pela sessão. Uso exclusivo em testes DEV.
 */
export function getMockSessionUser(): SessionUser | null {
	const userId = readSessionCookie();
	const user = userId ? MOCK_USERS.find((candidate) => candidate.id === userId) : undefined;
	return user ? toSessionUser(user) : null;
}

function readSessionCookie(): string | null {
	if (!browser) return null;

	const cookie = document.cookie
		.split('; ')
		.find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));

	return cookie ? cookie.slice(SESSION_COOKIE_NAME.length + 1) || null : null;
}

function setMockSessionCookie(userId: string): void {
	if (!browser) return;
	document.cookie = `${SESSION_COOKIE_NAME}=${userId}; path=/; SameSite=Lax`;
}

function clearMockSessionCookie(): void {
	if (!browser) return;
	document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}
