import { mockInternalRequestDetails } from './requests.mock';
import { ApiError } from '$lib/types/result';
import { buildFieldLookup } from '$lib/pendency/field-catalog';

import type { RequestStatus } from '$lib/types/request';
import type {
	CreatePendencyPayload,
	CreatePendencyResponse,
	ListPendenciesQuery,
	ListPendenciesResponse,
	PendingFieldValue,
	PendingItem,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';

const PENDING_STATUS: RequestStatus = 'Pendente de informações';

// Fixtures do ciclo na tratativa MAAT-8K3P-9X2M (Em triagem). Uma pendência em
// cada status para demonstrar o agrupamento por status e a revisão em lote.
const seedItems: PendingItem[] = [
	{
		id: 'pnd-res-001',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-res-2026-001',
		field: {
			fieldKey: 'operational.systemsUsed',
			fieldLabel: 'Sistemas Utilizados',
			currentValue: 'E-mail corporativo, planilhas Excel'
		},
		comment: 'O processo de conferência passou a rodar no SAP. Atualize os sistemas utilizados.',
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
		batchId: 'batch-req-2026-002',
		field: {
			fieldKey: 'operational.volumetry',
			fieldLabel: 'Volumetria Aproximada',
			currentValue: '120'
		},
		comment: 'Informe a volumetria aproximada de comprovantes tratados por mês.',
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
		batchId: 'batch-val-2026-003',
		field: {
			fieldKey: 'demand.processName',
			fieldLabel: 'Nome do Processo Atual',
			currentValue: 'Pagamento de diárias'
		},
		comment: 'Ajuste o nome para refletir o escopo completo do processo.',
		status: 'validated',
		responseComment: 'Corrigido conforme solicitado.',
		correctedValue: 'Pagamento e reembolso de diárias',
		responseAttachments: [],
		createdAt: '2026-08-28T14:22:00.000Z',
		respondedAt: '2026-09-01T11:30:00.000Z',
		validatedAt: '2026-09-02T09:15:00.000Z'
	}
];

// Estado em memória por sessão: novos itens criados e ciclos decididos via modal
// persistem durante o uso da aplicação (mesmo padrão dos fixtures de requests).
const store: PendingItem[] = [...seedItems];

let idCounter = 0;
let batchCounter = 0;

function nextId(): string {
	idCounter += 1;
	return `pnd-gen-${String(idCounter).padStart(3, '0')}`;
}

function nextBatchId(): string {
	batchCounter += 1;
	return `batch-${Date.now().toString(36)}-${String(batchCounter).padStart(3, '0')}`;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function findByProtocol(protocol: string): string {
	return protocol.toLowerCase().trim();
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

// §1 — criação: resolve `fieldLabel`/`currentValue` a partir do catálogo (o
// mesmo papel que o backend terá), gera um `batchId` e muda o status.
export async function createPendingItemsMock(
	protocol: string,
	payload: CreatePendencyPayload
): Promise<CreatePendencyResponse> {
	const solicitation = findSolicitation(protocol);
	const lookup = buildFieldLookup(solicitation);
	const batchId = nextBatchId();
	const now = new Date().toISOString();

	const items = payload.items.map<PendingItem>((entry) => {
		const field = lookup.get(entry.fieldKey);
		if (!field) {
			throw new ApiError(400, 'Campo não marcável nesta solicitação.');
		}
		return {
			id: nextId(),
			protocol: solicitation.protocol,
			batchId,
			field: { ...field },
			comment: entry.comment.trim(),
			status: 'requested',
			responseComment: null,
			correctedValue: null,
			responseAttachments: [],
			createdAt: now,
			respondedAt: null,
			validatedAt: null
		};
	});

	store.unshift(...items);

	// Envio da pendência por campo muda o status da solicitação (transação §1).
	solicitation.status = PENDING_STATUS;
	solicitation.lastUpdate = now;

	return delay(500).then(() => ({
		batchId,
		requestAttachment: payload.requestAttachment ?? false,
		items: items.map((item) => structuredClone(item)),
		solicitationStatus: solicitation.status
	}));
}

// §3 — revisão em lote: valida todas as decisões antes de aplicar (atômico);
// validação fecha o item; reabertura sobrescreve e volta para `requested`.
export async function reviewPendingItemsMock(
	protocol: string,
	payload: ReviewPendingItemsBody
): Promise<ReviewPendingItemsResponse> {
	const solicitation = findSolicitation(protocol);
	const batchItems = store.filter(
		(item) =>
			item.batchId === payload.batchId &&
			item.protocol.toLowerCase().trim() === findByProtocol(protocol)
	);

	if (batchItems.length === 0) {
		throw new ApiError(404, 'Lote de pendências não encontrado.');
	}

	const respondedItems = batchItems.filter((item) => item.status === 'responded');

	if (respondedItems.some((item) => !payload.items.some((decision) => decision.id === item.id))) {
		throw new ApiError(400, 'Decida todos os itens respondidos do lote.');
	}

	// Valida tudo antes de mutar (transação atômica).
	for (const decision of payload.items) {
		const item = store.find((candidate) => candidate.id === decision.id);
		if (!item || item.batchId !== payload.batchId) {
			throw new ApiError(409, 'Item não pertence ao lote revisado.');
		}
		if (item.status !== 'responded') {
			throw new ApiError(409, 'Apenas itens respondidos podem ser revisados.');
		}
	}

	const now = new Date().toISOString();

	for (const decision of payload.items) {
		// Já validado acima (existe e pertence ao lote) — guarda de narrowing.
		const item = store.find((candidate) => candidate.id === decision.id);
		if (!item) continue;

		if (decision.decision === 'validate') {
			if (item.correctedValue !== null) {
				applyFieldValue(solicitation, item.field.fieldKey, item.correctedValue);
			}
			item.status = 'validated';
			item.validatedAt = now;
		} else {
			// Reabertura sobrescreve o item: volta a `requested` com novo comentário.
			item.status = 'requested';
			item.comment = decision.comment.trim();
			item.responseComment = null;
			item.correctedValue = null;
			item.responseAttachments = [];
			item.respondedAt = null;
			item.validatedAt = null;
			item.createdAt = now;
		}
	}

	solicitation.lastUpdate = now;

	const hasReopen = payload.items.some((decision) => decision.decision === 'reopen');

	return delay(500).then(() => ({
		batchId: payload.batchId,
		items: batchItems.map((item) => structuredClone(item)),
		solicitationStatus: hasReopen ? PENDING_STATUS : solicitation.status
	}));
}

// Aplica o valor corrigido (diff aprovado) no campo da solicitação — no contrato
// real o backend faz isso dentro da transação da revisão (§3).
function applyFieldValue(
	detail: (typeof mockInternalRequestDetails)[number],
	fieldKey: string,
	value: PendingFieldValue
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

	if (current === undefined) return;

	if (typeof current === 'number') {
		const parsed = value === null || value === '' ? current : Number(value);
		node[leaf] = Number.isFinite(parsed) ? parsed : current;
	} else if (typeof value === 'boolean') {
		node[leaf] = value;
	} else {
		node[leaf] = value === null || value === undefined ? '' : String(value);
	}
}
