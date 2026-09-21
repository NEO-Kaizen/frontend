import { mockInternalRequestDetails } from './requests.mock';
import { ApiError } from '$lib/types/result';
import { buildFieldLookup } from '$lib/pendency/field-catalog';

import type { RequestStatus } from '$lib/types/request';
import type {
	CreatePendingItemsBody,
	CreatePendingItemsResponse,
	PendingFieldValue,
	PendingItem,
	ReviewPendingItemsBody,
	ReviewPendingItemsResponse
} from '$lib/types/pendency';

const PENDING_STATUS: RequestStatus = 'Pendente de informações';

// Fixtures da tratativa MAAT-8K3P-9X2M (Em triagem), no formato v0.5
// (`type` + `field` anulável + `responseText` + `deadline`). Cenários do
// domínio (§13): um lote com observação + 5 campos em estados diferentes e
// um lote somente-observação (já respondido, para exercitar a revisão).
const seedItems: PendingItem[] = [
	// Lote A — 1 observação + 5 campos (requested/responded/validated).
	{
		id: 'pnd-101-obs',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-101',
		type: 'observation',
		field: null,
		comment: 'Precisamos corrigir os dados cadastrais e operacionais antes de priorizar a demanda.',
		status: 'requested',
		correctedValue: null,
		responseText: null,
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-01T09:00:00.000Z',
		respondedAt: null,
		validatedAt: null
	},
	{
		id: 'pnd-101-f1',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-101',
		type: 'field_edit',
		field: {
			fieldKey: 'demand.processName',
			fieldLabel: 'Nome do Processo Atual',
			currentValue: 'Pagamento de diárias'
		},
		comment: 'Ajuste o nome para refletir o escopo completo do processo.',
		status: 'validated',
		correctedValue: 'Pagamento e reembolso de diárias',
		responseText: 'Corrigido conforme solicitado.',
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-01T09:00:00.000Z',
		respondedAt: '2026-09-02T11:30:00.000Z',
		validatedAt: '2026-09-03T09:15:00.000Z'
	},
	{
		id: 'pnd-101-f2',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-101',
		type: 'field_edit',
		field: {
			fieldKey: 'operational.systemsUsed',
			fieldLabel: 'Sistemas Utilizados',
			currentValue: 'E-mail corporativo, planilhas Excel'
		},
		comment: 'O processo de conferência passou a rodar no SAP. Atualize os sistemas utilizados.',
		status: 'responded',
		correctedValue: 'SAP, planilhas Excel',
		responseText: 'Confirmado. O controle de diárias agora é feito no SAP.',
		responseAttachments: [
			{
				fileName: 'evidencia-sap.pdf',
				mimeType: 'application/pdf',
				sizeBytes: 184320,
				downloadUrl: '/mocks/evidencia-sap.pdf',
				canDownload: true
			}
		],
		deadline: null,
		createdAt: '2026-09-01T09:00:00.000Z',
		respondedAt: '2026-09-04T15:40:00.000Z',
		validatedAt: null
	},
	{
		id: 'pnd-101-f3',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-101',
		type: 'field_edit',
		field: {
			fieldKey: 'operational.volumetry',
			fieldLabel: 'Volumetria Aproximada',
			currentValue: '120'
		},
		comment: 'Informe a volumetria aproximada de comprovantes tratados por mês.',
		status: 'requested',
		correctedValue: null,
		responseText: null,
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-01T09:00:00.000Z',
		respondedAt: null,
		validatedAt: null
	},
	{
		id: 'pnd-101-f4',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-101',
		type: 'field_edit',
		field: {
			fieldKey: 'demand.justification',
			fieldLabel: 'Justificativa da solicitação',
			currentValue: 'Reduzir o tempo de conferência e os erros de pagamento de diárias.'
		},
		comment: 'Detalhe o impacto financeiro atual para justificar a priorização.',
		status: 'responded',
		correctedValue:
			'O retrabalho consome 30h mensais e gerou 12 pagamentos indevidos no último trimestre.',
		responseText: 'Complementado com os números do último trimestre.',
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-01T09:00:00.000Z',
		respondedAt: '2026-09-04T16:05:00.000Z',
		validatedAt: null
	},
	{
		id: 'pnd-101-f5',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-101',
		type: 'field_edit',
		field: {
			fieldKey: 'requester.area',
			fieldLabel: 'Área do solicitante',
			currentValue: 'Operações'
		},
		comment: 'Confirme a área responsável pela demanda.',
		status: 'requested',
		correctedValue: null,
		responseText: null,
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-01T09:00:00.000Z',
		respondedAt: null,
		validatedAt: null
	},
	// Lote B — somente observação, já respondida (exercita validação de item
	// `observation` e o desbloqueio de nova pendência após revisão total).
	{
		id: 'pnd-102-obs',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-102',
		type: 'observation',
		field: null,
		comment: 'Favor complementar os documentos do processo.',
		status: 'responded',
		correctedValue: null,
		responseText: 'Documentos complementares anexados ao protocolo.',
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-05T10:20:00.000Z',
		respondedAt: '2026-09-06T14:10:00.000Z',
		validatedAt: null
	},
	// Lote C — 5 campos: 3 validados + 1 responded + 1 requested. Exercita a
	// revisão parcial (D-P23): decidir o item responded sem encerrar os demais.
	{
		id: 'pnd-103-f1',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-103',
		type: 'field_edit',
		field: {
			fieldKey: 'demand.title',
			fieldLabel: 'Título Resumido',
			currentValue: 'Automatizar conferência de diárias'
		},
		comment: 'Confirme se o título resume bem a necessidade.',
		status: 'validated',
		correctedValue: 'Automatizar conferência de diárias',
		responseText: 'Título confirmado.',
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-07T09:00:00.000Z',
		respondedAt: '2026-09-08T10:00:00.000Z',
		validatedAt: '2026-09-08T11:00:00.000Z'
	},
	{
		id: 'pnd-103-f2',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-103',
		type: 'field_edit',
		field: {
			fieldKey: 'demand.category',
			fieldLabel: 'Categoria',
			currentValue: 'Automação'
		},
		comment: 'Confirme a categoria da demanda.',
		status: 'validated',
		correctedValue: 'Automação',
		responseText: 'Categoria confirmada.',
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-07T09:00:00.000Z',
		respondedAt: '2026-09-08T10:00:00.000Z',
		validatedAt: '2026-09-08T11:00:00.000Z'
	},
	{
		id: 'pnd-103-f3',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-103',
		type: 'field_edit',
		field: {
			fieldKey: 'operational.processDescription',
			fieldLabel: 'Descrição do Processo',
			currentValue: 'Recebimento de comprovantes, conferência e pagamento de diárias.'
		},
		comment: 'Detalhe quem aprova cada etapa do processo.',
		status: 'validated',
		correctedValue: 'Recebimento, conferência dupla, aprovação da gestão e pagamento.',
		responseText: 'Etapas detalhadas com responsáveis.',
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-07T09:00:00.000Z',
		respondedAt: '2026-09-08T10:00:00.000Z',
		validatedAt: '2026-09-08T11:00:00.000Z'
	},
	{
		id: 'pnd-103-f4',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-103',
		type: 'field_edit',
		field: {
			fieldKey: 'operational.mainRisks',
			fieldLabel: 'Principais Riscos',
			currentValue: 'Pagamento indevido por erro de conferência.'
		},
		comment: 'Liste os riscos considerando o volume atual de comprovantes.',
		status: 'responded',
		correctedValue: 'Pagamento indevido e atraso no reembolso em picos de volume.',
		responseText: 'Riscos atualizados com o cenário de pico.',
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-07T09:00:00.000Z',
		respondedAt: '2026-09-09T13:20:00.000Z',
		validatedAt: null
	},
	{
		id: 'pnd-103-f5',
		protocol: 'MAAT-8K3P-9X2M',
		batchId: 'batch-2026-103',
		type: 'field_edit',
		field: {
			fieldKey: 'operational.clientImpact',
			fieldLabel: 'Impacto ao Cliente',
			currentValue: 'Colaboradores com reembolso em atraso.'
		},
		comment: 'Descreva o impacto atual nos colaboradores.',
		status: 'requested',
		correctedValue: null,
		responseText: null,
		responseAttachments: [],
		deadline: null,
		createdAt: '2026-09-07T09:00:00.000Z',
		respondedAt: null,
		validatedAt: null
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

export async function listPendingItemsMock(protocol: string): Promise<PendingItem[]> {
	const normalized = findByProtocol(protocol);

	const items = store
		.filter((item) => item.protocol.toLowerCase().trim() === normalized)
		.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));

	return delay(400).then(() => items.map((item) => structuredClone(item)));
}

