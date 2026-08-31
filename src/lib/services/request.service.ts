import { ApiError } from '$lib/api/client';
import {
	listRequests as listRequestsApi,
	getRequestByProtocol as getRequestByProtocolApi
} from '$lib/api/request.api';
import type {
	ListRequestsQuery,
	PaginatedResponse,
	RequestSummary,
	RequestDetail
} from '$lib/types/request';

type ListRequestsResult =
	| { ok: true; data: PaginatedResponse<RequestSummary> }
	| { ok: false; error: { status?: number; message: string } };

type RequestDetailResult =
	{ ok: true; data: RequestDetail } | { ok: false; error: { status?: number; message: string } };

export async function listRequests(query: ListRequestsQuery): Promise<ListRequestsResult> {
	try {
		const data = await listRequestsApi(query);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: { status: error.status, message: 'Não foi possível carregar as solicitações.' }
			};
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}

export async function getRequestByProtocol(protocol: string): Promise<RequestDetailResult> {
	try {
		const data = await getRequestByProtocolApi(protocol);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message = error.status === 404 ? 'Solicitação não encontrada.' : error.message;
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível conectar ao servidor.' } };
	}
}
