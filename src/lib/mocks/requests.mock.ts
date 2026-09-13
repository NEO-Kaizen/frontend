import { ApiError } from '$lib/types/result';
import type {
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestSummary
} from '$lib/types/request';

export type MockRequest = RequestSummary & {
	corporateEmail: string;
};

export const mockRequests: MockRequest[] = [
	{
		protocol: 'MAAT-8K3P-9X2M',
		corporateEmail: 'maria.oliveira@maat.com.br',
		createdAt: '2026-08-25T14:03:11.000Z',
		processName: 'Pagamento de diárias',
		priority: null,
		status: 'Em triagem',
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
		assignee: 'Carlos Mendes',
		requesterName: 'Ana Souza'
	},
	{
		protocol: 'MAAT-3J8L-6PQM',
		corporateEmail: 'carlos.mendes@maat.com.br',
		createdAt: '2026-08-27T09:10:00.000Z',
		processName: 'Revisão de processo',
		priority: 'Média',
		status: 'Priorizado',
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

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
	'image/png',
	'image/jpeg'
];

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

function generateMockProtocol(): string {
	const pick = () =>
		Array.from(
			{ length: 4 },
			() => PROTOCOL_ALPHABET[Math.floor(Math.random() * PROTOCOL_ALPHABET.length)]
		).join('');
	return `MAAT-${pick()}-${pick()}`;
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
	const data = requests.slice(start, start + pageSize);

	return Promise.resolve({
		data,
		page,
		pageSize,
		total,
		totalPages
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

export function listQueueMock(
	query: import('$lib/types/queue').QueueQuery
): Promise<import('$lib/types/queue').QueueResponse> {
	let requests = mockRequests.map((r) => ({
		...r,
		requesterEmail: r.corporateEmail
	}));

	if (query.assigneeId !== undefined) {
		if (query.assigneeId === 'unassigned') {
			requests = requests.filter((r) => r.assignee === null);
		} else {
			requests = requests.filter((r) => r.assignee !== null);
		}
	}

	if (query.status) {
		requests = requests.filter((r) => r.status === query.status);
	}

	if (query.priority) {
		requests = requests.filter((r) => r.priority === query.priority);
	}

	if (query.search) {
		const search = query.search.toLowerCase().trim();
		requests = requests.filter(
			(r) =>
				r.processName.toLowerCase().includes(search) ||
				r.requesterName.toLowerCase().includes(search) ||
				r.protocol.toLowerCase().includes(search)
		);
	}

	const page = query.page ?? 1;
	const pageSize = query.pageSize ?? 10;
	const total = requests.length;
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize;
	const data = requests.slice(start, start + pageSize);

	return Promise.resolve({
		data,
		page,
		pageSize,
		total,
		totalPages
	});
}
