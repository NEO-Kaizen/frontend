import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import InternalNotesSection from './InternalNotesSection.svelte';

vi.mock('$app/state', () => ({
	page: {
		data: {
			user: null
		}
	}
}));

vi.mock('$lib/services/internal-note.service', () => ({
	createInternalNote: vi.fn(),
	getInternalNotes: vi.fn(),
	markInternalNotesRead: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
	validateInternalNoteContent: vi.fn(() => null)
}));

describe('InternalNotesSection — restrição de leitura', () => {
	it('não renderiza o conteúdo das notas quando o load retorna erro de permissão', () => {
		render(InternalNotesSection, {
			props: {
				protocol: 'MAAT-8K3P-9X2M',
				assigneeId: null,
				mappingAssigneeId: null,
				items: [
					{
						type: 'note',
						id: 'nota-restrita-ficticia',
						content: 'Conteúdo interno fictício que não deve aparecer.',
						createdAt: '2026-01-15T10:00:00.000Z',
						author: {
							id: 'usuario-ficticio',
							name: 'Pessoa Fictícia',
							profile: { id: null, name: 'Analista' }
						}
					}
				],
				nextCursor: null,
				triages: [],
				mappings: [],
				loadError: 'Você não tem permissão para acessar as observações internas.',
				loadRetryable: false,
				currentUserId: 'usuario-ficticio',
				onNotesLoaded: vi.fn(),
				onOlderLoaded: vi.fn(),
				onLoadError: vi.fn(),
				onNoteCreated: vi.fn(),
				onMarkedRead: vi.fn()
			}
		});

		expect(screen.getByRole('alert')).toHaveTextContent(
			'Você não tem permissão para acessar as observações internas.'
		);
		expect(screen.queryByLabelText('Histórico de observações internas')).not.toBeInTheDocument();
		expect(
			screen.queryByText('Conteúdo interno fictício que não deve aparecer.')
		).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
	});
});
