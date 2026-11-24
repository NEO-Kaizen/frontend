import { getMeMock } from './auth.mock';
import { listProfilesMock } from './profiles.mock';
import { ApiError } from '$lib/types/result';
import { has } from '$lib/utils/permission-checks';
import type { ProfileReference } from '$lib/types/profile';
import type { PaginatedResponse } from '$lib/types/request';

import type {
	Analyst,
	CreateUserPayload,
	CreateUserResponse,
	ListUsersQuery,
	ResetPasswordResponse,
	UpdateUserInput,
	UpdateUserStatusResponse,
	UserProfileResponse,
	UserStats,
	UserSummary
} from '$lib/types/user';

export type MockUser = Omit<UserSummary, 'avatarUrl'> &
	Partial<Analyst> & { avatarUrl?: string | null };

export const mockUsers: MockUser[] = [
	{
		id: '1',
		fullName: 'Maria Oliveira',
		email: 'maria.oliveira@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-02T10:00:00.000Z'
	},
	{
		id: '2',
		fullName: 'João Santos',
		email: 'joao.santos@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-10T14:30:00.000Z'
	},
	{
		id: '3',
		fullName: 'Carlos Mendes',
		email: 'carlos.mendes@maat.com.br',
		profile: getProfileReference('1'),
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-07-15T09:20:00.000Z'
	},
	{
		id: '4',
		fullName: 'Fernanda Lima',
		email: 'fernanda.lima@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-22T16:45:00.000Z'
	},
	{
		id: '5',
		fullName: 'Rafael Costa',
		email: 'rafael.costa@maat.com.br',
		profile: getProfileReference('1'),
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-08-03T11:10:00.000Z'
	},
	{
		id: '6',
		fullName: 'Juliana Alves',
		email: 'juliana.alves@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-09T08:55:00.000Z'
	},
	{
		id: '7',
		fullName: 'Bruno Martins',
		email: 'bruno.martins@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-14T13:25:00.000Z'
	},
	{
		id: '8',
		fullName: 'Patrícia Rocha',
		email: 'patricia.rocha@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-20T10:40:00.000Z'
	},
	{
		id: '9',
		fullName: 'Lucas Ferreira',
		email: 'lucas.ferreira@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-23T15:05:00.000Z'
	},
	{
		id: '10',
		fullName: 'Amanda Nogueira',
		email: 'amanda.nogueira@maat.com.br',
		profile: getProfileReference('1'),
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-08-26T09:35:00.000Z'
	},
	{
		id: '11',
		fullName: 'Diego Barbosa',
		email: 'diego.barbosa@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-28T11:50:00.000Z'
	},
	{
		id: '12',
		fullName: 'Camila Duarte',
		email: 'camila.duarte@maat.com.br',
		profile: getProfileReference('1'),
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-30T14:15:00.000Z'
	},
	{
		id: '13',
		fullName: 'Ana Beatriz Souza',
		email: 'ana.souza@maat.com.br',
		profile: getProfileReference('2'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-05T09:00:00.000Z',
		specialty: 'Analista de processos',
		categories: ['Padronização', 'Revisão de processo'],
		notes: 'Foco em padronização de processos; disponível em horário integral.',
		requestLoad: 8
	},
	{
		id: '14',
		fullName: 'Marcelo Tavares',
		email: 'marcelo.tavares@maat.com.br',
		profile: getProfileReference('2'),
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-18T11:30:00.000Z',
		specialty: 'Técnico em infraestrutura',
		categories: ['Apoio técnico', 'Outros'],
		notes: null,
		requestLoad: 4
	},
	{
		id: '15',
		fullName: 'Renata Campos',
		email: 'renata.campos@maat.com.br',
		profile: getProfileReference('2'),
		isActive: false,
		mustChangePassword: false,
		createdAt: '2026-08-27T16:20:00.000Z',
		specialty: 'Especialista em indicadores',
		categories: ['Indicador', 'Dashboard ou relatório'],
		notes: 'Em licença até 09/2026.',
		requestLoad: null
	},
	{
		id: '16',
		fullName: 'Paulo Henrique Dias',
		email: 'paulo.dias@maat.com.br',
		profile: getProfileReference('3'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-06-12T08:45:00.000Z'
	},
	{
		id: '17',
		fullName: 'Simone Ribeiro',
		email: 'simone.ribeiro@maat.com.br',
		profile: getProfileReference('3'),
		isActive: true,
		mustChangePassword: true,
		createdAt: '2026-08-21T14:05:00.000Z'
	},
	{
		id: '18',
		fullName: 'Administrador Teste',
		email: 'administrador.teste@maat.com.br',
		profile: getProfileReference('4'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-06-01T10:00:00.000Z'
	},
	{
		id: '19',
		fullName: 'Helena Prado',
		email: 'helena.prado@maat.com.br',
		profile: getProfileReference('4'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-07-19T13:40:00.000Z'
	},
	{
		id: '20',
		fullName: 'Rafael Alves',
		email: 'rafael.alves@maat.com.br',
		profile: getProfileReference('2'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-10T10:00:00.000Z',
		specialty: 'Eletricista residencial',
		categories: ['Apoio técnico', 'Automação'],
		notes: 'Disponível à tarde; já atuou nesta região.',
		requestLoad: 6
	},
	{
		id: '21',
		fullName: 'Fernanda Lima',
		email: 'fernanda.lima.analista@maat.com.br',
		profile: getProfileReference('2'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-11T09:30:00.000Z',
		specialty: 'Instalações elétricas prediais',
		categories: ['Melhoria de processo', 'Apoio técnico'],
		notes: null,
		requestLoad: 9
	},
	{
		id: '22',
		fullName: 'Mariana Costa',
		email: 'mariana.costa@maat.com.br',
		profile: getProfileReference('2'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-12T09:00:00.000Z',
		specialty: 'Técnica em climatização',
		categories: ['Indicador', 'Dashboard ou relatório'],
		notes: 'Disponível às segundas e quartas; foco em climatização.',
		requestLoad: 12
	},
	{
		id: '23',
		fullName: 'Lucas Andrade',
		email: 'lucas.andrade@maat.com.br',
		profile: getProfileReference('2'),
		isActive: true,
		mustChangePassword: false,
		createdAt: '2026-08-13T10:15:00.000Z',
		specialty: '',
		categories: [],
		notes: null,
		requestLoad: null
	}
];

let nextId = Math.max(...mockUsers.map((user) => Number(user.id))) + 1;

const mockProfileDetails = new Map<
	string,
	Pick<UserProfileResponse, 'requester' | 'professional' | 'avatarUrl'>
>();

const MOCK_LATENCY_MS = 400;

const TEMPORARY_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';

function findProfile(profileId: string) {
	return listProfilesMock().find((candidate) => candidate.id === profileId);
}

function findProfileReference(profileId: string): ProfileReference | undefined {
	const profile = findProfile(profileId);
	return profile ? { id: profile.id, name: profile.name } : undefined;
}

function requiresProfessionalProfile(profileId: string): boolean {
	const profile = findProfile(profileId);
	return Boolean(profile?.isAssignableTriage || profile?.isAssignableMapping);
}

function isProtectedProfile(profileId: string): boolean {
	const profile = findProfile(profileId);
	return Boolean(
		profile?.isRoot || profile?.permissions.some((permission) => permission.key === 'user:manage')
	);
}

function hasTriageProfile(profileId: string): boolean {
	return findProfile(profileId)?.isAssignableTriage === true;
}

function getProfileReference(profileId: string): ProfileReference {
	const reference = findProfileReference(profileId);
	if (!reference) {
		throw new ApiError(422, 'Perfil inválido.');
	}
	return reference;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(text: string): string {
	return text
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.trim();
}

export function listUsersMock(query: ListUsersQuery): Promise<PaginatedResponse<UserSummary>> {
	let result = [...mockUsers];

	const profileId = query.profileId;
	if (profileId) {
		result = result.filter((user) => user.profile.id === profileId);
	}

	if (query.search) {
		const search = normalize(query.search);

		result = result.filter(
			(user) => normalize(user.fullName).includes(search) || normalize(user.email).includes(search)
		);
	}

	if (query.category) {
		const normalizedCategory = normalize(query.category);
		result = result.filter((user) => {
			const categories = (user as Analyst).categories ?? [];
			return categories.some((cat) => normalize(cat) === normalizedCategory);
		});
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 10;
	const total = result.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;

	const data = result.slice(start, start + pageSize).map((user) => ({
		...user,
		avatarUrl: user.avatarUrl ?? null
	}));

	return delay(MOCK_LATENCY_MS).then(() => ({
		data,
		page,
		pageSize,
		total,
		totalPages
	}));
}

export function listAnalystsMock(): Promise<Analyst[]> {
	const result = mockUsers
		.filter((user) => user.isActive && hasTriageProfile(user.profile.id))
		.map((user) => ({
			id: user.id,
			fullName: user.fullName,
			email: user.email,
			specialty: user.specialty ?? '',
			categories: user.categories ?? [],
			notes: user.notes ?? null,
			requestLoad: user.requestLoad ?? null
		}));
	return delay(MOCK_LATENCY_MS).then(() => result);
}

export function getUserStatsMock(): UserStats {
	return {
		total: mockUsers.length,
		active: mockUsers.filter((user) => user.isActive).length,
		pending: mockUsers.filter((user) => user.mustChangePassword).length,
		admins: mockUsers.filter((user) => isProtectedProfile(user.profile.id)).length
	};
}

export async function createUserMock(payload: CreateUserPayload): Promise<CreateUserResponse> {
	await requirePermission('user:manage');
	await requirePermission('profile:manage');

	const profile = findProfileReference(payload.profileId);

	if (!profile) {
		return Promise.reject(new ApiError(422, 'Perfil inválido.'));
	}

	if (isProtectedProfile(payload.profileId)) {
		return Promise.reject(new ApiError(403, 'Não é possível gerenciar contas de Administradores'));
	}

	if (!payload.requester?.area?.trim() || !payload.requester?.manager?.trim()) {
		return Promise.reject(new ApiError(400, 'Informe área e gestor responsável.'));
	}

	const email = payload.email.trim().toLowerCase();

	const duplicatedEmail = mockUsers.some((user) => user.email.toLowerCase() === email);

	if (duplicatedEmail) {
		return Promise.reject(new ApiError(409, 'E-mail já cadastrado'));
	}

	const temporaryPassword = generateTemporaryPassword();
	const createdAt = new Date().toISOString();
	const id = String(nextId++);

	const baseUser: MockUser = {
		id,
		fullName: payload.fullName.trim(),
		email,
		profile,
		isActive: true,
		mustChangePassword: true,
		createdAt
	};

	if (requiresProfessionalProfile(payload.profileId)) {
		baseUser.specialty = payload.professional?.jobTitle ?? '';
		baseUser.categories = [];
		baseUser.notes = payload.professional?.notes ?? null;
		baseUser.requestLoad = 0;
	}

	mockUsers.unshift(baseUser);
	mockProfileDetails.set(id, {
		avatarUrl: null,
		requester: {
			area: payload.requester.area,
			department: payload.requester.department ?? null,
			manager: payload.requester.manager,
			additionalContact: payload.requester.additionalContact ?? null
		},
		professional:
			requiresProfessionalProfile(payload.profileId) && payload.professional
				? {
						jobTitle: payload.professional.jobTitle,
						specialties: payload.professional.specialties,
						attendedCategoryIds: payload.professional.attendedCategoryIds,
						notes: payload.professional.notes ?? null
					}
				: null
	});

	return delay(MOCK_LATENCY_MS).then(() => ({
		id,
		fullName: baseUser.fullName,
		email: baseUser.email,
		profile,
		isActive: true,
		mustChangePassword: true,
		createdAt,
		temporaryPassword
	}));
}

export async function updateUserStatusMock(
	id: string,
	isActive: boolean
): Promise<UpdateUserStatusResponse> {
	await requirePermission('user:manage');

	const user = findMockUser(id);

	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado'));
	}

	if (isProtectedProfile(user.profile.id)) {
		return Promise.reject(new ApiError(403, 'Não é possível gerenciar contas de Administradores'));
	}

	user.isActive = isActive;

	return delay(MOCK_LATENCY_MS).then(() => ({
		id: user.id,
		isActive: user.isActive
	}));
}

export async function resetUserPasswordMock(id: string): Promise<ResetPasswordResponse> {
	await requirePermission('user:manage');

	const user = findMockUser(id);

	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado'));
	}

	if (isProtectedProfile(user.profile.id)) {
		return Promise.reject(new ApiError(403, 'Não é possível gerenciar contas de Administradores'));
	}

	user.mustChangePassword = true;

	const temporaryPassword = generateTemporaryPassword();

	return delay(MOCK_LATENCY_MS).then(() => ({
		id: user.id,
		temporaryPassword
	}));
}

export function getUserMock(id: string): Promise<UserProfileResponse> {
	const user = findMockUser(id);
	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado'));
	}

	const saved = mockProfileDetails.get(id);
	const fallbackProfessional = requiresProfessionalProfile(user.profile.id)
		? {
				jobTitle: user.specialty ?? null,
				specialties: user.specialty ? [user.specialty] : [],
				attendedCategoryIds: [],
				notes: user.notes ?? null
			}
		: null;

	return delay(MOCK_LATENCY_MS).then(() => ({
		id: user.id,
		fullName: user.fullName,
		email: user.email,
		profile: user.profile,
		avatarUrl: saved?.avatarUrl ?? null,
		requester: saved?.requester ?? {
			area: 'Área não informada',
			department: null,
			manager: 'Gestor não informado',
			additionalContact: null
		},
		professional: saved?.professional ?? fallbackProfessional
	}));
}

export async function updateUserMock(
	id: string,
	payload: UpdateUserInput
): Promise<UserProfileResponse> {
	await requirePermission('user:manage');

	const user = findMockUser(id);
	if (!user) {
		return Promise.reject(new ApiError(404, 'Usuário não encontrado'));
	}
	if (isProtectedProfile(user.profile.id)) {
		throw new ApiError(403, 'Não é possível gerenciar contas de Administradores');
	}
	if (payload.fullName !== undefined) {
		user.fullName = payload.fullName.trim();
	}
	if (payload.profileId !== undefined) {
		await requirePermission('profile:manage');

		const profile = findProfileReference(payload.profileId);
		if (!profile) {
			throw new ApiError(422, 'Perfil inválido.');
		}
		if (isProtectedProfile(payload.profileId)) {
			throw new ApiError(403, 'Não é possível gerenciar contas de Administradores');
		}
		user.profile = { id: profile.id, name: profile.name };
	}

	const current = await getUserMock(id);
	const next: UserProfileResponse = {
		...current,
		fullName: payload.fullName?.trim() ?? current.fullName,
		profile: user.profile,
		requester: payload.requester
			? {
					area: payload.requester.area ?? current.requester?.area ?? null,
					department:
						payload.requester.department !== undefined
							? payload.requester.department || null
							: (current.requester?.department ?? null),
					manager: payload.requester.manager ?? current.requester?.manager ?? null,
					additionalContact: current.requester?.additionalContact ?? null
				}
			: current.requester,
		professional: payload.professional
			? { ...payload.professional, notes: payload.professional.notes ?? null }
			: requiresProfessionalProfile(user.profile.id)
				? current.professional
				: null
	};

	mockProfileDetails.set(id, {
		avatarUrl: next.avatarUrl,
		requester: next.requester,
		professional: next.professional
	});

	return delay(MOCK_LATENCY_MS).then(() => next);
}

async function requirePermission(key: 'user:manage' | 'profile:manage'): Promise<void> {
	const currentUser = await getMeMock();
	if (!has(key, currentUser)) {
		throw new ApiError(
			403,
			key === 'user:manage'
				? 'Você não tem permissão para gerenciar usuários.'
				: 'Você não tem permissão para definir o perfil do usuário.'
		);
	}
}

function findMockUser(id: string): MockUser | undefined {
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
