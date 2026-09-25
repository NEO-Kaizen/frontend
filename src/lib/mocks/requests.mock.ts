import { ApiError } from '$lib/types/result';
import { computePrioritizationResult, getSavedPrioritizationNotes } from './prioritization.mock';
import { mockUsers } from './users.mock';
import { getMeMock } from './auth.mock';
import { getMockStatuses } from './portal-config.mock';
import { displayStatusName } from '$lib/utils/status';
import type { PortalStatus } from '$lib/types/portal-config';
import type {
	QueueAssignee,
	QueueMetricsResponse,
	QueueQuery,
	QueueResponse
} from '$lib/types/queue';
import type {
	CreateRequestPayload,
	CreateRequestResponse,
	InternalRequestDetail,
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestStatus,
	RequestSummary,
	UpdateInternalRequestPayload,
	UpdateStatusRequest,
	UpdateStatusResponse
} from '$lib/types/request';
import type { CreateTriagePayload, TriageAssessment } from '$lib/types/triage';

// Status considerados "em andamento" para a métrica da fila: trabalho já em fluxo,
// excluindo etapas de fila/priorização e estados terminais.
const IN_PROGRESS_STATUSES: RequestStatus[] = [
	'Em triagem',
	'Aguardando mapeamento',
	'Em análise de viabilidade',
	'Em desenvolvimento',
	'Em homologação'
];

export async function getQueueMetricsMock(): Promise<QueueMetricsResponse> {
	// Total, "sem responsável" e "em andamento" derivam dos fixtures. "Atrasados"
	// é valor ilustrativo: o contrato ainda não expõe data-limite/atraso.
	return {
		totalRequests: mockRequests.length,
		unassignedRequests: mockRequests.filter((request) => request.assigneeId === null).length,
		inProgressRequests: mockRequests.filter((request) =>
			IN_PROGRESS_STATUSES.includes(request.status)
		).length,
		overdueRequests: 2
	};
}

// Fixtures — dados fictícios do domínio de solicitações, consumidos apenas pelos mocks.
export type MockRequest = RequestSummary & {
	corporateEmail: string;
	assigneeId: string | null;
};

export const MOCK_ASSIGNEES = {
	fernandoAlves: '650e8400-e29b-41d4-a716-446655440001',
	anaSouza: '1',
	lucasGomes: '650e8400-e29b-41d4-a716-446655440003',
	gabrielSoares: '650e8400-e29b-41d4-a716-446655440004',
	carlosMendes: '650e8400-e29b-41d4-a716-446655440005'
} as const;

export const mockRequests: MockRequest[] = [
	{
		protocol: 'MAAT-8K3P-9X2M',
		corporateEmail: 'maria.oliveira@maat.com.br',
		createdAt: '2026-08-25T14:03:11.000Z',
		demandTitle: 'Automatizar conferência de diárias',
		processName: 'Pagamento de diárias',
		priority: null,
		status: 'Em triagem',
		assigneeId: null,
		assignee: null,
		requesterName: 'Maria Oliveira'
	},
	{
		protocol: 'MAAT-6N2W-8VBM',
		corporateEmail: 'maria.oliveira@maat.com.br',
		createdAt: '2026-08-10T09:41:20.000Z',
		demandTitle: 'Fechamento mensal de ponto',
		processName: 'Fechamento mensal de ponto',
		priority: 'Alta',
		status: 'Concluído',
		assigneeId: MOCK_ASSIGNEES.fernandoAlves,
		assignee: 'Fernando Alves',
		requesterName: 'Maria Oliveira'
	},
	{
		protocol: 'MAAT-4P7K-2LQX',
		corporateEmail: 'maria.oliveira@maat.com.br',
		createdAt: '2026-08-18T11:20:00.000Z',
		demandTitle: 'Controle de férias',
		processName: 'Controle de férias',
		priority: 'Média',
		status: 'Em desenvolvimento',
		assigneeId: MOCK_ASSIGNEES.anaSouza,
		assignee: 'Ana Souza',
		requesterName: 'Maria Oliveira'
	},
	{
		protocol: 'MAAT-9R3D-7KWF',
		corporateEmail: 'joao.santos@maat.com.br',
		createdAt: '2026-08-20T08:15:00.000Z',
		demandTitle: 'Automatização de relatórios',
		processName: 'Automatização de relatórios',
		priority: 'Alta',
		status: 'Aguardando mapeamento',
		assigneeId: MOCK_ASSIGNEES.lucasGomes,
		assignee: 'Lucas Gomes',
		requesterName: 'João Santos'
	},
	{
		protocol: 'MAAT-5X8M-3QTP',
		corporateEmail: 'joao.santos@maat.com.br',
		createdAt: '2026-08-22T15:40:00.000Z',
		demandTitle: 'Integração de sistemas',
		processName: 'Integração de sistemas',
		priority: 'Crítica',
		status: 'Em análise de viabilidade',
		assigneeId: MOCK_ASSIGNEES.gabrielSoares,
		assignee: 'Gabriel Soares',
		requesterName: 'João Santos'
	},
	{
		protocol: 'MAAT-2B6V-9HKS',
		corporateEmail: 'ana.souza@maat.com.br',
		createdAt: '2026-08-24T10:30:00.000Z',
		demandTitle: 'Acesso ao sistema interno',
		processName: 'Acesso ao sistema interno',
		priority: 'Baixa',
		status: 'Solicitação enviada',
		assigneeId: null,
		assignee: null,
		requesterName: 'Ana Souza'
	},
	{
		protocol: 'MAAT-7C4F-1NXR',
		corporateEmail: 'ana.souza@maat.com.br',
		createdAt: '2026-08-26T13:45:00.000Z',
		demandTitle: 'Atualização cadastral',
		processName: 'Atualização cadastral',
		priority: null,
		status: 'Pendente de informações',
		assigneeId: MOCK_ASSIGNEES.carlosMendes,
		assignee: 'Carlos Mendes',
		requesterName: 'Ana Souza'
	},
	{
		protocol: 'MAAT-5M2R-7TQA',
		corporateEmail: 'ana.souza@maat.com.br',
		createdAt: '2026-09-03T10:20:00.000Z',
		demandTitle: 'Revisão do fluxo de aprovações',
		processName: 'Revisão do fluxo de aprovações',
		priority: 'Alta',
		status: 'Em desenvolvimento',
		assigneeId: MOCK_ASSIGNEES.anaSouza,
		assignee: 'Ana Souza',
		requesterName: 'Ana Souza'
	},
	{
		protocol: 'MAAT-3V8K-6JPN',
		corporateEmail: 'pedro.rocha@maat.com.br',
		createdAt: '2026-09-04T13:10:00.000Z',
		demandTitle: 'Automação de conferência documental',
		processName: 'Automação de conferência documental',
		priority: 'Média',
		status: 'Priorizado',
		assigneeId: MOCK_ASSIGNEES.anaSouza,
		assignee: 'Ana Souza',
		requesterName: 'Pedro Rocha'
	},
	{
		protocol: 'MAAT-3J8L-6PQM',
		corporateEmail: 'carlos.mendes@maat.com.br',
		createdAt: '2026-08-27T09:10:00.000Z',
		demandTitle: 'Revisão de processo',
		processName: 'Revisão de processo',
		priority: 'Média',
		status: 'Priorizado',
		assigneeId: MOCK_ASSIGNEES.lucasGomes,
		assignee: 'Lucas Gomes',
		requesterName: 'Carlos Mendes'
	},
	{
		protocol: 'MAAT-8T2K-4WNB',
		corporateEmail: 'fernanda.lima@maat.com.br',
		createdAt: '2026-08-28T16:25:00.000Z',
		demandTitle: 'Novo fluxo de atendimento',
		processName: 'Novo fluxo de atendimento',
		priority: 'Alta',
		status: 'Em homologação',
		assigneeId: MOCK_ASSIGNEES.gabrielSoares,
		assignee: 'Gabriel Soares',
		requesterName: 'Fernanda Lima'
	},
	{
		protocol: 'MAAT-1Q9Z-5RKC',
		corporateEmail: 'rafael.costa@maat.com.br',
		createdAt: '2026-08-29T11:50:00.000Z',
		demandTitle: 'Dashboard de indicadores',
		processName: 'Dashboard de indicadores',
		priority: 'Média',
		status: 'Backlog',
		assigneeId: null,
		assignee: null,
		requesterName: 'Rafael Costa'
	},
	{
		protocol: 'MAAT-6H3P-8VXM',
		corporateEmail: 'juliana.alves@maat.com.br',
		createdAt: '2026-08-30T08:40:00.000Z',
		demandTitle: 'Melhoria no processo de atendimento',
		processName: 'Melhoria no processo de atendimento',
		priority: 'Alta',
		status: 'Elegível',
		assigneeId: MOCK_ASSIGNEES.anaSouza,
		assignee: 'Ana Souza',
		requesterName: 'Juliana Alves'
	},
	{
		protocol: 'MAAT-4K7N-2DQS',
		corporateEmail: 'bruno.martins@maat.com.br',
		createdAt: '2026-08-30T14:15:00.000Z',
		demandTitle: 'Solicitação de cancelamento',
		processName: 'Solicitação de cancelamento',
		priority: 'Baixa',
		status: 'Cancelado',
		assigneeId: MOCK_ASSIGNEES.lucasGomes,
		assignee: 'Lucas Gomes',
		requesterName: 'Bruno Martins'
	}
];

