import { ApiError } from '$lib/types/result';
import type {
	QueueAssignee,
	QueueMetricsResponse,
	QueueQuery,
	QueueResponse
} from '$lib/types/queue';
import type {
	InternalRequestDetail,
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestSummary,
	RequestStatus
} from '$lib/types/request';

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
	anaSouza: '650e8400-e29b-41d4-a716-446655440002',
	lucasGomes: '650e8400-e29b-41d4-a716-446655440003',
	gabrielSoares: '650e8400-e29b-41d4-a716-446655440004',
	carlosMendes: '650e8400-e29b-41d4-a716-446655440005'
} as const;

export const mockRequests: MockRequest[] = [
	{
		protocol: 'MAAT-8K3P-9X2M',
		corporateEmail: 'maria.oliveira@maat.com.br',
		createdAt: '2026-08-25T14:03:11.000Z',
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
		status: 'Em triagem',
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
			'Sua solicitação está em análise. Assim que houver uma atualização, entraremos em contato.',
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
		prioritization: { score: null, maxScore: 50, label: null },
		assignee: null,
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
		internalObservations: null
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

export function listQueueRequestsMock(query: QueueQuery): Promise<QueueResponse> {
	let requests = [...mockRequests];

	if (query.search) {
		const normalizedSearch = query.search.trim().toLowerCase();

		requests = requests.filter((request) => {
			return (
				request.protocol.toLowerCase().includes(normalizedSearch) ||
				request.processName.toLowerCase().includes(normalizedSearch) ||
				request.requesterName.toLowerCase().includes(normalizedSearch) ||
				request.corporateEmail.toLowerCase().includes(normalizedSearch)
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

	const detail = mockRequestDetails.find((d) => d.protocol.toLowerCase().trim() === normalized);

	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}

	return Promise.resolve(detail);
}

export const mockInternalRequestDetails: InternalRequestDetail[] = [
	{
		protocol: 'MAAT-6N2W-8VBM',
		status: 'Concluído',
		priority: 'Alta',
		prioritization: { score: 18, maxScore: 50, label: 'Alta' },
		assignee: { name: 'Fernando Alves', email: 'fernando.alves@maat.com.br' },
		correctionAlert: { count: 2, message: 'Alteração respondida pelo solicitante (2 campos)' },
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
			desiredDeadline: '2026-08-28',
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
		internalObservations: null
	},
	{
		protocol: 'MAAT-8K3P-9X2M',
		status: 'Em triagem',
		priority: null,
		prioritization: { score: null, maxScore: 50, label: null },
		assignee: { name: 'Fernando Alves', email: 'fernando.alves@maat.com.br' },
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
		internalObservations: null
	},
	{
		protocol: 'MAAT-7C4F-1NXR',
		status: 'Pendente de informações',
		priority: null,
		prioritization: { score: null, maxScore: 50, label: null },
		assignee: { name: 'Carlos Mendes', email: 'carlos.mendes@maat.com.br' },
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
		internalObservations: 'Aguardando volume médio mensal informado pelo solicitante.'
	}
];

export function getInternalRequestMock(protocol: string): Promise<InternalRequestDetail> {
	const normalized = protocol.toLowerCase().trim();
	const detail = mockInternalRequestDetails.find(
		(d) => d.protocol.toLowerCase().trim() === normalized
	);
	if (!detail) {
		return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
	}
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(detail));
}
