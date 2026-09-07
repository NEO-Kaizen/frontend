import { browser } from '$app/environment';
import type { LoginCredentials, LoginResponse, SessionUser } from '$lib/types/auth';
import { ApiError } from '$lib/types/result';

// Usuários fictícios — Solicitante fora até o fluxo dele ser decidido.
type MockUser = SessionUser & { password: string };

const MOCK_USERS: MockUser[] = [
	{
		id: 1,
		name: 'Ana Souza',
		email: 'analista@maat.com.br',
		role: 'Analista',
		password: 'admin'
	},
	{
		id: 2,
		name: 'Marcos Lima',
		email: 'gestor@maat.com.br',
		role: 'Gestor',
		password: 'admin'
	},
	{
		id: 3,
		name: 'Adriana Castro',
		email: 'admin@maat.com.br',
		role: 'Administrador',
		password: 'admin'
	}
];

const SESSION_COOKIE_NAME = 'session_id';

export function loginMock(credentials: LoginCredentials): Promise<LoginResponse> {
	const email = credentials.email.trim().toLowerCase();
	const user = MOCK_USERS.find((candidate) => candidate.email === email);

	if (!user || user.password !== credentials.password) {
		return Promise.reject(new ApiError(401, 'Credenciais inválidas.'));
	}

	setMockSessionCookie(user);

	const sessionUser: SessionUser = {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role
	};

	return Promise.resolve({ user: sessionUser });
}

export function logoutMock(): Promise<null> {
	clearMockSessionCookie();
	return Promise.resolve(null);
}

// Cookie com JWT fictício no formato que decodeJwt espera — sessão e
// guards funcionam offline, sem o servidor de sessão conhecer o mock.
function setMockSessionCookie(user: MockUser): void {
	if (!browser) return;
	document.cookie = `${SESSION_COOKIE_NAME}=${buildMockToken(user)}; path=/; SameSite=Lax`;
}

function clearMockSessionCookie(): void {
	if (!browser) return;
	document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
}

function buildMockToken(user: MockUser): string {
	const header = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
	const payload = encodeBase64Url(
		JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role })
	);
	return `${header}.${payload}.mock-signature`;
}

function encodeBase64Url(value: string): string {
	return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