export const mockRequestDetails: RequestDetail[] = [
	{
		protocol: 'MAAT-8K3P-9X2M',
		demandTitle: 'Automatizar conferência de diárias',
		processName: 'Pagamento de diárias',
		status: 'Concluído',
		assigneeName: 'Fernando Alves',
		openedAt: '2026-08-25T14:03:11.000Z',
		estimatedCompletion: '2026-10-18',
		mappingDate: '2026-10-15',
		meeting: {
			scheduledFor: '2026-10-15T10:30:00.000Z',
			link: null
		},
		pendingIssues: [],
		nextStep: 'Aguarde o contato do analista',
		lastTechnicalMessage:
			'Boa notícia! A automação da conferência de diárias já está ativa e os comprovantes estão sendo validados automaticamente.',
		lastUpdate: '2026-08-26T10:12:40.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-6N2W-8VBM',
		demandTitle: 'Fechamento mensal de ponto',
		processName: 'Fechamento mensal de ponto',
		status: 'Concluído',
		assigneeName: 'Fernando Alves',
		openedAt: '2026-08-10T09:41:20.000Z',
		estimatedCompletion: '2026-08-28',
		mappingDate: null,
		meeting: null,
		pendingIssues: [],
		nextStep: 'Solicitação concluída.',
		lastTechnicalMessage: 'A solicitação foi analisada e concluída pela equipe responsável.',
		lastUpdate: '2026-08-28T16:20:00.000Z',
		conclusion: {
			result: 'Elegível para avaliação',
			justification: 'A solicitação foi avaliada e considerada adequada para implementação.'
		}
	},
	{
		protocol: 'MAAT-7C4F-1NXR',
		demandTitle: 'Atualização cadastral',
		processName: 'Atualização cadastral',
		status: 'Pendente de informações',
		assigneeName: 'Carlos Mendes',
		openedAt: '2026-08-26T13:45:00.000Z',
		estimatedCompletion: null,
		mappingDate: null,
		meeting: null,
		pendingIssues: ['Informe o volume médio de solicitações realizadas mensalmente.'],
		nextStep: 'Envie as informações pendentes para continuar a análise.',
		lastTechnicalMessage:
			'Precisamos de algumas informações adicionais para prosseguir com a análise.',
		lastUpdate: '2026-08-27T10:30:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-4P7K-2LQX',
		demandTitle: 'Controle de férias',
		processName: 'Controle de férias',
		status: 'Em desenvolvimento',
		assigneeName: 'Ana Souza',
		openedAt: '2026-08-18T11:20:00.000Z',
		estimatedCompletion: '2026-09-30',
		mappingDate: '2026-08-25',
		meeting: {
			scheduledFor: '2026-08-27T14:00:00.000Z',
			link: 'https://meet.maat.com.br/controle-ferias'
		},
		pendingIssues: [],
		nextStep: 'Acompanhe o andamento do desenvolvimento.',
		lastTechnicalMessage:
			'A solução está em desenvolvimento. Previsão de conclusão para o fim de setembro.',
		lastUpdate: '2026-08-30T09:00:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-9R3D-7KWF',
		demandTitle: 'Automatização de relatórios',
		processName: 'Automatização de relatórios',
		status: 'Aguardando mapeamento',
		assigneeName: 'Lucas Gomes',
		openedAt: '2026-08-20T08:15:00.000Z',
		estimatedCompletion: '2026-10-05',
		mappingDate: null,
		meeting: {
			scheduledFor: '2026-09-10T10:00:00.000Z',
			link: null
		},
		pendingIssues: [],
		nextStep: 'Aguarde a agenda do mapeamento técnico.',
		lastTechnicalMessage: 'O mapeamento técnico será agendado em breve.',
		lastUpdate: '2026-08-28T15:30:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-5X8M-3QTP',
		demandTitle: 'Integração de sistemas',
		processName: 'Integração de sistemas',
		status: 'Em análise de viabilidade',
		assigneeName: 'Gabriel Soares',
		openedAt: '2026-08-22T15:40:00.000Z',
		estimatedCompletion: '2026-11-20',
		mappingDate: null,
		meeting: {
			scheduledFor: '2026-09-02T14:30:00.000Z',
			link: 'https://meet.maat.com.br/integracao'
		},
		pendingIssues: [],
		nextStep: 'Aguarde o resultado da análise de viabilidade.',
		lastTechnicalMessage:
			'Estamos avaliando a viabilidade técnica da integração com os sistemas internos.',
		lastUpdate: '2026-08-29T11:00:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-2B6V-9HKS',
		demandTitle: 'Acesso ao sistema interno',
		processName: 'Acesso ao sistema interno',
		status: 'Solicitação enviada',
		assigneeName: null,
		openedAt: '2026-08-24T10:30:00.000Z',
		estimatedCompletion: null,
		mappingDate: null,
		meeting: null,
		pendingIssues: [],
		nextStep: 'Aguarde a triagem da solicitação.',
		lastTechnicalMessage: null,
		lastUpdate: '2026-08-24T10:30:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-3J8L-6PQM',
		demandTitle: 'Revisão de processo',
		processName: 'Revisão de processo',
		status: 'Priorizado',
		assigneeName: 'Lucas Gomes',
		openedAt: '2026-08-27T09:10:00.000Z',
		estimatedCompletion: '2026-09-15',
		mappingDate: '2026-08-30',
		meeting: {
			scheduledFor: '2026-09-01T09:30:00.000Z',
			link: 'https://meet.maat.com.br/revisao-processo'
		},
		pendingIssues: [],
		nextStep: 'Acompanhe as próximas etapas da revisão.',
		lastTechnicalMessage:
			'A solicitação foi priorizada e entrará no próximo ciclo de desenvolvimento.',
		lastUpdate: '2026-08-31T16:45:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-8T2K-4WNB',
		demandTitle: 'Novo fluxo de atendimento',
		processName: 'Novo fluxo de atendimento',
		status: 'Em homologação',
		assigneeName: 'Gabriel Soares',
		openedAt: '2026-08-28T16:25:00.000Z',
		estimatedCompletion: '2026-09-20',
		mappingDate: '2026-09-05',
		meeting: {
			scheduledFor: '2026-09-08T15:00:00.000Z',
			link: 'https://meet.maat.com.br/homologacao-fluxo'
		},
		pendingIssues: ['Confirmar o responsável pela homologação final.'],
		nextStep: 'Participe da etapa de homologação.',
		lastTechnicalMessage:
			'O novo fluxo está em homologação. Agendaremos sua participação na validação.',
		lastUpdate: '2026-09-01T10:15:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-1Q9Z-5RKC',
		demandTitle: 'Dashboard de indicadores',
		processName: 'Dashboard de indicadores',
		status: 'Backlog',
		assigneeName: null,
		openedAt: '2026-08-29T11:50:00.000Z',
		estimatedCompletion: null,
		mappingDate: null,
		meeting: null,
		pendingIssues: [],
		nextStep: 'A solicitação está no backlog aguardando priorização.',
		lastTechnicalMessage: null,
		lastUpdate: '2026-08-29T11:50:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-6H3P-8VXM',
		demandTitle: 'Melhoria no processo de atendimento',
		processName: 'Melhoria no processo de atendimento',
		status: 'Elegível',
		assigneeName: 'Ana Souza',
		openedAt: '2026-08-30T08:40:00.000Z',
		estimatedCompletion: '2026-10-10',
		mappingDate: '2026-09-08',
		meeting: {
			scheduledFor: '2026-09-10T09:00:00.000Z',
			link: 'https://meet.maat.com.br/melhoria-atendimento'
		},
		pendingIssues: [],
		nextStep: 'Aguarde o agendamento da reunião de alinhamento.',
		lastTechnicalMessage:
			'A proposta foi considerada elegível e será detalhada em reunião de alinhamento.',
		lastUpdate: '2026-09-02T14:20:00.000Z',
		conclusion: null
	},
	{
		protocol: 'MAAT-4K7N-2DQS',
		demandTitle: 'Solicitação de cancelamento',
		processName: 'Solicitação de cancelamento',
		status: 'Cancelado',
		assigneeName: 'Lucas Gomes',
		openedAt: '2026-08-30T14:15:00.000Z',
		estimatedCompletion: null,
		mappingDate: null,
		meeting: null,
		pendingIssues: [],
		nextStep: 'A solicitação foi cancelada.',
		lastTechnicalMessage: 'A solicitação foi cancelada a pedido do solicitante.',
		lastUpdate: '2026-09-01T09:00:00.000Z',
		conclusion: {
			result: 'Cancelada',
			justification: 'Solicitação cancelada pelo próprio solicitante antes da triagem.'
		}
	}
];

