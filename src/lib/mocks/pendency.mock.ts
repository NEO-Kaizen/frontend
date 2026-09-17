import { mockInternalRequestDetails } from './requests.mock';
import { ApiError } from '$lib/types/result';

import type { RequestStatus } from '$lib/types/request';
import type {
	CreatePendencyPayload,
	CreatePendencyResponse,
	ListPendenciesQuery,
	ListPendenciesResponse,
	PendingItem,
	ReopenPendencyPayload
} from '$lib/types/pendency';

const PENDING_STATUS: RequestStatus = 'Pendente de informações';

// Fixtures do ciclo na tratativa MAAT-8K3P-9X2M (Em triagem). Uma pendência em
// cada status para demonstrar o agrupamento por status e o desfecho da validação.
const seedItems: PendingItem[] = [
	{
		id: 'pnd-res-001',
		protocol: 'MAAT-8K3P-9X2M',
		field: {
			fieldKey: 'operational.systemsUsed',
			fieldLabel: 'Sistemas Utilizados',
			currentValue: 'E-mail corporativo, planilhas Excel'
		},
		comment: 'O processo de conferência passou a rodar no SAP. Atualize os sistemas utilizados.',
		attachments: [],
		status: 'responded',
		responseComment: 'Confirmado. O controle de diárias agora é feito no SAP.',
		correctedValue: 'SAP, planilhas Excel',
		responseAttachments: [],
		createdAt: '2026-09-01T09:12:00.000Z',
		respondedAt: '2026-09-04T15:40:00.000Z',
		validatedAt: null
	},
	{
		id: 'pnd-req-001',
		protocol: 'MAAT-8K3P-9X2M',
		field: {
			fieldKey: 'operational.volumetry',
			fieldLabel: 'Volumetria Aproximada',
			currentValue: '120'
		},
		comment: 'Informe a volumetria aproximada de comprovantes tratados por mês.',
		attachments: [],
		status: 'requested',
		responseComment: null,
		correctedValue: null,
		responseAttachments: [],
		createdAt: '2026-09-02T10:05:00.000Z',
		respondedAt: null,
		validatedAt: null
	},
	{
		id: 'pnd-val-001',
		protocol: 'MAAT-8K3P-9X2M',
		field: {
			fieldKey: 'demand.processName',
			fieldLabel: 'Nome do Processo Atual',
			currentValue: 'Pagamento de diárias'
		},
		comment: 'Ajuste o nome para refletir o escopo completo do processo.',
		attachments: [],
		status: 'validated',
		responseComment: 'Corrigido conforme solicitado.',
		correctedValue: 'Pagamento e reembolso de diárias',
		responseAttachments: [],
		createdAt: '2026-08-28T14:22:00.000Z',
		respondedAt: '2026-09-01T11:30:00.000Z',
		validatedAt: '2026-09-02T09:15:00.000Z'
	}
];

// Estado em memória por sessão: novos itens criados e ciclos validados via modal
// persistem durante o uso da aplicação (mesmo padrão dos fixtures de requests).
const store: PendingItem[] = [...seedItems];

let idCounter = 0;

function nextId(): string {
	idCounter += 1;
	return `pnd-gen-${String(idCounter).padStart(3, '0')}`;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function findByProtocol(protocol: string): string {
	return protocol.toLowerCase().trim();
}

function findInStore(protocol: string, id: string): PendingItem {
	const normalized = findByProtocol(protocol);
	const item = store.find(
		(candidate) => candidate.protocol.toLowerCase().trim() === normalized && candidate.id === id
	);

	if (!item) {
		throw new ApiError(404, 'Pendência não encontrada.');
	}

	return item;
}

function findSolicitation(protocol: string) {
	const normalized = findByProtocol(protocol);
	const detail = mockInternalRequestDetails.find(
		(candidate) => candidate.protocol.toLowerCase().trim() === normalized
	);

	if (!detail) {
		throw new ApiError(404, 'Solicitação não encontrada.');
	}

	return detail;
}

export async function listPendingItemsMock(
	protocol: string,
	query: ListPendenciesQuery = {}
): Promise<ListPendenciesResponse> {
	const normalized = findByProtocol(protocol);

	let items = store
		.filter((item) => item.protocol.toLowerCase().trim() === normalized)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));

	if (query.status) {
		items = items.filter((item) => item.status === query.status);
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 20;
	const total = items.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;
	const data = items.slice(start, start + pageSize);

	return delay(400).then(() => ({
		data: data.map((item) => structuredClone(item)),
		page,
		pageSize,
		total,
		totalPages
	}));
}

export async function createPendingItemsMock(
	protocol: string,
	payload: CreatePendencyPayload
): Promise<CreatePendencyResponse> {
	const solicitation = findSolicitation(protocol);
	const now = new Date().toISOString();

	const items = payload.items.map<PendingItem>((item) => ({
		id: nextId(),
		protocol: solicitation.protocol,
		field: { ...item.field },
		comment: item.comment.trim(),
		attachments: [],
		status: 'requested',
		responseComment: null,
		correctedValue: null,
		responseAttachments: [],
		createdAt: now,
		respondedAt: null,
		validatedAt: null
	}));

	store.unshift(...items);

	// Envio da pendência por campo muda o status da solicitação.
	solicitation.status = PENDING_STATUS;
	solicitation.lastUpdate = now;

	return delay(500).then(() => ({
		items: items.map((item) => structuredClone(item)),
		solicitationStatus: solicitation.status
	}));
}

export async function validatePendingItemMock(protocol: string, id: string): Promise<PendingItem> {
	const solicitation = findSolicitation(protocol);
	const item = findInStore(protocol, id);

	if (item.status !== 'responded') {
		throw new ApiError(409, 'A pendência precisa estar respondida para ser validada.');
	}

	item.status = 'validated';
	item.validatedAt = new Date().toISOString();

	if (item.correctedValue !== null) {
		applyFieldValue(solicitation, item.field.fieldKey, item.correctedValue);
	}
	solicitation.lastUpdate = item.validatedAt;

	return delay(500).then(() => structuredClone(item));
}

export async function reopenPendingItemMock(
	protocol: string,
	id: string,
	payload: ReopenPendencyPayload
): Promise<PendingItem> {
	const item = findInStore(protocol, id);

	if (item.status !== 'responded') {
		throw new ApiError(409, 'A pendência precisa estar respondida para ser reaberta.');
	}

	item.status = 'requested';
	item.comment = payload.comment.trim();
	item.responseComment = null;
	item.correctedValue = null;
	item.responseAttachments = [];
	item.respondedAt = null;

	return delay(500).then(() => structuredClone(item));
}

// Aplica o valor corrigido (diff aprovado) no campo da solicitação — no contrato
// real o backend faz isso dentro da transação do validate.
function applyFieldValue(
	detail: (typeof mockInternalRequestDetails)[number],
	fieldKey: string,
	value: string
): void {
	const keys = fieldKey.split('.');
	let node: Record<string, unknown> = detail as unknown as Record<string, unknown>;

	for (let i = 0; i < keys.length - 1; i++) {
		const next = node[keys[i]];
		if (typeof next !== 'object' || next === null) return;
		node = next as Record<string, unknown>;
	}

	const leaf = keys[keys.length - 1];
	const current = node[leaf];

	if (typeof current === 'number') {
		const parsed = Number(value);
		node[leaf] = Number.isFinite(parsed) ? parsed : current;
	} else {
		node[leaf] = value;
	}
}
