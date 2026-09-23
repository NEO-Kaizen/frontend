import { getMeMock } from './auth.mock';
import { ApiError } from '$lib/types/result';
import {
	INTERNAL_NOTE_PAGE_DEFAULT,
	INTERNAL_NOTE_PAGE_MAX,
	INTERNAL_NOTE_PAGE_MIN,
	type CreateInternalNotePayload,
	type InternalNotesResponse,
	type MappingHistoryEntry,
	type MarkInternalNotesReadPayload,
	type TimelineItem,
	type TimelineNote,
	type TriageHistoryEntry
} from '$lib/types/internal-note';

// Mock da timeline unificada (contrato internal-observations.md v2.0): espelha
// o algoritmo do backend — merge de notas + eventos, keyset cursor opaco
// (base64url de { t, type, id }) e página mais-recente-primeiro; históricos
// `triages`/`mappings` completos e não paginados (D-N14). Dados 100% fictícios.
const MOCK_LATENCY_MS = 350;
const NOTE_RANK = 0;
const EVENT_RANK = 1;
let nextInternalNoteId = 3;

// Ordem canônica ascendente (timestamp, depois nota antes de evento, depois id).
const timelineStore = new Map<string, TimelineItem[]>([
	[
		'MAAT-8K3P-9X2M',
		[
			{
				type: 'note',
				id: '1',
				content:
					'Os critérios iniciais foram revisados. Precisamos confirmar a alçada de aprovação antes do mapeamento.',
				createdAt: '2026-09-18T13:45:00.000Z',
				author: { id: '1', name: 'Ana Souza', role: 'Analista' }
			},
			{
				type: 'event',
				id: 'audit:44',
				action: 'request.status_change',
				text: 'Status alterado: Em triagem',
				occurredAt: '2026-09-18T15:02:10.000Z',
				actor: { id: '1', name: 'Ana Souza', role: 'Analista' },
				changeOrigin: 'admin'
			},
			{
				type: 'event',
				id: 'audit:46',
				action: 'request.reassign',
				text: 'Responsável substituído: Marcos Lima',
				occurredAt: '2026-09-18T15:04:00.000Z',
				actor: { id: '3', name: 'Adriana Castro', role: 'Administrador' },
				changeOrigin: 'admin'
			},
			{
				type: 'event',
				id: 'audit:52',
				action: 'request.assign',
				text: 'Responsável atribuído: Marcos Lima',
				occurredAt: '2026-09-18T15:05:44.000Z',
				actor: { id: '3', name: 'Adriana Castro', role: 'Administrador' },
				changeOrigin: 'admin'
			},
			{
				type: 'event',
				id: 'audit:54',
				action: 'request.unassign',
				text: 'Responsável removido',
				occurredAt: '2026-09-18T15:06:30.000Z',
				actor: { id: '3', name: 'Adriana Castro', role: 'Administrador' },
				changeOrigin: 'admin'
			},
			{
				type: 'note',
				id: '2',
				content: 'A área responsável foi acionada e deve retornar até o fim do dia.',
				createdAt: '2026-09-18T16:20:00.000Z',
				author: { id: '2', name: 'Marcos Lima', role: 'Gestor' }
			},
			{
				type: 'event',
				id: 'audit:58',
				action: 'mapping.assign',
				text: 'Responsável pelo mapeamento alterado: Júlia Reis',
				occurredAt: '2026-09-19T14:11:02.000Z',
				actor: { id: '9', name: 'Júlia Reis', role: 'Analista' },
				changeOrigin: 'internal'
			},
			{
				type: 'event',
				id: 'audit:63',
				action: 'request.status_change',
				text: 'Status alterado: Mapeamento agendado',
				occurredAt: '2026-09-19T14:11:03.000Z',
				actor: null,
				changeOrigin: 'system'
			}
		]
	]
]);

// Históricos completos (D-N14) — `oldest → newest`, idênticos em toda página.
interface HistoryStore {
	triages: TriageHistoryEntry[];
	mappings: MappingHistoryEntry[];
}