// Limites espelhados do contrato — o mock simula a validação do backend.
const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
	'image/png',
	'image/jpeg'
];

// Latência artificial para tornar o estado de carregamento perceptível na UI.
const MOCK_LATENCY_MS = 500;

export function createRequestMock(
	payload: CreateRequestPayload,
	files: Blob[] = []
): Promise<CreateRequestResponse> {
	const rejection = validateAttachments(files);
	if (rejection) {
		return Promise.reject(new ApiError(400, rejection));
	}

	const protocol = generateMockProtocol();
	registerCreatedRequest(protocol, payload);

	return delay(MOCK_LATENCY_MS).then(() => ({
		protocol,
		status: 'Solicitação enviada',
		createdAt: new Date().toISOString()
	}));
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Registra a solicitação criada nos fixtures em memória, fechando o loop de
// desenvolvimento: o novo protocolo fica rastreável em /acompanhar, na busca
// e na fila interna do administrador.
function registerCreatedRequest(protocol: string, payload: CreateRequestPayload): void {
	const requester = payload.requester;
	const now = new Date().toISOString();

	mockRequests.unshift({
		protocol,
		corporateEmail: requester.corporateEmail,
		createdAt: now,
		processName: payload.demand.processName,
		priority: null,
		status: 'Solicitação enviada',
		assigneeId: null,
		assignee: null,
		requesterName: requester.fullName
	});

	mockRequestDetails.unshift({
		protocol,
		demandTitle: payload.demand.title,
		processName: payload.demand.processName,
		status: 'Solicitação enviada',
		assigneeName: null,
		openedAt: now,
		estimatedCompletion: null,
		mappingDate: null,
		meeting: null,
		pendingIssues: [],
		nextStep: 'Aguarde o contato do analista',
		lastTechnicalMessage: 'Sua solicitação foi registrada e aguarda triagem.',
		lastUpdate: now,
		conclusion: null
	});

	mockInternalRequestDetails.unshift({
		protocol,
		status: 'Solicitação enviada',
		priority: null,
		prioritization: { score: null, maxScore: 50, label: null, notes: {} },
		assignee: null,
		mappingAssignee: null,
		assigneeDeadline: null,
		correctionAlert: null,
		requester: payload.requester,
		demand: payload.demand,
		operational: payload.operational,
		complementary: payload.complementary,
		schedulePreferences: payload.schedulePreferences ?? null,
		mappingDate: null,
		meeting: null,
		attachments: [],
		openedAt: now,
		lastUpdate: now,
		lastExternalUpdateAt: now,
		internalObservations: null,
		triage: null
	});
}

function validateAttachments(files: Blob[]): string | null {
	if (files.length > MAX_FILES) {
		return `Envie no máximo ${MAX_FILES} anexos.`;
	}

	for (const file of files) {
		const name = file instanceof File ? file.name : 'anexo';
		if (file.size > MAX_FILE_SIZE_BYTES) {
			return `O arquivo "${name}" excede 10MB.`;
		}
		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return `Formato não permitido: "${name}". Use PDF, DOCX, XLSX, PNG ou JPG.`;
		}
	}

	return null;
}

const PROTOCOL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Protocolo fictício no formato do contrato (geração FPE/Feistel é do backend).
function generateMockProtocol(): string {
	const pick = () =>
		Array.from(
			{ length: 4 },
			() => PROTOCOL_ALPHABET[Math.floor(Math.random() * PROTOCOL_ALPHABET.length)]
		).join('');
	return `MAAT-${pick()}-${pick()}`;
}

function toRequestSummary(request: MockRequest): RequestSummary {
	return {
		protocol: request.protocol,
		createdAt: request.createdAt,
		processName: request.processName,
		priority: request.priority,
		status: request.status,
		assignee: request.assignee,
		requesterName: request.requesterName
	};
}

