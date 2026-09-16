import { ApiError } from '$lib/types/result';
import type { PaginatedResponse } from '$lib/types/request';

import type {
	CreateUserPayload,
	CreateUserResponse,
	ListUsersQuery,
	ResetPasswordResponse,
	UpdateUserStatusResponse,
	UserProfile,
	UserRole,
	UserStats,
	UserSummary
} from '$lib/types/user';

export const mockUsers: UserSummary[] = [
	{
		id: '1',
		fullName: 'Maria Oliveira',
		email: 'maria.oliveira@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-02T10:00:00.000Z'
	},
	{
		id: '2',
		fullName: 'João Santos',
		email: 'joao.santos@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-10T14:30:00.000Z'
	},
	{
		id: '3',
		fullName: 'Carlos Mendes',
		email: 'carlos.mendes@maat.com.br',
		profile: 'Solicitante',
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-07-15T09:20:00.000Z'
	},
	{
		id: '4',
		fullName: 'Fernanda Lima',
		email: 'fernanda.lima@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-22T16:45:00.000Z'
	},
	{
		id: '5',
		fullName: 'Rafael Costa',
		email: 'rafael.costa@maat.com.br',
		profile: 'Solicitante',
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-08-03T11:10:00.000Z'
	},
	{
		id: '6',
		fullName: 'Juliana Alves',
		email: 'juliana.alves@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-09T08:55:00.000Z'
	},
	{
		id: '7',
		fullName: 'Bruno Martins',
		email: 'bruno.martins@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-14T13:25:00.000Z'
	},
	{
		id: '8',
		fullName: 'Patrícia Rocha',
		email: 'patricia.rocha@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-20T10:40:00.000Z'
	},
	{
		id: '9',
		fullName: 'Lucas Ferreira',
		email: 'lucas.ferreira@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-23T15:05:00.000Z'
	},
	{
		id: '10',
		fullName: 'Amanda Nogueira',
		email: 'amanda.nogueira@maat.com.br',
		profile: 'Solicitante',
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-08-26T09:35:00.000Z'
	},
	{
		id: '11',
		fullName: 'Diego Barbosa',
		email: 'diego.barbosa@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-28T11:50:00.000Z'
	},
	{
		id: '12',
		fullName: 'Camila Duarte',
		email: 'camila.duarte@maat.com.br',
		profile: 'Solicitante',
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-30T14:15:00.000Z'
	},
	{
		id: '13',
		fullName: 'Ana Beatriz Souza',
		email: 'ana.souza@maat.com.br',
		profile: 'Analista',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-05T09:00:00.000Z'
	},
	{
		id: '14',
		fullName: 'Marcelo Tavares',
		email: 'marcelo.tavares@maat.com.br',
		profile: 'Analista',
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-18T11:30:00.000Z'
	},
	{
		id: '15',
		fullName: 'Renata Campos',
		email: 'renata.campos@maat.com.br',
		profile: 'Analista',
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-08-27T16:20:00.000Z'
	},
	{
		id: '16',
		fullName: 'Paulo Henrique Dias',
		email: 'paulo.dias@maat.com.br',
		profile: 'Gestor',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-06-12T08:45:00.000Z'
	},
	{
		id: '17',
		fullName: 'Simone Ribeiro',
		email: 'simone.ribeiro@maat.com.br',
		profile: 'Gestor',
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-21T14:05:00.000Z'
	},
	{
		id: '18',
		fullName: 'Administrador Teste',
		email: 'administrador.teste@maat.com.br',
		profile: 'Administrador',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-06-01T10:00:00.000Z'
	},
	{
		id: '19',
		fullName: 'Helena Prado',
		email: 'helena.prado@maat.com.br',
		profile: 'Administrador',
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-19T13:40:00.000Z'
	}
];

let nextId = Math.max(...mockUsers.map((user) => Number(user.id))) + 1;

const MOCK_LATENCY_MS = 400;

const TEMPORARY_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';