const historyStore = new Map<string, HistoryStore>([
	[
		'MAAT-8K3P-9X2M',
		{
			triages: [
				{
					triage: {
						id: '1a0b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
						adherentToScope: 'Não',
						adherentJustification: 'Faltam detalhes da integração com o ERP para avaliar o escopo.',
						changeCategory: 'Não',
						newCategory: '',
						preliminaryComplexity: '',
						perceivedRisks: '',
						suggestedResponsible: '',
						suggestedResponsibleJustification: '',
						exitStatus: 4,
						result: 'Pendente de informações',
						conclusionJustification: 'Aguardando retorno do solicitante sobre as credenciais.'
					},
					occurredAt: '2026-09-17T10:00:00.000Z'
				},
				{
					triage: {
						id: '6f1c2a8e-3d4b-4c5a-9e7f-1a2b3c4d5e6f',
						adherentToScope: 'Sim',
						adherentJustification: '',
						changeCategory: 'Não',
						newCategory: '',
						preliminaryComplexity:
							'Média — integração com ERP do fornecedor exige mapeamento prévio.',
						perceivedRisks: 'Atraso na resposta do fornecedor sobre credenciais de API.',
						suggestedResponsible: 'Júlia Reis',
						suggestedResponsibleJustification:
							'Conhece a integração ERP anterior do mesmo fornecedor.',
						exitStatus: 9,
						result: 'Elegível para avaliação',
						conclusionJustification: 'Dentro do escopo do NEO; seguir para priorização.'
					},
					// Mesmo instante do evento audit:44 — exercita o desempate
					// evento (rank 1) antes de ref (rank 2) na ordem canônica.
					occurredAt: '2026-09-18T15:02:10.000Z'
				}
			],
			mappings: [
				{
					mapping: {
						protocol: 'MAAT-8K3P-9X2M',
						id: 'b7e4d9c1-2a3f-4e8b-9c6d-5f1a2b3c4d5e',
						scheduledFor: '2026-09-22T18:00:00.000Z',
						durationMinutes: 60,
						modality: 'REMOTE',
						meetingLink: 'https://meet.exemplo.br/mapeamento-8k3p-9x2m',
						location: null,
						participants: [
							{ id: 'mapping-seed-1', name: 'Maria Oliveira', email: 'maria.oliveira@maat.com.br' },
							{ id: null, name: 'Fornecedor Acme', email: 'contato@acme.exemplo.br' }
						],
						notes: 'Levar checklist da última integração.',
						mappingAssignee: {
							id: 'd3e2f1a0-b9c8-4d7e-8f6a-1b2c3d4e5f60',
							userId: '9',
							name: 'Júlia Reis',
							email: 'julia.reis@exemplo.br',
							jobTitle: 'Analista de Processos'
						}
					},
					// Mesmo instante do evento audit:58 — mesmo desempate acima.
					occurredAt: '2026-09-19T14:11:02.000Z'
				}
			]
		}
	]
]);

function getHistory(protocol: string): HistoryStore {
	return historyStore.get(protocol) ?? { triages: [], mappings: [] };
}

// Checkpoint de leitura por solicitação (GREATEST — nunca regredir).
const readCheckpoints = new Map<string, bigint>();

interface TimelineCursorPayload {
	t: string;
	type: 'note' | 'event';
	id: string;
}

function normalizeProtocol(protocol: string): string {
	return protocol.trim().toUpperCase();
}

function delay<T>(value: T): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function getTimeline(protocol: string): TimelineItem[] {
	return timelineStore.get(protocol) ?? [];
}

function itemTimeMs(item: TimelineItem): number {
	return Date.parse(item.type === 'note' ? item.createdAt : item.occurredAt);
}

function itemRank(item: TimelineItem): number {
	return item.type === 'note' ? NOTE_RANK : EVENT_RANK;
}

function itemId(item: TimelineItem): bigint {
	const raw = item.type === 'event' ? item.id.slice('audit:'.length) : item.id;
	try {
		return BigInt(raw);
	} catch {
		return 0n;
	}
}

function compareAsc(a: TimelineItem, b: TimelineItem): number {
	const timeDiff = itemTimeMs(a) - itemTimeMs(b);
	if (timeDiff !== 0) return timeDiff;
	const rankDiff = itemRank(a) - itemRank(b);
	if (rankDiff !== 0) return rankDiff;
	const idA = itemId(a);
	const idB = itemId(b);
	return idA === idB ? 0 : idA < idB ? -1 : 1;
}

function toBase64Url(text: string): string {
	return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
	return atob(text.replace(/-/g, '+').replace(/_/g, '/'));
}

function encodeCursor(item: TimelineItem): string {
	const payload: TimelineCursorPayload =
		item.type === 'note'
			? { t: item.createdAt, type: item.type, id: item.id }
			: { t: item.occurredAt, type: item.type, id: item.id };
	return toBase64Url(JSON.stringify(payload));
}

// Cursor inválido (não decodifica para { t, type, id }) → 400 (§9).
function decodeCursor(raw: string): TimelineCursorPayload {
	let payload: Partial<TimelineCursorPayload>;
	try {
		payload = JSON.parse(fromBase64Url(raw)) as Partial<TimelineCursorPayload>;
	} catch {
		throw new ApiError(400, 'Cursor da timeline inválido.');
	}
	const { t, type, id } = payload;
	if (typeof t !== 'string' || Number.isNaN(Date.parse(t))) {
		throw new ApiError(400, 'Cursor da timeline inválido.');
	}
	if (type !== 'note' && type !== 'event') {
		throw new ApiError(400, 'Cursor da timeline inválido.');
	}
	if (typeof id !== 'string') {
		throw new ApiError(400, 'Cursor da timeline inválido.');
	}
	if (type === 'note' && !/^[1-9]\d*$/.test(id)) {
		throw new ApiError(400, 'Cursor da timeline inválido.');
	}
	if (type === 'event' && !/^audit:[1-9]\d*$/.test(id)) {
		throw new ApiError(400, 'Cursor da timeline inválido.');
	}
	return { t, type, id };
}