export function listRequestsMock(
	query: ListRequestsQuery
): Promise<PaginatedResponse<RequestSummary>> {
	let requests = [...mockRequests];

	if (query.email) {
		const email = query.email.toLowerCase().trim();

		requests = requests.filter((r) => r.corporateEmail.toLowerCase().trim() === email);
	}

	if (query.search) {
		const search = query.search.toLowerCase().trim();

		requests = requests.filter(
			(r) =>
				r.processName.toLowerCase().includes(search) ||
				r.requesterName.toLowerCase().includes(search) ||
				r.corporateEmail.toLowerCase().includes(search)
		);
	}

	if (query.status) {
		requests = requests.filter((r) => r.status === query.status);
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 10;
	const total = requests.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;
	const data = requests.slice(start, start + pageSize).map(toRequestSummary);

	return Promise.resolve({
		data,
		page,
		pageSize,
		total,
		totalPages
	});
}

function hasAssignee(
	request: MockRequest
): request is MockRequest & { assigneeId: string; assignee: string } {
	return request.assigneeId !== null && request.assignee !== null;
}

// Roster global derivado dos fixtures: não segue filtros nem paginação.
function getQueueAssignees(): QueueAssignee[] {
	return Array.from(
		new Map(
			mockRequests
				.filter(hasAssignee)
				.map((request) => [request.assigneeId, { id: request.assigneeId, name: request.assignee }])
		).values()
	).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeSearch(text: string): string {
	return text
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.trim();
}

export function listQueueRequestsMock(query: QueueQuery): Promise<QueueResponse> {
	let requests = [...mockRequests];

	if (query.search) {
		const term = normalizeSearch(query.search);

		requests = requests.filter((request) => {
			const protocol = normalizeSearch(request.protocol);
			const demandTitle = normalizeSearch(request.demandTitle ?? request.processName);
			const requester = normalizeSearch(request.requesterName);
			const email = normalizeSearch(request.corporateEmail);

			return (
				protocol.includes(term) ||
				demandTitle.includes(term) ||
				requester.includes(term) ||
				email.includes(term)
			);
		});
	}

	if (query.status) {
		requests = requests.filter((request) => request.status === query.status);
	}

	if (query.priority === 'nenhum') {
		requests = requests.filter((request) => request.priority === null);
	} else if (query.priority) {
		requests = requests.filter((request) => request.priority === query.priority);
	}

	if (query.assigneeId !== undefined) {
		requests = requests.filter((request) => {
			if (query.assigneeId === 'unassigned') {
				return request.assigneeId === null;
			}

			return request.assigneeId === query.assigneeId;
		});
	}

	// Ordenação determinística: mais recentes primeiro, protocolo como desempate.
	requests.sort(
		(a, b) => b.createdAt.localeCompare(a.createdAt) || a.protocol.localeCompare(b.protocol)
	);

	const pageSize = query.pageSize ?? 10;
	const total = requests.length;
	const totalPages = Math.ceil(total / pageSize);

	// Clamp: página fora do intervalo retorna a última válida (contrato §5).
	const page = Math.min(Math.max(query.page ?? 1, 1), Math.max(totalPages, 1));

	const start = (page - 1) * pageSize;
	const end = start + pageSize;

	const data = requests.slice(start, end).map((request) => ({
		...toRequestSummary(request),
		requesterEmail: request.corporateEmail,
		assigneeId: request.assigneeId
	}));

	return Promise.resolve({
		data,
		page,
		pageSize,
		total,
		totalPages,
		assignees: getQueueAssignees()
	});
}

export function getRequestByProtocolMock(protocol: string): Promise<RequestDetail> {
	const normalized = protocol.toLowerCase().trim();
	const internal = hydrateRequestMock(protocol);

	if (!internal) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}

	const detail = mockRequestDetails.find((d) => d.protocol.toLowerCase().trim() === normalized);

	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}

	return Promise.resolve(structuredClone(detail));
}

const TRIAGE_SESSION_PREFIX = 'maat:triage:';
const STATUS_SESSION_PREFIX = 'maat:status:';
const MAX_PUBLIC_MESSAGE_LENGTH = 4000;

interface StatusOverlay {
	status: RequestStatus;
	lastTechnicalMessage?: string;
	lastUpdate: string;
}

