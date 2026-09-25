import {
	getAuditHistoryDetail as getAuditHistoryDetailApi,
	listAuditHistory as listAuditHistoryApi
} from '$lib/api/audit-history.api';

import { ApiError, type Result } from '$lib/types/result';

import type {
	AuditHistoryDetail,
	AuditHistoryListResponse,
	AuditHistoryQuery
} from '$lib/types/audit';

export async function listAuditHistory(
	query: AuditHistoryQuery,
	fetchImpl?: typeof fetch
): Promise<Result<AuditHistoryListResponse>> {
	try {
		return { ok: true, data: await listAuditHistoryApi(query, fetchImpl) };
	} catch (error) {
		return { ok: false, error: toError(error) };
	}
}

export async function getAuditHistoryDetail(
	id: number,
	fetchImpl?: typeof fetch
): Promise<Result<AuditHistoryDetail>> {
	try {
		return { ok: true, data: await getAuditHistoryDetailApi(id, fetchImpl) };
	} catch (error) {
		return { ok: false, error: toError(error) };
	}
}

function toError(error: unknown): { status?: number; message: string } {
	if (error instanceof ApiError) {
		return { status: error.status, message: error.message };
	}

	return { message: 'Não foi possível conectar ao servidor.' };
}
