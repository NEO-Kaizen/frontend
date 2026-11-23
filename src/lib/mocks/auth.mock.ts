import { browser } from '$app/environment';
import type {
	ChangePasswordPayload,
	LoginCredentials,
	LoginResponse,
	SessionUser
} from '$lib/types/auth';
import { ApiError } from '$lib/types/result';
import {
	GLOBAL_PERMISSION_KEYS,
	PERMISSION_CUSTODIES,
	PERMISSION_KEYS,
	PORTAL_READ_KEYS,
	type Permission,
	type PermissionCustody,
	type PermissionKey
} from '$lib/types/permission';

type MockUser = SessionUser & { password: string };

function profilePermissions(
	entries: Partial<Record<PermissionCustody, readonly PermissionKey[]>>
): Permission[] {
	const byKey = new Map<PermissionKey, PermissionCustody>();

	for (const custody of PERMISSION_CUSTODIES) {
		for (const key of entries[custody] ?? []) byKey.set(key, custody);
	}

	return PERMISSION_KEYS.filter((key) => byKey.has(key)).map((key) => ({
		key,
		custody: byKey.get(key) as PermissionCustody
	}));
}

const ALL_PERMISSIONS: Permission[] = PERMISSION_KEYS.map((key) => ({
	key,
	custody:
		key === 'request:track' || key === 'pending_item:respond'
			? 'own'
			: (GLOBAL_PERMISSION_KEYS as readonly string[]).includes(key)
				? 'global'
				: 'all'
}));

const SELF_SERVICE_PERMISSIONS = profilePermissions({
	global: ['request:create'],
	own: ['request:track', 'pending_item:respond']
});

const ANALYST_PERMISSIONS = profilePermissions({
	global: ['request:create', 'assignee_directory:read'],
	own: ['request:track', 'pending_item:respond'],
	assigned: [
		'request:read',
		'request:write',
		'request:assign',
		'request:status_change',
		'queue:read',
		'triage:read',
		'triage:write',
		'mapping:read',
		'mapping:write',
		'prioritization:write',
		'pending_item:read',
		'pending_item:write',
		'pending_item:review',
		'internal_note:read',
		'internal_note:write',
		'audit:read'
	]
});

const VIEWER_PERMISSIONS = profilePermissions({
	global: ['request:create', 'reports:read', 'assignee_directory:read'],
	own: ['request:track', 'pending_item:respond'],
	all: [
		'request:read',
		'queue:read',
		'queue:export',
		'triage:read',
		'mapping:read',
		'pending_item:read',
		'internal_note:read',
		'internal_note:write',
		'audit:read'
	]
});

const CUSTOM_PORTAL_READER_PERMISSIONS = profilePermissions({
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
		permissions: VIEWER_PERMISSIONS,
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
