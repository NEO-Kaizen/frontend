import type { SessionUser } from '../../../types/auth';

// Usuários fictícios do domínio de autenticação. Separados dos usuários de
// gestão (data/users.ts) porque representam personas de login distintas.
export type MockAuthUser = SessionUser & { password: string };

export const mockAuthUsers: MockAuthUser[] = [
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
		mustChangePassword: true,
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
		mustChangePassword: true,
		password: 'temp123'
	}
];

export function toSessionUser(user: MockAuthUser): SessionUser {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		mustChangePassword: user.mustChangePassword
	};
}

export function findAuthUserByEmail(email: string): MockAuthUser | undefined {
	const normalized = email.trim().toLowerCase();
	return mockAuthUsers.find((candidate) => candidate.email === normalized);
}

export function findAuthUserById(id: string): MockAuthUser | undefined {
	return mockAuthUsers.find((candidate) => candidate.id === id);
}