const PROFILE_TO_ROLE: Record<UserProfile, UserRole> = {
	solicitante: 'Solicitante',
	analista: 'Analista',
	administrador: 'Administrador',
	gestor: 'Gestor'
};

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function listUsersMock(query: ListUsersQuery): Promise<PaginatedResponse<UserSummary>> {
	let result = [...mockUsers];

	if (query.profile) {
		const profile = PROFILE_TO_ROLE[query.profile];

		result = result.filter((user) => user.profile === profile);
	}

	if (query.search) {
		const search = query.search.toLowerCase().trim();

		result = result.filter(
			(user) =>
				user.fullName.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)
		);
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 10;
	const total = result.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;

	const data = result.slice(start, start + pageSize);

	return delay(MOCK_LATENCY_MS).then(() => ({
		data,
		page,
		pageSize,
		total,
		totalPages
	}));
}

export function getUserStatsMock(): UserStats {
	return {
		total: mockUsers.length,
		active: mockUsers.filter((user) => user.isActive).length,
		pending: mockUsers.filter((user) => user.mustChangePassword).length,
		admins: mockUsers.filter((user) => user.profile === 'Administrador').length
	};
}

export function createUserMock(payload: CreateUserPayload): Promise<CreateUserResponse> {
	if (payload.role === 'administrador') {
		return Promise.reject(new ApiError(403, 'Não é possível gerenciar contas de Administradores'));
	}

	const email = payload.email.trim().toLowerCase();

	const duplicatedEmail = mockUsers.some((user) => user.email.toLowerCase() === email);

	if (duplicatedEmail) {
		return Promise.reject(new ApiError(409, 'E-mail já cadastrado'));
	}

	const temporaryPassword = generateTemporaryPassword();
	const createdAt = new Date().toISOString();
	const id = String(nextId++);
	const role = PROFILE_TO_ROLE[payload.role];

	if (role === 'Administrador') {
		return Promise.reject(new ApiError(403, 'Não é possível gerenciar contas de Administradores'));
	}

	const user: UserSummary = {
		id,
		fullName: payload.fullName.trim(),
		email,
		profile: role,
		isActive: true,
		mustChangePassword: true,
		createdAt
	};

	mockUsers.unshift(user);

	return delay(MOCK_LATENCY_MS).then(() => ({
		id,
		fullName: user.fullName,
		email: user.email,
		role,
		isActive: true,
		mustChangePassword: true,
		createdAt,
		temporaryPassword
	}));
}

export function updateUserStatusMock(
	id: string,
	isActive: boolean
): Promise<UpdateUserStatusResponse> {
	const user = findMockUser(id);

	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado'));
	}

	if (user.profile === 'Administrador') {
		return Promise.reject(new ApiError(403, 'Não é possível gerenciar contas de Administradores'));
	}

	user.isActive = isActive;

	return delay(MOCK_LATENCY_MS).then(() => ({
		id: user.id,
		isActive: user.isActive
	}));
}

export function resetUserPasswordMock(id: string): Promise<ResetPasswordResponse> {
	const user = findMockUser(id);

	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado'));
	}

	if (user.profile === 'Administrador') {
		return Promise.reject(new ApiError(403, 'Não é possível gerenciar contas de Administradores'));
	}

	user.mustChangePassword = true;

	const temporaryPassword = generateTemporaryPassword();

	return delay(MOCK_LATENCY_MS).then(() => ({
		id: user.id,
		temporaryPassword
	}));
}

function findMockUser(id: string): UserSummary | undefined {
	return mockUsers.find((user) => user.id === id);
}

function generateTemporaryPassword(): string {
	const length = 10;

	let password = '';

	for (let index = 0; index < length; index += 1) {
		const alphabetIndex = Math.floor(Math.random() * TEMPORARY_PASSWORD_ALPHABET.length);

		password += TEMPORARY_PASSWORD_ALPHABET[alphabetIndex];
	}

	return password;
}
