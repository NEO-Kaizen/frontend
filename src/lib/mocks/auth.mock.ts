import { browser } from '$app/environment';
import type {
	ChangePasswordPayload,
	LoginCredentials,
	LoginResponse,
	SessionUser
} from '$lib/types/auth';
import { ApiError } from '$lib/types/result';
import { PORTAL_READ_KEYS } from '$lib/types/permission';
import {
	ALL_PERMISSIONS,
	ANALYST_PERMISSIONS,
	buildProfilePermissions,
	MANAGER_PERMISSIONS,
	SELF_SERVICE_PERMISSIONS
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
		role: 'Analista',
		mustChangePassword: false,
		permissions: ANALYST_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '2',
		name: 'Marcos Lima',
		email: 'gestor@maat.com.br',
		avatarUrl: null,
		role: 'Gestor',
		mustChangePassword: false,
		permissions: MANAGER_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '3',
		name: 'Adriana Castro',
		email: 'admin@maat.com.br',
		avatarUrl: null,
		role: 'Administrador',
		mustChangePassword: false,
		permissions: ALL_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '4',
		name: 'Carlos Mendes',
		email: 'solicitante@maat.com.br',
		avatarUrl: null,
		role: 'Solicitante',
		mustChangePassword: false,
		permissions: SELF_SERVICE_PERMISSIONS,
		password: 'temp123'
	},
	{
		id: '5',
		name: 'Beatriz Rocha',
		email: 'root@maat.com.br',
		avatarUrl: null,
		role: 'Admin Root',
		mustChangePassword: false,
		permissions: ALL_PERMISSIONS,
		password: 'admin'
	},
	{
		id: '6',
		name: 'Rafael Nunes',
		email: 'portal@maat.com.br',
		avatarUrl: null,
		role: 'Leitura de portal',
		mustChangePassword: false,
		permissions: CUSTOM_PORTAL_READER_PERMISSIONS,
		password: 'admin'
	}
];

const SESSION_COOKIE_NAME = 'session_id';

// Ids dos perfis base de `profiles.mock.ts` (só para espelhar `/auth/me`).
const MOCK_PROFILE_ID_BY_NAME: Record<string, string> = {
	Solicitante: '1',
	Analista: '2',
	Gestor: '3',
	Administrador: '4',
	'Admin Root': '5'
};

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
		role: user.role,
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
		profile: { id: MOCK_PROFILE_ID_BY_NAME[user.role] ?? '', name: user.role },
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