// Criação em lote único (contrato v0.5 §6): aceita `observation` e/ou `items` +
// `requestAttachment` do lote. Resolve `fieldLabel`/`currentValue` a partir
// do catálogo (o mesmo papel que o backend terá), gera um `batchId` e muda
// o status. Cenários suportados: somente observação, somente campo(s),
// observação + campos, com `requestAttachment: true`.
export async function createPendingItemsMock(
	protocol: string,
	payload: CreatePendingItemsBody
): Promise<CreatePendingItemsResponse> {
	const solicitation = findSolicitation(protocol);
	const lookup = buildFieldLookup(solicitation);
	const observation = payload.observation?.trim() ?? '';
	const entries = payload.items ?? [];

	if (!observation && entries.length === 0) {
		throw new ApiError(400, 'Informe uma observação ou selecione ao menos um campo.');
	}
	if (entries.some((entry) => !entry.comment.trim())) {
		throw new ApiError(400, 'Informe o motivo da alteração para todos os campos marcados.');
	}

	const batchId = nextBatchId();
	const now = new Date().toISOString();
	const created: PendingItem[] = [];

	if (observation) {
		created.push({
			id: nextId(),
			protocol: solicitation.protocol,
			batchId,
			type: 'observation',
			field: null,
			comment: observation,
			status: 'requested',
			correctedValue: null,
			responseText: null,
			responseAttachments: [],
			deadline: null,
			createdAt: now,
			respondedAt: null,
			validatedAt: null
		});
	}

	for (const entry of entries) {
		const field = lookup.get(entry.fieldKey);
		if (!field) {
			throw new ApiError(400, 'Campo não marcável nesta solicitação.');
		}
		created.push({
			id: nextId(),
			protocol: solicitation.protocol,
			batchId,
			type: 'field_edit',
			field: { ...field },
			comment: entry.comment.trim(),
			status: 'requested',
			correctedValue: null,
			responseText: null,
			responseAttachments: [],
			deadline: null,
			createdAt: now,
			respondedAt: null,
			validatedAt: null
		});
	}

	store.unshift(...created);

	// Envio da pendência muda o status da solicitação (transação da criação).
	solicitation.status = PENDING_STATUS;
	solicitation.lastUpdate = now;

	return delay(500).then(() => ({
		batchId,
		requestAttachment: payload.requestAttachment === true,
		items: created.map((item) => structuredClone(item))
	}));
}

