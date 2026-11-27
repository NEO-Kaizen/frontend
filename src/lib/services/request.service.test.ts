import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/types/result';
import type { CreateRequestPayload } from '$lib/types/request';

const api = vi.hoisted(() => ({
	listRequests: vi.fn(),
	listQueueRequests: vi.fn(),
	getQueueMetrics: vi.fn(),
	getRequestByProtocol: vi.fn(),
	getInternalRequest: vi.fn(),
	updateInternalRequest: vi.fn(),
	createRequest: vi.fn()
}));

vi.mock('$lib/api/request.api', () => api);

import {
	getInternalRequest,
	listQueueRequests,
	listRequests,
	searchRequests,
	submitDemand,
	updateInternalRequest
} from '$lib/services/request.service';

const emptyPage = { data: [], page: 1, pageSize: 5, total: 0, totalPages: 0 };

describe('estados da busca de solicitações', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('devolve lista vazia sem erro quando a busca não tem correspondência', async () => {
		api.listRequests.mockResolvedValue(emptyPage);

		const result = await listRequests({ email: 'usuario@exemplo.com' });

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.data.data).toEqual([]);
	});

	it('traduz 403 sem expor a mensagem técnica da API', async () => {
		api.listRequests.mockRejectedValue(
			new ApiError(403, 'internal token validation failed at /queue')
		);

		const result = await listRequests({ email: 'usuario@exemplo.com' });

		expect(result).toEqual({
			ok: false,
			error: {
				status: 403,
				retryable: false,
				message: 'Você não tem permissão para consultar estas solicitações.'
			}
		});
	});

	it('traduz 401 da fila como sessão expirada', async () => {
		api.listQueueRequests.mockRejectedValue(new ApiError(401, 'JWT expired: Bearer ...'));

		const result = await listQueueRequests({ page: 1, pageSize: 5 });

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.status).toBe(401);
			expect(result.error.retryable).toBe(false);
			expect(result.error.message).toBe('Sua sessão expirou. Entre novamente para continuar.');
		}
	});

	it('mantém mensagem genérica para erro 500', async () => {
		api.listQueueRequests.mockRejectedValue(
			new ApiError(500, 'at /src/queue.ts:42 connection refused')
		);

		const result = await listQueueRequests({ page: 1, pageSize: 5 });

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.retryable).toBe(true);
			expect(result.error.message).toBe('Não foi possível carregar a fila centralizada.');
		}
	});

	it('informa falha de comunicação quando não há ApiError', async () => {
		api.listQueueRequests.mockRejectedValue(new TypeError('Failed to fetch'));

		const result = await listQueueRequests({ page: 1, pageSize: 5 });

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.retryable).toBe(true);
			expect(result.error.message).toBe('Não foi possível conectar ao servidor.');
		}
	});

	it('traduz 404 do detalhe sem mensagem da API', async () => {
		api.getRequestByProtocol.mockRejectedValue(new ApiError(404, 'row not found in requests'));

		const result = await searchRequests('MAAT-8K3P-9X2M');

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Solicitação não encontrada.');
		}
	});

	it('traduz 401 no detalhe interno', async () => {
		api.getInternalRequest.mockRejectedValue(new ApiError(401, 'session cookie missing'));

		const result = await getInternalRequest('MAAT-8K3P-9X2M');

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Sua sessão expirou. Entre novamente para continuar.');
		}
	});

	it('mantém a mensagem específica de edição para 403', async () => {
		api.updateInternalRequest.mockRejectedValue(new ApiError(403, 'custody check failed'));

		const result = await updateInternalRequest('MAAT-8K3P-9X2M', {} as never);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Você não tem permissão para editar esta solicitação.');
		}
	});

	it('traduz 403 do envio com mensagem própria de criação', async () => {
		api.createRequest.mockRejectedValue(new ApiError(403, 'forbidden by policy'));

		const result = await submitDemand({} as CreateRequestPayload);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Você não tem permissão para enviar esta solicitação.');
		}
	});

	it('preserva a mensagem de validação 400 do backend no envio', async () => {
		api.createRequest.mockRejectedValue(
			new ApiError(400, 'Informe o departamento da solicitação.')
		);

		const result = await submitDemand({} as CreateRequestPayload);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe('Informe o departamento da solicitação.');
		}
	});

	it('traduz 429 no envio sem revelar detalhes internos', async () => {
		api.createRequest.mockRejectedValue(new ApiError(429, 'rate limit bucket user:123'));

		const result = await submitDemand({} as CreateRequestPayload);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.retryable).toBe(true);
			expect(result.error.message).toBe('Muitas tentativas. Aguarde um momento.');
		}
	});

	it('valida entrada vazia antes de chamar a API', async () => {
		const result = await searchRequests('   ');

		expect(result.ok).toBe(false);
		expect(api.getRequestByProtocol).not.toHaveBeenCalled();
		expect(api.listRequests).not.toHaveBeenCalled();
	});
});