function hasSessionStorage(): boolean {
	return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function triageSessionKey(protocol: string): string {
	return `${TRIAGE_SESSION_PREFIX}${protocol.trim().toLowerCase()}`;
}

function statusSessionKey(protocol: string): string {
	return `${STATUS_SESSION_PREFIX}${protocol.trim().toLowerCase()}`;
}

function isValidTriageAssignee(value: unknown): boolean {
	if (value === undefined || value === null) return true;
	if (typeof value !== 'object' || Array.isArray(value)) return false;
	const assignee = value as Record<string, unknown>;
	return (
		(assignee.id === null || typeof assignee.id === 'string') &&
		(assignee.name === null || typeof assignee.name === 'string') &&
		(assignee.email === undefined || assignee.email === null || typeof assignee.email === 'string')
	);
}

function isValidTriageRecord(value: unknown, requireId: boolean): value is TriageAssessment {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const record = value as Record<string, unknown>;
	const stringFields = [
		'adherentJustification',
		'newCategory',
		'preliminaryComplexity',
		'perceivedRisks',
		'suggestedResponsible',
		'suggestedResponsibleJustification',
		'result',
		'conclusionJustification'
	] as const;
	if (stringFields.some((field) => typeof record[field] !== 'string')) return false;
	if (
		record.adherentToScope !== '' &&
		record.adherentToScope !== 'Sim' &&
		record.adherentToScope !== 'Não'
	) {
		return false;
	}
	if (
		record.changeCategory !== '' &&
		record.changeCategory !== 'Sim' &&
		record.changeCategory !== 'Não'
	) {
		return false;
	}
	const exitStatus = record.exitStatus;
	if (
		exitStatus !== '' &&
		(typeof exitStatus !== 'number' || !Number.isInteger(exitStatus) || exitStatus <= 0)
	) {
		return false;
	}
	if (requireId) {
		if (typeof record.id !== 'string') return false;
	} else if (record.id !== undefined && typeof record.id !== 'string') {
		return false;
	}
	if (
		record.lastTechnicalMessage !== undefined &&
		typeof record.lastTechnicalMessage !== 'string'
	) {
		return false;
	}
	return isValidTriageAssignee(record.assignee);
}

function loadTriageFromSessionStorage(protocol: string): TriageAssessment | null {
	if (!hasSessionStorage()) return null;
	try {
		const raw = sessionStorage.getItem(triageSessionKey(protocol));
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return isValidTriageRecord(parsed, true) ? parsed : null;
	} catch {
		return null;
	}
}

function isValidStatusOverlay(value: unknown, statuses: PortalStatus[]): value is StatusOverlay {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const record = value as Record<string, unknown>;
	const status =
		typeof record.status === 'string'
			? statuses.find((candidate) => candidate.name === record.status)
			: undefined;
	if (!status) return false;
	if (typeof record.lastUpdate !== 'string' || Number.isNaN(Date.parse(record.lastUpdate))) {
		return false;
	}
	if (record.lastTechnicalMessage !== undefined) {
		if (typeof record.lastTechnicalMessage !== 'string') return false;
		const message = record.lastTechnicalMessage.trim();
		if (message.length < 1 || message.length > MAX_PUBLIC_MESSAGE_LENGTH) return false;
	}
	return true;
}

function loadStatusOverlay(protocol: string, statuses: PortalStatus[]): StatusOverlay | null {
	if (!hasSessionStorage()) return null;
	try {
		const raw = sessionStorage.getItem(statusSessionKey(protocol));
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (!isValidStatusOverlay(parsed, statuses)) return null;
		const overlay: StatusOverlay = {
			status: parsed.status,
			lastUpdate: parsed.lastUpdate
		};
		if (parsed.lastTechnicalMessage !== undefined) {
			overlay.lastTechnicalMessage = parsed.lastTechnicalMessage.trim();
		}
		return overlay;
	} catch {
		return null;
	}
}

function resolveStatusName(
	exitStatus: number | '',
	statuses: PortalStatus[]
): RequestStatus | null {
	if (exitStatus === '') return null;
	const found = statuses.find((status) => status.id === exitStatus);
	return (found?.name as RequestStatus | undefined) ?? null;
}

function resolvePublicStatusName(
	statusName: RequestStatus,
	statuses: PortalStatus[]
): RequestStatus {
	return displayStatusName(statusName, statuses) as RequestStatus;
}

function findInternalDetail(protocol: string): InternalRequestDetail | undefined {
	const normalized = protocol.trim().toLowerCase();
	return mockInternalRequestDetails.find(
		(detail) => detail.protocol.toLowerCase().trim() === normalized
	);
}

function findQueueItem(protocol: string): MockRequest | undefined {
	const normalized = protocol.trim().toLowerCase();
	return mockRequests.find((request) => request.protocol.toLowerCase().trim() === normalized);
}

function findPublicDetail(protocol: string): RequestDetail | undefined {
	const normalized = protocol.trim().toLowerCase();
	return mockRequestDetails.find((detail) => detail.protocol.toLowerCase().trim() === normalized);
}

function syncStatusProjections(
	protocol: string,
	statusName: RequestStatus,
	statuses: PortalStatus[],
	lastUpdate: string,
	isPublicTransition: boolean,
	lastTechnicalMessage?: string
): void {
	const internal = findInternalDetail(protocol);
	if (internal) {
		if (internal.lastExternalUpdateAt == null) {
			internal.lastExternalUpdateAt = internal.lastUpdate;
		}
		internal.status = statusName;
		internal.lastUpdate = lastUpdate;
		if (isPublicTransition) internal.lastExternalUpdateAt = lastUpdate;
		if (lastTechnicalMessage !== undefined) internal.lastTechnicalMessage = lastTechnicalMessage;
	}

	const publicDetail = findPublicDetail(protocol);
	if (publicDetail) {
		publicDetail.status = resolvePublicStatusName(statusName, statuses);
		if (isPublicTransition) publicDetail.lastUpdate = lastUpdate;
		if (lastTechnicalMessage !== undefined)
			publicDetail.lastTechnicalMessage = lastTechnicalMessage;
	}

	const queueItem = findQueueItem(protocol);
	if (queueItem) queueItem.status = statusName;
}

function applyTriageProjection(
	protocol: string,
	triage: TriageAssessment,
	statuses: PortalStatus[],
	lastUpdate?: string
): void {
	const internal = findInternalDetail(protocol);
	if (!internal) return;

	internal.triage = structuredClone(triage);
	if (triage.changeCategory === 'Sim' && triage.newCategory) {
		internal.demand.category = triage.newCategory;
	}

	const targetStatus = resolveStatusName(triage.exitStatus, statuses);
	const target = statuses.find((status) => status.id === triage.exitStatus);
	if (target && targetStatus) {
		const currentMessage =
			typeof internal.lastTechnicalMessage === 'string' ? internal.lastTechnicalMessage.trim() : '';
		const technicalMessage = target.isPublic
			? triage.lastTechnicalMessage
			: currentMessage.length > 0
				? currentMessage
				: undefined;
		syncStatusProjections(
			protocol,
			targetStatus,
			statuses,
			lastUpdate ?? internal.lastUpdate,
			target.isPublic,
			technicalMessage
		);
	} else if (lastUpdate) {
		internal.lastUpdate = lastUpdate;
	}
}

function saveTriageToSessionStorage(protocol: string, triage: TriageAssessment): void {
	if (!hasSessionStorage()) return;
	try {
		sessionStorage.setItem(triageSessionKey(protocol), JSON.stringify(triage));
	} catch {
		return;
	}
}

function saveStatusOverlay(protocol: string, overlay: StatusOverlay): void {
	if (!hasSessionStorage()) return;
	const value: StatusOverlay = {
		status: overlay.status,
		lastUpdate: overlay.lastUpdate
	};
	if (overlay.lastTechnicalMessage !== undefined) {
		value.lastTechnicalMessage = overlay.lastTechnicalMessage;
	}
	try {
		sessionStorage.setItem(statusSessionKey(protocol), JSON.stringify(value));
	} catch {
		return;
	}
}

function clearStatusOverlay(protocol: string): void {
	if (!hasSessionStorage()) return;
	try {
		sessionStorage.removeItem(statusSessionKey(protocol));
	} catch {
		return;
	}
}

export function hydrateRequestMock(
	protocol: string,
	statuses: PortalStatus[] = getMockStatuses()
): InternalRequestDetail | null {
	const internal = findInternalDetail(protocol);
	if (!internal) return null;

	const persistedTriage = loadTriageFromSessionStorage(protocol);
	const fixtureTriage =
		!persistedTriage &&
		internal.triage &&
		isValidTriageRecord(internal.triage, true) &&
		resolveStatusName(internal.triage.exitStatus, statuses) === internal.status
			? internal.triage
			: null;

	const triage = persistedTriage ?? fixtureTriage;
	if (triage) applyTriageProjection(protocol, triage, statuses);

	const overlay = loadStatusOverlay(protocol, statuses);
	if (overlay) {
		const isPublicTransition =
			statuses.find((status) => status.name === overlay.status)?.isPublic ?? false;
		syncStatusProjections(
			protocol,
			overlay.status,
			statuses,
			overlay.lastUpdate,
			isPublicTransition,
			overlay.lastTechnicalMessage
		);
	}

	return internal;
}

export const mockInternalRequestDetails: InternalRequestDetail[] = [
	{
		protocol: 'MAAT-6N2W-8VBM',
		status: 'Concluído',
		priority: 'Alta',
		prioritization: {
			score: 38,
			maxScore: 50,
			label: 'Alta',
			notes: {
				impacto_operacional: 5,
				risco_operacional: 4,
				urgencia: 5,
				volumetria: 3,
				esforco_manual: 2,
				impacto_cliente: 4,
				prazo_regulatorio: 3,
				areas_impactadas: 4,
				alinhamento_estrategico: 5,
				complexidade_estimada: 3
			}
		},
		assignee: {
			id: MOCK_ASSIGNEES.fernandoAlves,
			name: 'Fernando Alves',
			email: 'fernando.alves@maat.com.br'
		},
		mappingAssignee: null,
		assigneeDeadline: null,
		correctionAlert: null,
		requester: {
			fullName: 'Maria Oliveira',
			corporateEmail: 'maria.oliveira@maat.com.br',
			area: 'Operações',
			department: 'Departamento Pessoal',
			manager: 'Fernando Alves',
			additionalContact: undefined
		},
		demand: {
			title: 'Fechamento mensal de ponto',
			requestType: 'Automação',
			category: 'Automação',
			processName: 'Fechamento mensal de ponto',
			description: 'Automatizar a apuração do ponto para reduzir o tempo de fechamento mensal.',
			problem: 'O fechamento exige conferência manual de marcações e causa atrasos na folha.',
			expectedResult: 'Apuração automática com relatório de inconsistências.',
			justification:
				'O fechamento mensal consome dias de conferência manual e atrasa a folha de pagamento.'
		},
		operational: {
			processDescription:
				'Coleta de marcações, conferência de inconsistências e fechamento da folha.',
			processSteps:
				'1. Extração das marcações\n2. Conferência de faltas e atrasos\n3. Ajustes manuais\n4. Fechamento',
			systemsUsed: 'Relógio de ponto, planilhas Excel',
			executionFrequency: 'Mensal',
			volumetry: '300',
			peopleInvolved: 2,
			averageExecutionTime: '6 horas',
			monthlyEffortHours: 12,
			hasManualControls: 'Conferência manual das marcações antes do fechamento.',
			mainRisks: 'Erro de apuração e atraso na folha de pagamento.',
			clientImpact: 'Colaboradores com pagamento em atraso.',
			operationalImpact: 'Alto',
			desiredDeadline: '2026-11-28',
			perceivedCriticality: 'Alta'
		},
		complementary: {
			hasProcessDocumentation: 'Manual de fechamento disponível na intranet.',
			hasSimilarSolution: false,
			dependsOnOtherAreas: false,
			handlesRestrictedInfo: false,
			additionalNotes: undefined
		},
		schedulePreferences: ['2026-08-15T10:00', '2026-08-15T14:00'],
		mappingDate: null,
		meeting: null,
		attachments: [
			{
				fileName: 'exemplo-fechamento.xlsx',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				sizeBytes: 96000,
				downloadUrl: '/mocks/exemplo-fechamento.xlsx',
				canDownload: true
			},
			{
				fileName: 'regras-apuracao.pdf',
				mimeType: 'application/pdf',
				sizeBytes: 210000,
				downloadUrl: '/mocks/regras-apuracao.pdf',
				canDownload: true
			}
		],
		openedAt: '2026-08-10T09:41:20.000Z',
		lastUpdate: '2026-08-28T16:20:00.000Z',
		internalObservations: null,
		triage: {
			id: '660e8400-e29b-41d4-a716-446655440100',
			adherentToScope: 'Sim',
			adherentJustification: '',
			changeCategory: 'Não',
			newCategory: '',
			preliminaryComplexity:
				'Média — envolve integração com sistema de ponto e validação de regras.',
			perceivedRisks: 'Risco de divergência em marcações manuais e impacto na folha.',
			suggestedResponsible: 'Ana Souza',
			suggestedResponsibleJustification: 'Experiência prévia com automação de ponto.',
			exitStatus: 9,
			result: 'Encaminhado para mapeamento detalhado.',
			conclusionJustification:
				'Demanda aderente ao escopo de automação e com benefícios claros de eficiência.'
		}
	},
	{
		protocol: 'MAAT-8K3P-9X2M',
		status: 'Concluído',
		priority: null,
		prioritization: { score: null, maxScore: 50, label: null, notes: {} },
		assignee: {
			id: MOCK_ASSIGNEES.fernandoAlves,
			name: 'Fernando Alves',
			email: 'fernando.alves@maat.com.br'
		},
		mappingAssignee: null,
		assigneeDeadline: null,
		correctionAlert: { count: 1, batchId: 'batch-2026-102' },
		requester: {
			fullName: 'Maria Oliveira',
			corporateEmail: 'maria.oliveira@maat.com.br',
			area: 'Operações',
			department: 'Departamento Pessoal',
			manager: 'Fernando Alves',
			additionalContact: undefined
		},
		demand: {
			title: 'Automatizar conferência de diárias',
			requestType: 'Automação',
			category: 'Automação',
			processName: 'Pagamento de diárias',
			description: 'Automatizar a conferência de diárias para reduzir erros e tempo de validação.',
			problem: 'A conferência manual de comprovantes causa retrabalho e atrasos no pagamento.',
			expectedResult: 'Validação automática de comprovantes com trilha de auditoria.',
			justification: 'Reduzir o tempo de conferência e os erros de pagamento de diárias.'
		},
		operational: {
			processDescription: 'Recebimento de comprovantes, conferência e pagamento de diárias.',
			processSteps: '1. Envio de comprovantes\n2. Conferência manual\n3. Aprovação\n4. Pagamento',
			systemsUsed: 'E-mail corporativo, planilhas Excel',
			executionFrequency: 'Diária',
			volumetry: '120',
			peopleInvolved: 2,
			averageExecutionTime: '45 minutos',
			monthlyEffortHours: 30,
			hasManualControls: 'Conferência dupla dos comprovantes antes do pagamento.',
			mainRisks: 'Pagamento indevido por erro de conferência.',
			clientImpact: 'Colaboradores com reembolso em atraso.',
			operationalImpact: 'Médio',
			desiredDeadline: '2026-10-18',
			perceivedCriticality: 'Média'
		},
		complementary: undefined,
		schedulePreferences: null,
		mappingDate: '2026-10-15',
		meeting: {
			scheduledFor: '2026-10-15T10:30:00.000Z',
			link: null
		},
		attachments: [],
		openedAt: '2026-08-25T14:03:11.000Z',
		lastUpdate: '2026-08-26T10:12:40.000Z',
		lastTechnicalMessage:
			'Boa notícia! A automação da conferência de diárias já está ativa e os comprovantes estão sendo validados automaticamente.',
		internalObservations: null,
		triage: null
	},
	{
		protocol: 'MAAT-7C4F-1NXR',
		status: 'Pendente de informações',
		priority: null,
		prioritization: { score: null, maxScore: 50, label: null, notes: {} },
		assignee: {
			id: MOCK_ASSIGNEES.carlosMendes,
			name: 'Carlos Mendes',
			email: 'carlos.mendes@maat.com.br'
		},
		mappingAssignee: null,
		assigneeDeadline: null,
		correctionAlert: null,
		requester: {
			fullName: 'Ana Souza',
			corporateEmail: 'ana.souza@maat.com.br',
			area: 'Administrativo',
			department: 'Atendimento',
			manager: 'Carlos Mendes',
			additionalContact: undefined
		},
		demand: {
			title: 'Atualização cadastral',
			requestType: 'Melhoria',
			category: 'Padronização',
			processName: 'Atualização cadastral',
			description: 'Padronizar a atualização de cadastros para evitar dados divergentes.',
			problem: 'Cadastros desatualizados geram retrabalho no atendimento.',
			expectedResult: 'Rotina única de atualização com validação automática.',
			justification: 'Reduzir inconsistências cadastrais entre unidades.'
		},
		operational: {
			processDescription: 'Coleta de dados, validação e atualização dos cadastros.',
			processSteps:
				'1. Solicitação de atualização\n2. Validação de documentos\n3. Atualização no sistema',
			systemsUsed: 'Sistema interno, planilhas',
			executionFrequency: 'Semanal',
			volumetry: '80',
			peopleInvolved: 2,
			averageExecutionTime: '30 minutos',
			monthlyEffortHours: 20,
			hasManualControls: false,
			mainRisks: 'Dados divergentes entre unidades.',
			clientImpact: 'Atendimento com informações desatualizadas.',
			operationalImpact: 'Médio',
			desiredDeadline: '2026-09-30',
			perceivedCriticality: 'Média'
		},
		complementary: {
			hasProcessDocumentation: false,
			hasSimilarSolution: false,
			dependsOnOtherAreas: false,
			handlesRestrictedInfo: 'Acessos restritos à gerência.',
			additionalNotes: undefined
		},
		schedulePreferences: ['2026-09-15T10:00:00.000Z'],
		mappingDate: null,
		meeting: null,
		attachments: [
			{
				fileName: 'exemplo-indisponivel.xlsx',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				sizeBytes: 128000,
				downloadUrl: null,
				canDownload: false
			}
		],
		openedAt: '2026-08-26T13:45:00.000Z',
		lastUpdate: '2026-08-27T10:30:00.000Z',
		internalObservations: 'Aguardando volume médio mensal informado pelo solicitante.',
		triage: null
	},
	{
		protocol: 'MAAT-9R3D-7KWF',
		status: 'Aguardando mapeamento',
		priority: 'Alta',
		prioritization: { score: null, maxScore: 50, label: null, notes: {} },
		assignee: {
			id: MOCK_ASSIGNEES.lucasGomes,
			name: 'Lucas Gomes',
			email: 'lucas.gomes@maat.com.br'
		},
		mappingAssignee: null,
		assigneeDeadline: null,
		correctionAlert: null,
		requester: {
			fullName: 'João Santos',
			corporateEmail: 'joao.santos@maat.com.br',
			area: 'Tecnologia',
			department: 'Dados e Relatórios',
			manager: 'Lucas Gomes',
			additionalContact: 'Ramal 4210'
		},
		demand: {
			title: 'Automatização de relatórios',
			requestType: 'Automação',
			category: 'Dashboard ou relatório',
			processName: 'Automatização de relatórios',
			description:
				'Automatizar a geração dos relatórios gerenciais para eliminar a consolidação manual.',
			problem: 'A consolidação manual em planilhas gera divergências entre áreas.',
			expectedResult: 'Relatórios gerados automaticamente com números consistentes.',
			justification: 'Reduzir o tempo de fechamento gerencial e os erros de consolidação.'
		},
		operational: {
			processDescription: 'Extração de dados, consolidação em planilhas e envio por e-mail.',
			processSteps:
				'1. Extração dos sistemas\n2. Consolidação manual\n3. Validação com gestores\n4. Envio',
			systemsUsed: 'ERP interno, planilhas Excel',
			executionFrequency: 'Semanal',
			volumetry: '45',
			peopleInvolved: 3,
			averageExecutionTime: '4 horas',
			monthlyEffortHours: 16,
			hasManualControls: 'Validação manual com cada gerência antes do envio.',
			mainRisks: 'Decisões tomadas com números divergentes.',
			clientImpact: 'Gestores sem visão confiável dos indicadores.',
			operationalImpact: 'Alto',
			desiredDeadline: '2026-10-05',
			perceivedCriticality: 'Alta'
		},
		complementary: {
			hasProcessDocumentation: 'Passo a passo da consolidação na base de conhecimento.',
			hasSimilarSolution: false,
			dependsOnOtherAreas: 'Dados de Vendas e Financeiro.',
			handlesRestrictedInfo: 'Relatórios contêm dados salariais agregados (sigilo).',
			additionalNotes: 'Priorizar o relatório de fechamento mensal.'
		},
		schedulePreferences: ['2026-09-12T09:00', '2026-09-12T15:00'],
		mappingDate: null,
		meeting: {
			scheduledFor: '2026-09-10T10:00:00.000Z',
			link: null
		},
		attachments: [
			{
				fileName: 'modelo-relatorio.xlsx',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				sizeBytes: 64000,
				downloadUrl: null,
				canDownload: false
			}
		],
		openedAt: '2026-08-20T08:15:00.000Z',
		lastUpdate: '2026-08-28T15:30:00.000Z',
		internalObservations: null,
		triage: null
	},
	{
		protocol: 'MAAT-3V8K-6JPN',
		status: 'Priorizado',
		priority: 'Média',
		prioritization: { score: null, maxScore: 50, label: null, notes: {} },
		assignee: {
			id: MOCK_ASSIGNEES.anaSouza,
			name: 'Ana Souza',
			email: 'ana.souza@maat.com.br'
		},
		mappingAssignee: null,
		assigneeDeadline: null,
		correctionAlert: null,
		requester: {
			fullName: 'Pedro Rocha',
			corporateEmail: 'pedro.rocha@maat.com.br',
			area: 'Jurídico',
			department: 'Contratos',
			manager: 'Ana Souza',
			additionalContact: undefined
		},
		demand: {
			title: 'Automação de conferência documental',
			requestType: 'Automação',
			category: 'Automação',
			processName: 'Automação de conferência documental',
			description: 'Automatizar a conferência de documentos contratuais antes da assinatura.',
			problem: 'A conferência manual atrasa assinaturas e deixa passar cláusulas divergentes.',
			expectedResult: 'Checklist automático de conformidade documental.',
			justification: 'Dar vazão ao volume de contratos sem aumentar a equipe.'
		},
		operational: {
			processDescription: 'Recebimento de minutas, conferência de cláusulas e liberação.',
			processSteps: '1. Recebimento da minuta\n2. Conferência de cláusulas\n3. Liberação',
			systemsUsed: 'E-mail corporativo, editor de texto',
			executionFrequency: 'Diária',
			volumetry: '25',
			peopleInvolved: 2,
			averageExecutionTime: '1 hora',
			monthlyEffortHours: 40,
			hasManualControls: false,
			mainRisks: 'Assinatura de contrato com cláusula divergente.',
			clientImpact: 'Retrabalho jurídico e risco contratual.',
			operationalImpact: 'Médio',
			desiredDeadline: '2026-10-30',
			perceivedCriticality: 'Média'
		},
		complementary: {
			hasProcessDocumentation: false,
			hasSimilarSolution: false,
			dependsOnOtherAreas: false,
			handlesRestrictedInfo: false,
			additionalNotes: undefined
		},
		schedulePreferences: ['2026-09-20T11:00'],
		mappingDate: null,
		meeting: null,
		attachments: [
			{
				fileName: 'checklist-conferencia.xlsx',
				mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				sizeBytes: 48000,
				downloadUrl: '/mocks/checklist-conferencia.xlsx',
				canDownload: true
			}
		],
		openedAt: '2026-09-04T13:10:00.000Z',
		lastUpdate: '2026-09-04T13:10:00.000Z',
		lastExternalUpdateAt: '2026-08-31T16:45:00.000Z',
		internalObservations: null,
		triage: null
	}
];

export function getInternalRequestMock(protocol: string): Promise<InternalRequestDetail> {
	const normalized = protocol.toLowerCase().trim();
	const detail = hydrateRequestMock(protocol);
	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}

	const savedNotes = getSavedPrioritizationNotes(normalized);
	const hasEvaluation = Object.keys(savedNotes).length > 0;
	const computed = hasEvaluation ? computePrioritizationResult(savedNotes) : null;

	const prioritization = {
		score: computed ? computed.score : detail.prioritization.score,
		maxScore: 50 as const,
		label: computed ? computed.classification : detail.prioritization.label,
		notes: hasEvaluation ? savedNotes : detail.prioritization.notes
	};

	return delay(MOCK_LATENCY_MS).then(() => structuredClone({ ...detail, prioritization }));
}

