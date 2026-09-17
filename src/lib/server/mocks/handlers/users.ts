import type { CreateUserPayload, ListUsersQuery, UserProfile } from '../../../types/user';
import type { MockContext } from '../context';
import * as usersData from '../data/users';
import { isRecord, jsonResponse, MockHttpError, readJsonBody } from '../http';

const PROFILES: readonly UserProfile[] = ['solicitante', 'analista', 'administrador', 'gestor'];

export async function list({ url }: MockContext): Promise<Response> {
	const profile = url.searchParams.get('profile');

	const query: ListUsersQuery = {
		profile:
			profile && (PROFILES as readonly string[]).includes(profile)
				? (profile as UserProfile)
				: undefined,
		search: url.searchParams.get('search') ?? undefined,
		page: toNumber(url.searchParams.get('page')),
		pageSize: toNumber(url.searchParams.get('pageSize'))
	};

	return jsonResponse(await usersData.listUsers(query));
}

export function metrics(): Response {
	return jsonResponse(usersData.getUserStats());
}

export async function create({ request }: MockContext): Promise<Response> {
	const body = await readJsonBody(request);

	if (
		!isRecord(body) ||
		!isNonEmptyString(body.fullName) ||
		!isNonEmptyString(body.email) ||
		!isValidProfile(body.role)
	) {
		throw new MockHttpError(400, 'Informe nome, e-mail e perfil válidos.');
	}

	const payload: CreateUserPayload = {
		fullName: body.fullName,
		email: body.email,
		role: body.role
	};

	return jsonResponse(await usersData.createUser(payload), 201);
}

export async function updateStatus({ request, params }: MockContext): Promise<Response> {
	const body = await readJsonBody(request);

	if (!isRecord(body) || typeof body.isActive !== 'boolean') {
		throw new MockHttpError(400, 'Campo "isActive" deve ser booleano.');
	}

	return jsonResponse(await usersData.updateUserStatus(params[0], body.isActive));
}

export async function resetPassword({ params }: MockContext): Promise<Response> {
	return jsonResponse(await usersData.resetUserPassword(params[0]));
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isValidProfile(value: unknown): value is UserProfile {
	return typeof value === 'string' && (PROFILES as readonly string[]).includes(value);
}

function toNumber(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}
