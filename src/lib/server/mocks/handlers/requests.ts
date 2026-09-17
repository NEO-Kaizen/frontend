import type { PriorityFilter, QueueQuery } from '../../../types/queue';
import type {
	CreateRequestPayload,
	ListRequestsQuery,
	RequestStatus,
	UpdateInternalRequestPayload
} from '../../../types/request';
import type { MockContext } from '../context';
import * as requestsData from '../data/requests';
import { isRecord, jsonResponse, MockHttpError, readJsonBody } from '../http';

// POST /requests — multipart com a parte textual "payload" e as partes
// binárias "attachments". O `formData()` do Request cuida do parsing.
export async function create({ request }: MockContext): Promise<Response> {
	const formData = await request.formData();
	const rawPayload = formData.get('payload');

	if (typeof rawPayload !== 'string') {
		throw new MockHttpError(400, 'Campo "payload" ausente no multipart.');
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(rawPayload);
	} catch {
		throw new MockHttpError(400, 'Campo "payload" inválido.');
	}

	if (!isCreateRequestPayload(parsed)) {
		throw new MockHttpError(400, 'Campo "payload" inválido.');
	}

	const files = formData
		.getAll('attachments')
		.filter((entry): entry is File => entry instanceof File);

	return jsonResponse(await requestsData.createRequest(parsed, files), 201);
}

export async function list({ url }: MockContext): Promise<Response> {
	const email = url.searchParams.get('email');

	if (!email) {
		throw new MockHttpError(400, 'Parâmetro "email" é obrigatório.');
	}

	const query: ListRequestsQuery = {
		email,
		search: url.searchParams.get('search') ?? undefined,
		status: toStatus(url.searchParams.get('status')),
		page: toNumber(url.searchParams.get('page')),
		pageSize: toNumber(url.searchParams.get('pageSize'))
	};

	return jsonResponse(await requestsData.listRequests(query));
}

export async function queue({ url }: MockContext): Promise<Response> {
	const priority = url.searchParams.get('priority');
	const assigneeId = url.searchParams.get('assigneeId');

	const query: QueueQuery = {
		page: toNumber(url.searchParams.get('page')),
		pageSize: toNumber(url.searchParams.get('pageSize')),
		search: url.searchParams.get('search') ?? undefined,
		status: toStatus(url.searchParams.get('status')),
		priority: priority !== null ? (priority as PriorityFilter) : undefined,
		assigneeId: assigneeId !== null ? assigneeId : undefined
	};

	return jsonResponse(await requestsData.listQueueRequests(query));
}

export async function queueMetrics(): Promise<Response> {
	return jsonResponse(await requestsData.getQueueMetrics());
}

export async function detail({ params }: MockContext): Promise<Response> {
	return jsonResponse(await requestsData.getRequestByProtocol(params[0]));
}

export async function internal({ params }: MockContext): Promise<Response> {
	return jsonResponse(await requestsData.getInternalRequest(params[0]));
}

export async function updateInternal({ request, params }: MockContext): Promise<Response> {
	const body = await readJsonBody(request);

	if (
		!isRecord(body) ||
		!isRecord(body.requester) ||
		!isRecord(body.demand) ||
		!isRecord(body.operational)
	) {
		throw new MockHttpError(400, 'Blocos "requester", "demand" e "operational" são obrigatórios.');
	}

	const payload = body as unknown as UpdateInternalRequestPayload;

	return jsonResponse(await requestsData.updateInternalRequest(params[0], payload));
}

// Valida apenas o que o mock usa ao registrar a solicitação — o suficiente
// para não transformar um payload malformado em 500.
function isCreateRequestPayload(value: unknown): value is CreateRequestPayload {
	if (!isRecord(value)) return false;

	const { requester, demand, operational } = value;

	if (!isRecord(requester) || !isRecord(demand) || !isRecord(operational)) {
		return false;
	}

	return (
		typeof requester.fullName === 'string' &&
		typeof requester.corporateEmail === 'string' &&
		typeof demand.processName === 'string' &&
		typeof demand.title === 'string'
	);
}

function toNumber(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function toStatus(value: string | null): RequestStatus | undefined {
	return value ? (value as RequestStatus) : undefined;
}
