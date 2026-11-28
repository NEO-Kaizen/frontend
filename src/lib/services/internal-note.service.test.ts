import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/types/result';

const api = vi.hoisted(() => ({
	getInternalNotes: vi.fn(),
	createInternalNote: vi.fn(),
	markInternalNotesRead: vi.fn()
}));

vi.mock('$lib/api/internal-note.api', () => api);

import { getInternalNotes, validateInternalNoteContent } from '$lib/services/internal-note.service';

describe('observações internas e permissões', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('traduz 401 como sessão expirada', async () => {
		api.getInternalNotes.mockRejectedValue(new ApiError(401, 'cookie missing'));

		const result = await getInternalNotes('MAAT-8K3P-9X2M');

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.status).toBe(401);
			expect(result.error.message).toBe('Sua sessão expirou. Entre novamente para continuar.');
		}
	});

	it('traduz 403 sem expor a mensagem do backend', async () => {
		api.getInternalNotes.mockRejectedValue(
			new ApiError(403, 'Acesso restrito aos perfis internos')
		);

		const result = await getInternalNotes('MAAT-8K3P-9X2M');

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe(
				'Você não tem permissão para acessar as observações internas.'
			);
			expect(result.error.message).not.toContain('perfis internos');
		}
	});

	it('usa fallback seguro para erro 500', async () => {
		api.getInternalNotes.mockRejectedValue(
			new ApiError(500, 'internal-notes.service.ts: stack trace')
		);

		const result = await getInternalNotes('MAAT-8K3P-9X2M');

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Não foi possível carregar as observações internas.');
		}
	});

	it('informa falha de comunicação', async () => {
		api.getInternalNotes.mockRejectedValue(new TypeError('Failed to fetch'));

		const result = await getInternalNotes('MAAT-8K3P-9X2M');

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Não foi possível conectar ao servidor.');
		}
	});

	it('não aceita observação vazia', () => {
		expect(validateInternalNoteContent('   ')).toBe('Escreva uma observação antes de publicar.');
	});
});
