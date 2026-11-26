import { browser } from '$app/environment';
import type { ChangePasswordPayload, LoginCredentials, SessionUser } from '$lib/types/auth';
import { ApiError } from '$lib/types/result';
import { PORTAL_READ_KEYS } from '$lib/types/permission';
import { BASE_PROFILE_IDS } from './profile-seed.mock';
import {
	ALL_PERMISSIONS,
	ANALYST_PERMISSIONS,
	buildProfilePermissions,
	SELF_SERVICE_PERMISSIONS,
	VIEWER_PERMISSIONS
} from './profile-permissions.mock';

type MockUser = SessionUser & { password: string };

const CUSTOM_PORTAL_READER_PERMISSIONS = buildProfilePermissions({
	global: ['request:create', ...PORTAL_READ_KEYS],
	own: ['request:track', 'pending_item:respond']
});

const MOCK_USERS: MockUser[] = [
	{
		id: '1',
		name: 'Ana Souza',
		email: 'analista@maat.com.br',
		avatarUrl: null,
		profile: { id: BASE_PROFILE_IDS.Analista, name: 'Analista' },
		isRoot: false,
		mustChangePassword: false,
		permissions: ANALYST_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '2',
		name: 'Marcos Lima',
		email: 'visualizador@maat.com.br',
		avatarUrl: null,
		profile: { id: BASE_PROFILE_IDS.Visualizador, name: 'Visualizador' },
		isRoot: false,
		mustChangePassword: false,
		permissions: VIEWER_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '3',
		name: 'Adriana Castro',
		email: 'admin@maat.com.br',
		avatarUrl: null,
		profile: { id: BASE_PROFILE_IDS.Administrador, name: 'Administrador' },
		isRoot: false,
		mustChangePassword: false,
		permissions: ALL_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '4',
		name: 'Carlos Mendes',
		email: 'solicitante@maat.com.br',
		avatarUrl: null,
		profile: { id: BASE_PROFILE_IDS.Solicitante, name: 'Solicitante' },
		isRoot: false,
		mustChangePassword: false,
		permissions: SELF_SERVICE_PERMISSIONS,
		password: 'temp123'
	},
	{
		id: '5',
		name: 'Beatriz Rocha',
		email: 'root@maat.com.br',
		avatarUrl: null,
		profile: { id: BASE_PROFILE_IDS['Admin Root'], name: 'Admin Root' },
		isRoot: true,
		mustChangePassword: false,
		permissions: ALL_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '6',
		name: 'Rafael Nunes',
		email: 'portal@maat.com.br',
		avatarUrl: null,
		profile: { id: '', name: 'Leitura de portal' },
		isRoot: false,
		mustChangePassword: false,
		permissions: CUSTOM_PORTAL_READER_PERMISSIONS,
		password: 'admin'
	}
];

const SESSION_COOKIE_NAME = 'session_id';

// Espelha POST /auth/login: o payload traz `profile` (com `isRoot`), não
// `role`; a sessão só é montada depois de `sanitizeSessionUser`.
export function loginMock(credentials: LoginCredentials): Promise<unknown> {
	const email = credentials.email.trim().toLowerCase();
	const user = MOCK_USERS.find((candidate) => candidate.email === email);

	if (!user || user.password !== credentials.password) {
		return Promise.reject(new ApiError(401, 'Credenciais inválidas.'));
	}

	setMockSessionCookie(user.id);
	return Promise.resolve(toSessionPayload(user));
}

export function logoutMock(): Promise<null> {
	clearMockSessionCookie();
	return Promise.resolve(null);
}

export function getMeMock(sessionId?: string): Promise<SessionUser> {
	const user = findSessionUser(sessionId);

	if (!user) {
		return Promise.reject(new ApiError(401, 'Sessão expirada ou inválida.'));
	}

	return Promise.resolve(toSessionUser(user));
}

// Espelha o payload real de GET /auth/me (usado pela camada de API).
export function getMeResponseMock(sessionId?: string): Promise<unknown> {
	const user = findSessionUser(sessionId);

	if (!user) {
		return Promise.reject(new ApiError(401, 'Sessão expirada ou inválida.'));
	}

	return Promise.resolve(toSessionPayload(user));
}

function findSessionUser(sessionId?: string): MockUser | undefined {
	const userId = sessionId ?? readSessionCookie();
	return userId ? MOCK_USERS.find((candidate) => candidate.id === userId) : undefined;
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

export function getMockSessionUser(): SessionUser | null {
	const userId = readSessionCookie();
	const user = userId ? MOCK_USERS.find((candidate) => candidate.id === userId) : undefined;
	return user ? toSessionUser(user) : null;
}

function toSessionUser(user: MockUser): SessionUser {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		avatarUrl: user.avatarUrl,
		profile: structuredClone(user.profile),
		isRoot: user.isRoot,
		mustChangePassword: user.mustChangePassword,
		permissions: structuredClone(user.permissions)
	};
}

// Espelha GET /auth/me: identidade em `profile`, sem `role` legado.
function toSessionPayload(user: MockUser) {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		avatarUrl: user.avatarUrl,
		profile: { ...structuredClone(user.profile), isRoot: user.isRoot },
		mustChangePassword: user.mustChangePassword,
		permissions: structuredClone(user.permissions)
	};
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