export function updateInternalRequestMock(
	protocol: string,
	payload: UpdateInternalRequestPayload
): Promise<InternalRequestDetail> {
	const normalized = protocol.toLowerCase().trim();
	const detail = mockInternalRequestDetails.find(
		(d) => d.protocol.toLowerCase().trim() === normalized
	);
	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}
	detail.requester = structuredClone(payload.requester);
	detail.demand = structuredClone(payload.demand);
	detail.operational = structuredClone(payload.operational);
	detail.complementary = payload.complementary ? structuredClone(payload.complementary) : undefined;
	detail.lastUpdate = new Date().toISOString();
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(detail));
}

export async function createTriageMock(
	protocol: string,
	payload: CreateTriagePayload
): Promise<TriageAssessment> {
	const me = await getMeMock();
	const found = findInternalDetail(protocol);
	if (!found) {
		throw new ApiError(404, 'Solicitação não encontrada.');
	}

	const statuses = getMockStatuses();
	const detail = hydrateRequestMock(protocol, statuses) ?? found;
	const hasCustody = detail.assignee?.id != null && detail.assignee.id === me.id;
	if (me.role !== 'Administrador' && (me.role !== 'Analista' || !hasCustody)) {
		throw new ApiError(403, 'Ação restrita ao Administrador ou ao responsável pela demanda.');
	}

	const exitStatus = payload.exitStatus;
	if (typeof exitStatus !== 'number' || !Number.isInteger(exitStatus) || exitStatus <= 0) {
		throw new ApiError(422, 'Selecione o status de saída.');
	}

	const target = statuses.find((status) => status.id === exitStatus);
	if (
		!target ||
		!target.isActive ||
		target.isRestricted ||
		target.triageMode !== 'conclusion_only'
	) {
		throw new ApiError(
			422,
			'Status de saída deve ser um status ativo com triageMode conclusion_only e isRestricted=false.'
		);
	}

	const rawMessage = payload.lastTechnicalMessage;
	if (rawMessage !== undefined && typeof rawMessage !== 'string') {
		throw new ApiError(422, 'Retorno ao solicitante inválido.');
	}
	const lastTechnicalMessage = rawMessage?.trim() ?? '';
	if (target.isPublic) {
		if (
			lastTechnicalMessage.length < 1 ||
			lastTechnicalMessage.length > MAX_PUBLIC_MESSAGE_LENGTH
		) {
			throw new ApiError(422, 'Informe o retorno ao solicitante (1..4000 caracteres).');
		}
	} else if (lastTechnicalMessage.length > 0) {
		throw new ApiError(422, 'Status de saída interno não aceita retorno ao solicitante.');
	}

	const triage: TriageAssessment = {
		...structuredClone(payload),
		id: crypto.randomUUID(),
		assignee: detail.assignee ? structuredClone(detail.assignee) : null
	};
	if (target.isPublic) triage.lastTechnicalMessage = lastTechnicalMessage;
	else delete triage.lastTechnicalMessage;

	const now = new Date().toISOString();
	applyTriageProjection(protocol, triage, statuses, now);
	saveTriageToSessionStorage(protocol, triage);
	clearStatusOverlay(protocol);
	const previousMessage =
		typeof detail.lastTechnicalMessage === 'string' ? detail.lastTechnicalMessage.trim() : '';
	const overlayMessage = target.isPublic
		? lastTechnicalMessage
		: previousMessage.length > 0
			? previousMessage
			: undefined;
	saveStatusOverlay(protocol, {
		status: target.name as RequestStatus,
		...(overlayMessage === undefined ? {} : { lastTechnicalMessage: overlayMessage }),
		lastUpdate: now
	});

	return delay(MOCK_LATENCY_MS).then(() => structuredClone(triage));
}