// Estritamente mais antigo que o cursor (mesmo desempate da ordem canônica).
function isOlderThanCursor(item: TimelineItem, cursor: TimelineCursorPayload): boolean {
	const timeMs = itemTimeMs(item);
	const cursorMs = Date.parse(cursor.t);
	if (timeMs !== cursorMs) return timeMs < cursorMs;
	const rankDiff = itemRank(item) - (cursor.type === 'note' ? NOTE_RANK : EVENT_RANK);
	if (rankDiff !== 0) return rankDiff < 0;
	return (
		itemId(item) <
		(() => {
			const raw = cursor.type === 'event' ? cursor.id.slice('audit:'.length) : cursor.id;
			try {
				return BigInt(raw);
			} catch {
				return 0n;
			}
		})()
	);
}

function buildPage(
	protocol: string,
	limit: number,
	cursor: TimelineCursorPayload | undefined
): { items: TimelineItem[]; nextCursor: string | null } {
	const sorted = [...getTimeline(protocol)].sort(compareAsc);
	const older = cursor ? sorted.filter((item) => isOlderThanCursor(item, cursor)) : sorted;
	const pageAsc = older.slice(-limit);
	const items = [...pageAsc].reverse();
	const nextCursor = older.length > limit && pageAsc.length > 0 ? encodeCursor(pageAsc[0]) : null;
	return { items, nextCursor };
}

// unseenCount global (D-N2): notas de outros autores com id acima do
// checkpoint. Sem sessão resolvível (SSR), conta todas acima do checkpoint.
async function computeUnseenCount(protocol: string): Promise<number> {
	const checkpoint = readCheckpoints.get(protocol) ?? 0n;
	let currentUserId: string | null = null;
	try {
		currentUserId = (await getMeMock()).id;
	} catch {
		currentUserId = null;
	}
	return getTimeline(protocol)
		.filter((item): item is TimelineNote => item.type === 'note')
		.filter(
			(note) =>
				itemId(note) > checkpoint && (currentUserId === null || note.author.id !== currentUserId)
		).length;
}

export async function getInternalNotesMock(
	protocol: string,
	params: { limit?: number; cursor?: string } = {}
): Promise<InternalNotesResponse> {
	const normalized = normalizeProtocol(protocol);
	const limit = params.limit ?? INTERNAL_NOTE_PAGE_DEFAULT;
	if (
		!Number.isInteger(limit) ||
		limit < INTERNAL_NOTE_PAGE_MIN ||
		limit > INTERNAL_NOTE_PAGE_MAX
	) {
		throw new ApiError(400, 'Limite de itens por página deve estar entre 1 e 50.');
	}
	const cursor = params.cursor !== undefined ? decodeCursor(params.cursor) : undefined;

	const [history, unseenCount] = await Promise.all([
		Promise.resolve(getHistory(normalized)),
		computeUnseenCount(normalized)
	]);
	const { items, nextCursor } = buildPage(normalized, limit, cursor);

	return delay({
		items,
		nextCursor,
		unseenCount,
		triages: history.triages,
		mappings: history.mappings
	});
}

export async function createInternalNoteMock(
	protocol: string,
	payload: CreateInternalNotePayload
): Promise<TimelineNote> {
	const normalized = normalizeProtocol(protocol);
	const currentUser = await getMeMock();
	if (currentUser.role === 'Solicitante') {
		throw new ApiError(403, 'Acesso restrito aos perfis internos.');
	}

	const note: TimelineNote = {
		type: 'note',
		id: String(nextInternalNoteId++),
		content: payload.content.trim(),
		createdAt: new Date().toISOString(),
		author: {
			id: currentUser.id,
			name: currentUser.name,
			role: currentUser.role
		}
	};
	const timeline = [...getTimeline(normalized), note].sort(compareAsc);
	timelineStore.set(normalized, timeline);

	return delay(structuredClone(note));
}

export function markInternalNotesReadMock(
	protocol: string,
	payload: MarkInternalNotesReadPayload
): Promise<void> {
	const normalized = normalizeProtocol(protocol);
	if (!/^[1-9]\d*$/.test(payload.lastReadNoteId)) {
		return Promise.reject(new ApiError(400, 'Identificador da observação inválido.'));
	}
	const belongs = getTimeline(normalized).some(
		(item) => item.type === 'note' && item.id === payload.lastReadNoteId
	);
	if (!belongs) {
		return Promise.reject(new ApiError(400, 'Observação interna não pertence à solicitação.'));
	}
	const incoming = BigInt(payload.lastReadNoteId);
	const current = readCheckpoints.get(normalized) ?? 0n;
	if (incoming > current) {
		readCheckpoints.set(normalized, incoming);
	}
	return delay(undefined);
}