// Revisão parcial do lote (contrato v0.5 §9, regra D-P23): valida todas as
// decisões antes de aplicar (atômico); validação fecha o item; reabertura
//
// Revisão parcial (frontend §7/§8): o payload pode conter apenas um SUBCONJUNTO
// dos itens `responded` — os não decididos ("revisar depois") permanecem
// `responded` e a pendência continua aberta. O contrato anterior previa
// revisão atômica do lote inteiro; aceitar subconjunto no mock antecipa o comportamento
// necessário à revisão individual — a confirmar com o backend (sem inventar
// endpoint: a rota e o formato do payload são os mesmos).
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

	if (payload.items.length === 0) {
		throw new ApiError(400, 'Decida ao menos um item para concluir a revisão.');
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
			if (item.correctedValue !== null && item.field) {
				applyFieldValue(solicitation, item.field.fieldKey, item.correctedValue);
			}
			item.status = 'validated';
			item.validatedAt = now;
		} else {
			// Reabertura sobrescreve o item: volta a `requested` com novo comentário.
			// Anexos da resposta são preservados (contrato v0.5 §6).
			item.status = 'requested';
			item.comment = decision.comment.trim();
			item.responseText = null;
			item.correctedValue = null;
			item.respondedAt = null;
			item.validatedAt = null;
			item.createdAt = now;
		}
	}

	solicitation.lastUpdate = now;

	if (payload.items.some((decision) => decision.decision === 'reopen')) {
		solicitation.status = PENDING_STATUS;
	}

	// Resposta sem `solicitationStatus` (D-P18) e só com os itens decididos
	// nesta chamada (contrato v0.5 §7).
	const decidedIds = new Set(payload.items.map((decision) => decision.id));

	return delay(500).then(() => ({
		batchId: payload.batchId,
		items: store.filter((item) => decidedIds.has(item.id)).map((item) => structuredClone(item))
	}));
}

// Aplica o valor corrigido (diff aprovado) no campo da solicitação — no contrato
// real o backend faz isso dentro da transação da revisão (contrato v0.5 §9).
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