export function getTriageMock(protocol: string): Promise<TriageAssessment | null> {
	const normalized = protocol.toLowerCase().trim();
	const detail = mockInternalRequestDetails.find(
		(d) => d.protocol.toLowerCase().trim() === normalized
	);
	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}
	const persisted = loadTriageFromSessionStorage(protocol);
	const current = persisted ?? detail.triage;
	return delay(MOCK_LATENCY_MS).then(() => (current ? structuredClone(current) : null));
}

export async function assignAnalystMock(
	protocol: string,
	analystId: string,
	responsibility: 'triagem' | 'mapeamento' = 'triagem',
	assigneeDeadline: string | null = null
): Promise<InternalRequestDetail> {
	const normalized = protocol.toLowerCase().trim();
	const detail = mockInternalRequestDetails.find(
		(d) => d.protocol.toLowerCase().trim() === normalized
	);

	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}

	if (!analystId || !analystId.trim()) {
		return Promise.reject(new ApiError(400, 'Analista não informado.'));
	}

	if (assigneeDeadline !== null && assigneeDeadline !== '') {
		const today = new Date();
		const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
		if (Number.isNaN(new Date(assigneeDeadline).getTime()) || assigneeDeadline < todayIso) {
			return Promise.reject(new ApiError(400, 'O prazo não pode ser anterior a hoje.'));
		}
	}

	const analyst = (
		mockUsers as unknown as Array<{
			id: string;
			fullName: string;
			email: string;
			profile: string;
			isActive: boolean;
		}>
	).find((u) => u.id === analystId && u.profile === 'Analista');

	if (!analyst) {
		return Promise.reject(new ApiError(404, 'Analista não encontrado.'));
	}

	if (!analyst.isActive) {
		return Promise.reject(new ApiError(403, 'Analista inativo.'));
	}

	const assigneeValue = {
		id: analyst.id,
		name: analyst.fullName,
		email: analyst.email
	};

	if (responsibility === 'mapeamento') {
		// Exclusividade: responsável pelo Mapeamento anula o da Triagem.
		detail.mappingAssignee = assigneeValue;
		detail.assignee = null;
		detail.assigneeDeadline = assigneeDeadline && assigneeDeadline !== '' ? assigneeDeadline : null;

		// A fila representa o responsável pela Triagem — sem triagem, fica sem responsável.
		const queueItem = mockRequests.find((r) => r.protocol.toLowerCase().trim() === normalized);

		if (queueItem) {
			queueItem.assigneeId = null;
			queueItem.assignee = null;
		}
	} else {
		// Exclusividade: responsável pela Triagem anula o do Mapeamento.
		detail.assignee = assigneeValue;
		detail.mappingAssignee = null;
		detail.assigneeDeadline = assigneeDeadline && assigneeDeadline !== '' ? assigneeDeadline : null;

		// A fila representa o responsável pela Triagem.
		const queueItem = mockRequests.find((r) => r.protocol.toLowerCase().trim() === normalized);

		if (queueItem) {
			queueItem.assigneeId = analyst.id;
			queueItem.assignee = analyst.fullName;
		}
	}

	detail.lastUpdate = new Date().toISOString();

	return delay(MOCK_LATENCY_MS).then(() => structuredClone(detail));
}

