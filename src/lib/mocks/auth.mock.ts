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
		id: 1,
		name: 'Ana Souza',
		email: 'analista@maat.com.br',
		role: 'Analista',
		forcePasswordChange: false,
		password: 'admin'
	},
	{
		id: 2,
		name: 'Marcos Lima',
		email: 'gestor@maat.com.br',
		role: 'Gestor',
		forcePasswordChange: true,
		password: 'admin'
	},
	{
		id: 3,
		name: 'Adriana Castro',
		email: 'admin@maat.com.br',
		role: 'Administrador',
		forcePasswordChange: true,
		password: 'admin'
	},
	{
		id: 4,
		name: 'Carlos Mendes',
		email: 'solicitante@maat.com.br',
		role: 'Solicitante',
		forcePasswordChange: true,
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

	setMockSessionCookie(user);

	const sessionUser: SessionUser = {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		forcePasswordChange: user.forcePasswordChange
	};

	return Promise.resolve({ user: sessionUser });
}

export function logoutMock(): Promise<null> {
	clearMockSessionCookie();
	return Promise.resolve(null);
}

export function getMeMock(): Promise<SessionUser> {
	const userId = readUserIdFromCookie();
	if (userId === null) {
		return Promise.reject(new ApiError(401, 'Sessão expirada ou inválida.'));
	}

	const user = MOCK_USERS.find((candidate) => candidate.id === userId);
	if (!user) {
		return Promise.reject(new ApiError(401, 'Sessão expirada ou inválida.'));
	}

	return Promise.resolve({
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		forcePasswordChange: user.forcePasswordChange
	});
}

export function changePasswordMock(payload: ChangePasswordPayload): Promise<void> {
	const userId = readUserIdFromCookie();
	if (userId === null) {
		return Promise.reject(new ApiError(401, 'Sessão expirada ou inválida.'));
	}

	const user = MOCK_USERS.find((candidate) => candidate.id === userId);
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
	user.forcePasswordChange = false;

	setMockSessionCookie(user);

	return Promise.resolve();
}

// Cookie com JWT fictício no formato que decodeJwt espera — sessão e
// guards funcionam offline, sem o servidor de sessão conhecer o mock.
function readUserIdFromCookie(): number | null {
	if (!browser) return null;

	const cookie = document.cookie
		.split('; ')
		.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
	if (!cookie) return null;

	const token = cookie.split('=')[1];
	if (!token) return null;

	try {
		const parts = token.split('.');
		if (parts.length < 2) return null;
		const payload = JSON.parse(atob(parts[1]));
		return typeof payload.id === 'number' ? payload.id : null;
	} catch {
		return null;
	}
}

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
		JSON.stringify({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			forcePasswordChange: user.forcePasswordChange
		})
	);
	return `${header}.${payload}.mock-signature`;
}

function encodeBase64Url(value: string): string {
	return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
