import { describe, expect, it } from 'vitest';
import { canViewTriage, guard, isInternalProfile } from './access.service';
import type { SessionUser } from '$lib/types/auth';
import type { UserType } from '$lib/types/user';

function user(role: UserType): SessionUser {
	return {
		id: 'usuario-ficticio',
		name: 'Pessoa Fictícia',
		email: 'pessoa@exemplo.invalid',
		avatarUrl: null,
		role,
		mustChangePassword: false
	};
}

function captureRedirect(action: () => void): { status: number; location: string } {
	try {
		action();
	} catch (error) {
		return error as { status: number; location: string };
	}
	throw new Error('Nenhum redirecionamento foi capturado');
}

describe('guard — matriz de perfis', () => {
	it('redireciona usuário sem sessão para o login com returnTo', () => {
		const redirect = captureRedirect(() => guard('internalArea', null, '/fila'));

		expect(redirect.status).toBe(303);
		expect(redirect.location).toBe('/login?returnTo=%2Ffila');
	});

	it('redireciona Solicitante para a página de sem autorização', () => {
		const redirect = captureRedirect(() => guard('internalArea', user('Solicitante'), '/fila'));

		expect(redirect.status).toBe(303);
		expect(redirect.location).toBe('/sem-autorizacao');
		expect(isInternalProfile('Solicitante')).toBe(false);
	});

	it('permite perfis internos na área administrativa', () => {
		for (const role of ['Analista', 'Gestor', 'Administrador'] as const) {
			expect(() => guard('internalArea', user(role), '/fila')).not.toThrow();
			expect(isInternalProfile(role)).toBe(true);
		}
	});

	it('aplica a regra de custódia da triagem por perfil', () => {
		expect(canViewTriage(null, user('Gestor'))).toBe(true);
		expect(canViewTriage(null, user('Administrador'))).toBe(true);
		expect(canViewTriage(null, user('Analista'))).toBe(false);
		expect(canViewTriage('usuario-ficticio', user('Analista'))).toBe(true);
		expect(canViewTriage('usuario-ficticio', null)).toBe(false);
	});
});