export async function updateRequestStatusMock(
	protocol: string,
	payload: UpdateStatusRequest,
	_fetchImpl?: unknown
): Promise<UpdateStatusResponse> {
	void _fetchImpl;
	const me = await getMeMock();
	const found = findInternalDetail(protocol);
	if (!found) throw new ApiError(404, 'Solicitação não encontrada.');

	const statuses = getMockStatuses();
	const detail = hydrateRequestMock(protocol, statuses) ?? found;
	if (!Number.isInteger(payload.targetStatus) || payload.targetStatus <= 0) {
		throw new ApiError(400, 'Campo targetStatus deve ser um inteiro positivo.');
	}

	const target = statuses.find((status) => status.id === payload.targetStatus);
	if (!target) throw new ApiError(404, 'Status alvo não encontrado.');
	if (!target.isActive) throw new ApiError(409, 'Status inativo não pode ser alvo.');

	const current = statuses.find((status) => status.name === detail.status);
	if (current?.id === target.id || detail.status === target.name) {
		throw new ApiError(422, 'Status já é o atual.');
	}

	const hasCustody =
		(detail.assignee?.id != null && detail.assignee.id === me.id) ||
		(detail.mappingAssignee?.id != null && detail.mappingAssignee.id === me.id) ||
		(detail.mappingAssigneeId != null && detail.mappingAssigneeId === me.id);
	if (me.role !== 'Administrador') {
		if (me.role !== 'Analista' || !hasCustody) {
			throw new ApiError(403, 'Ação restrita ao Administrador ou ao responsável pela demanda.');
		}
		if (current?.isTerminal) {
			throw new ApiError(
				403,
				'Solicitação terminal — alteração de status restrita ao Administrador.'
			);
		}
		const isFree =
			!target.isRestricted && (target.triageMode === 'free' || target.mappingMode === 'free');
		if (!isFree) {
			throw new ApiError(403, 'Status alvo não permitido para o seu perfil.');
		}
	}

	const justification =
		typeof payload.justification === 'string' ? payload.justification.trim() : '';
	if (justification.length < 1 || justification.length > MAX_PUBLIC_MESSAGE_LENGTH) {
		throw new ApiError(400, 'Campo justification obrigatório 1..4000.');
	}

	if (
		payload.lastTechnicalMessage !== undefined &&
		typeof payload.lastTechnicalMessage !== 'string'
	) {
		throw new ApiError(400, 'Campo lastTechnicalMessage inválido.');
	}

	let lastTechnicalMessage: string | undefined;
	if (target.isPublic) {
		if (typeof payload.lastTechnicalMessage !== 'string') {
			throw new ApiError(400, 'Campo lastTechnicalMessage obrigatório 1..4000.');
		}
		lastTechnicalMessage = payload.lastTechnicalMessage.trim();
		if (
			lastTechnicalMessage.length < 1 ||
			lastTechnicalMessage.length > MAX_PUBLIC_MESSAGE_LENGTH
		) {
			throw new ApiError(400, 'Campo lastTechnicalMessage obrigatório 1..4000.');
		}
	}

	const previous = detail.status;
	const now = new Date().toISOString();
	const currentMessage =
		typeof detail.lastTechnicalMessage === 'string' ? detail.lastTechnicalMessage.trim() : '';
	const projectionMessage =
		lastTechnicalMessage ?? (currentMessage.length > 0 ? currentMessage : undefined);
	syncStatusProjections(
		protocol,
		target.name as RequestStatus,
		statuses,
		now,
		target.isPublic,
		projectionMessage
	);
	const overlayMessage = projectionMessage;
	saveStatusOverlay(protocol, {
		status: target.name as RequestStatus,
		...(overlayMessage === undefined ? {} : { lastTechnicalMessage: overlayMessage }),
		lastUpdate: now
	});

	return delay(MOCK_LATENCY_MS).then(() => ({
		protocol,
		status: target.name,
		previous,
		next: target.name,
		lastUpdate: now
	}));
}
