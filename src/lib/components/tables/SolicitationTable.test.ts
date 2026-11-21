import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import SolicitationTable from './SolicitationTable.svelte';
import type { PaginatedResponse, RequestSummary } from '$lib/types/request';

vi.mock('$app/state', () => ({
	page: {
		data: { portalConfig: { statuses: [] } },
		url: new URL('http://localhost/')
	}
}));

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));

vi.mock('$app/paths', () => ({
	resolve: (_route: string, params?: Record<string, string>) =>
		params?.protocolo ? `/protocolo/${params.protocolo}` : '/'
}));

const request: RequestSummary = {
	protocol: 'MAAT-8K3P-9X2M',
	createdAt: '2026-01-15T10:00:00.000Z',
	demandTitle: 'Demanda fictícia',
	processName: 'Processo fictício',
	priority: 'Média',
	status: 'Em triagem',
	assignee: null,
	requesterName: 'Pessoa Fictícia'
};

function pageOf(data: RequestSummary[]): PaginatedResponse<RequestSummary> {
	return { data, page: 1, pageSize: 5, total: data.length, totalPages: 1 };
}

describe('SolicitationTable — estados da busca', () => {
	it('mostra carregamento e marca a tabela como ocupada', () => {
		render(SolicitationTable, {
			props: { page: 1, result: null, isFetching: true, onpagechange: vi.fn() }
		});

		expect(screen.getByText(/Carregando solicitações/).closest('[role="status"]')).not.toBeNull();
		expect(screen.getByText('Atualizando…')).toBeInTheDocument();
		expect(document.querySelector('.table-container')).toHaveAttribute('aria-busy', 'true');
	});

	it('remove o carregamento e mostra mensagem de vazio quando a busca termina sem resultados', () => {
		render(SolicitationTable, {
			props: {
				page: 1,
				result: { ok: true, data: pageOf([]) },
				isFetching: false,
				emptyMessage: 'Ajuste a busca ou os filtros e tente novamente.',
				onpagechange: vi.fn()
			}
		});

		expect(screen.queryByText(/Carregando solicitações/)).not.toBeInTheDocument();
		expect(screen.queryByText('Atualizando…')).not.toBeInTheDocument();
		expect(screen.getByText('Nenhuma solicitação encontrada')).toBeInTheDocument();
		expect(screen.getByText(/Ajuste a busca ou os filtros/)).toBeInTheDocument();
	});

	it('exibe erro da API sem quebrar a página e permite repetir a busca', async () => {
		const onretry = vi.fn();

		render(SolicitationTable, {
			props: {
				page: 1,
				result: {
					ok: false,
					error: { status: 500, message: 'Não foi possível carregar a fila centralizada.' }
				},
				isFetching: false,
				onretry,
				onpagechange: vi.fn()
			}
		});

		expect(screen.getByRole('alert')).toHaveTextContent(
			'Não foi possível carregar a fila centralizada.'
		);
		await fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
		expect(onretry).toHaveBeenCalledTimes(1);
	});

	it('mostra os resultados e nenhum indicador de carregamento após sucesso', () => {
		render(SolicitationTable, {
			props: {
				page: 1,
				result: { ok: true, data: pageOf([request]) },
				isFetching: false,
				onpagechange: vi.fn()
			}
		});

		expect(screen.getByRole('link', { name: '#MAAT-8K3P-9X2M' })).toHaveAttribute(
			'href',
			'/protocolo/MAAT-8K3P-9X2M'
		);
		expect(screen.queryByText(/Carregando solicitações/)).not.toBeInTheDocument();
	});
});
