import { describe, expect, it } from 'vitest';
import { can, getHomePath, guard, has, hasAny } from './access.service';
import { canAccessCurrentResponsible } from '$lib/utils/permission-checks';
import type { SessionUser } from '$lib/types/auth';
import type { Permission, PermissionKey } from '$lib/types/permission';
import { QUEUE_SEARCH_KEYS } from '$lib/types/permission';

function user(permissions: Permission[], overrides: Partial<SessionUser> = {}): SessionUser {
	return {
		id: 'usuario-ficticio',
		name: 'Pessoa Fictícia',
		email: 'pessoa@exemplo.invalid',
		avatarUrl: null,
		role: 'Analista',
		isRoot: false,
		mustChangePassword: false,
		permissions,
		...overrides
	};
}

function permission(key: PermissionKey, custody: Permission['custody'] = 'assigned'): Permission {
	return { key, custody };
}

function captureRedirect(action: () => void): { status: number; location: string } {
	try {
		action();
	} catch (error) {
		return error as { status: number; location: string };
	}
	throw new Error('Nenhum redirecionamento foi capturado');
}

describe('guard — matriz de permissões', () => {
	it('redireciona usuário sem sessão para o login com returnTo', () => {
		const redirect = captureRedirect(() => guard('queue:read', null, '/fila'));

		expect(redirect.status).toBe(303);
		expect(redirect.location).toBe('/login?returnTo=%2Ffila');
	});

	it('bloqueia quem não tem queue:read e libera quem tem', () => {
		const semFila = user([permission('request:track', 'own')], { role: 'Solicitante' });
		const redirect = captureRedirect(() => guard('queue:read', semFila, '/fila'));

		expect(redirect.status).toBe(303);
		expect(redirect.location).toBe('/sem-autorizacao');
		expect(hasAny(QUEUE_SEARCH_KEYS, semFila)).toBe(false);
		expect(can('request:track', 'own', semFila)).toBe(true);

		const comFila = user([permission('queue:read', 'assigned')]);
		expect(() => guard('queue:read', comFila, '/fila')).not.toThrow();
		expect(hasAny(QUEUE_SEARCH_KEYS, comFila)).toBe(true);
	});

	it('mantém a leitura de observações internas restrita à chave própria', () => {
		const comNotas = user([
			permission('queue:read', 'assigned'),
			permission('internal_note:read', 'assigned')
		]);
		const semNotas = user([permission('queue:read', 'assigned')]);

		expect(has('internal_note:read', comNotas)).toBe(true);
		expect(has('internal_note:read', semNotas)).toBe(false);
		expect(() => guard('internal_note:read', comNotas, '/fila/MAAT-8K3P-9X2M')).not.toThrow();

		const redirect = captureRedirect(() =>
			guard('internal_note:read', semNotas, '/fila/MAAT-8K3P-9X2M')
		);
		expect(redirect.status).toBe(303);
		expect(redirect.location).toBe('/sem-autorizacao');
	});

	it('aplica a custódia de internal_note:read ao responsável atual', () => {
		const atribuido = user([permission('internal_note:read', 'assigned')]);
		expect(canAccessCurrentResponsible('internal_note:read', atribuido, atribuido.id, null)).toBe(
			true
		);
		expect(
			canAccessCurrentResponsible('internal_note:read', atribuido, 'outro-usuario', null)
		).toBe(false);

		const amplo = user([permission('internal_note:read', 'all')]);
		expect(canAccessCurrentResponsible('internal_note:read', amplo, 'outro-usuario', null)).toBe(
			true
		);
	});

	it('resolve a home conforme a permissão mais específica', () => {
		expect(getHomePath(user([permission('queue:read', 'assigned')]))).toBe('/fila');
		expect(getHomePath(user([permission('request:track', 'own')], { role: 'Solicitante' }))).toBe(
			'/acompanhar'
		);
		expect(getHomePath(null)).toBeNull();
	});
});
