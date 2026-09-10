import { ApiError } from '$lib/types/result';
import type { PaginatedResponse } from '$lib/types/request';
import type {
	AdminUser,
	CreateUserPayload,
	CreateUserResponse,
	ListUsersQuery,
	ResetPasswordResponse,
	UpdateUserStatusResponse,
	UserStatus
} from '$lib/types/user';

// Fixtures — dados fictícios do domínio de usuários, consumidos apenas pelos mocks.
export const mockUsers: AdminUser[] = [
	{
		id: 1,
		name: 'Maria Oliveira',
		email: 'maria.oliveira@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-07-02T10:00:00.000Z'
	},
	{
		id: 2,
		name: 'João Santos',
		email: 'joao.santos@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-07-10T14:30:00.000Z'
	},
	{
		id: 3,
		name: 'Carlos Mendes',
		email: 'carlos.mendes@maat.com.br',
		role: 'Solicitante',
		status: 'Inativo',
		createdAt: '2026-07-15T09:20:00.000Z'
	},
	{
		id: 4,
		name: 'Fernanda Lima',
		email: 'fernanda.lima@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-07-22T16:45:00.000Z'
	},
	{
		id: 5,
		name: 'Rafael Costa',
		email: 'rafael.costa@maat.com.br',
		role: 'Solicitante',
		status: 'Inativo',
		createdAt: '2026-08-03T11:10:00.000Z'
	},
	{
		id: 6,
		name: 'Juliana Alves',
		email: 'juliana.alves@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-08-09T08:55:00.000Z'
	},
	{
		id: 7,
		name: 'Bruno Martins',
		email: 'bruno.martins@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-08-14T13:25:00.000Z'
	},
	{
		id: 8,
		name: 'Patrícia Rocha',
		email: 'patricia.rocha@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-08-20T10:40:00.000Z'
	},
	{
		id: 9,
		name: 'Lucas Ferreira',
		email: 'lucas.ferreira@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-08-23T15:05:00.000Z'
	},
	{
		id: 10,
		name: 'Amanda Nogueira',
		email: 'amanda.nogueira@maat.com.br',
		role: 'Solicitante',
		status: 'Inativo',
		createdAt: '2026-08-26T09:35:00.000Z'
	},
	{
		id: 11,
		name: 'Diego Barbosa',
		email: 'diego.barbosa@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-08-28T11:50:00.000Z'
	},
	{
		id: 12,
		name: 'Camila Duarte',
		email: 'camila.duarte@maat.com.br',
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: '2026-08-30T14:15:00.000Z'
	}
];

// Controle do próximo id — evita colisão com o máximo existente nos fixtures.
let nextId = Math.max(...mockUsers.map((user) => user.id)) + 1;

// Latência artificial para tornar o estado de carregamento perceptível na UI.
const MOCK_LATENCY_MS = 400;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function listUsersMock(query: ListUsersQuery): Promise<PaginatedResponse<AdminUser>> {
	let result = [...mockUsers];

	if (query.search) {
		const search = query.search.toLowerCase().trim();
		result = result.filter(
			(user) =>
				user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)
		);
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 10;
	const total = result.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;
	const data = result.slice(start, start + pageSize);

	return delay(MOCK_LATENCY_MS).then(() => ({ data, page, pageSize, total, totalPages }));
}

export function createUserMock(payload: CreateUserPayload): Promise<CreateUserResponse> {
	const email = payload.email.trim().toLowerCase();

	if (mockUsers.some((user) => user.email === email)) {
		return Promise.reject(new ApiError(409, 'E-mail já cadastrado.'));
	}

	const user: AdminUser = {
		id: nextId++,
		name: payload.name.trim(),
		email,
		role: 'Solicitante',
		status: 'Ativo',
		createdAt: new Date().toISOString()
	};

	mockUsers.unshift(user);

	return delay(MOCK_LATENCY_MS).then(() => ({ user }));
}

export function updateUserStatusMock(
	id: number,
	status: UserStatus
): Promise<UpdateUserStatusResponse> {
	const user = findMockUser(id);

	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado.'));
	}

	user.status = status;

	return delay(MOCK_LATENCY_MS).then(() => ({ user: { ...user } }));
}

export function resetUserPasswordMock(id: number): Promise<ResetPasswordResponse> {
	const user = findMockUser(id);

	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado.'));
	}

	const temporaryPassword = generateTemporaryPassword();

	return delay(MOCK_LATENCY_MS).then(() => ({ temporaryPassword }));
}

function findMockUser(id: number): AdminUser | undefined {
	return mockUsers.find((user) => user.id === id);
}

const TEMPORARY_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';

// Senha temporária fictícia — em produção a geração é responsabilidade do backend.
function generateTemporaryPassword(): string {
	const length = 10;
	let password = '';

	for (let i = 0; i < length; i += 1) {
		const index = Math.floor(Math.random() * TEMPORARY_PASSWORD_ALPHABET.length);
		password += TEMPORARY_PASSWORD_ALPHABET[index];
	}

	return password;
}
