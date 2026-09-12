import { ApiError } from '$lib/types/result';
import type {
	InternalRequestDetail,
	CreateRequestPayload,
	CreateRequestResponse,
	ListRequestsQuery,
	PaginatedResponse,
	RequestDetail,
	RequestSummary
} from '$lib/types/request';

// Fixtures — dados fictícios do domínio de solicitações, consumidos apenas pelos mocks.
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
// desenvolvimento: o novo protocolo fica rastreável em /acompanhar e na busca.
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

// Protocolo fictício no formato do contrato (geração FPE/Feistel é do backend).
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

export const mockInternalRequestDetails: InternalRequestDetail[] = [
	{
		protocol: 'MAAT-2026-000102',
		status: 'Em triagem',
		priority: 'Alta',
		prioritization: { score: 16, maxScore: 25, label: 'Alta' },
		assignee: { name: 'Ana Rodrigues', email: 'ana.rodrigues@empresa.com.br' },
		correctionAlert: { count: 2, message: 'Alteração respondida pelo solicitante (2 campos)' },
		requester: {
			fullName: 'Carlos Eduardo da Silva',
			corporateEmail: 'carlos.silva@empresa.com.br',
			area: 'Tecnologia da Informação',
			department: 'Operações Logísticas',
			manager: 'Ana Rodrigues',
			additionalContact: 'carlos.silva.pessoal@email.com'
		},
		demand: {
			title: 'Automatização do fluxo de aprovação de faturas',
			requestType: 'Automação',
			category: 'Automação',
			processName: 'AP-REC-04 Pagamentos',
			description:
				'Criar fluxo automatizado que valide e encaminhe faturas para aprovação conforme valor e centro de custo.',
			problem:
				'Atualmente a aprovação exige assinaturas físicas de dois diretores e causa atrasos frequentes.',
			expectedResult: 'Fluxo digital com aprovação baseada em regras e rastreabilidade completa.',
			justification:
				'Atualmente, a aprovação de faturas acima de R$ 50.000 exige assinaturas físicas de dois diretores. O processo demora em média 5 dias e frequentemente causa atrasos em pagamentos de fornecedores críticos, gerando multas. Necessitamos de uma solução que automatize a coleta de aprovações via sistema baseado no valor da fatura, com notificações e trilha de auditoria.'
		},
		operational: {
			processDescription:
				'Processo de recebimento, validação e pagamento de faturas de fornecedores nacionais e internacionais.',
			processSteps:
				'1. Recebimento da fatura por e-mail\n2. Validação manual do centro de custo\n3. Coleta de assinaturas físicas\n4. Lançamento no ERP\n5. Agendamento de pagamento',
			systemsUsed: 'ERP Protheus, e-mail corporativo, planilhas Excel',
			executionFrequency: 'Diária',
			volumetry: '500',
			peopleInvolved: 4,
			averageExecutionTime: '30 minutos',
			monthlyEffortHours: 80,
			hasManualControls: 'Planilha de controle manual com conferência dupla antes do lançamento.',
			mainRisks:
				'Erro de digitação, pagamento duplicado e atraso que gera multa por descumprimento contratual.',
			clientImpact:
				'Fornecedores com pagamento em atraso; risco de suspensão de fornecimento crítico.',
			operationalImpact: 'Alto',
			desiredDeadline: '2026-10-08',
			perceivedCriticality: 'Alta'
		},
		complementary: {
			hasProcessDocumentation: 'Disponível na intranet: manual AP-REC-04 v3.1.',
			hasSimilarSolution: false,
			dependsOnOtherAreas: 'Depende do Financeiro e do Jurídico para validação de regras.',
			handlesRestrictedInfo: false,
			additionalNotes: 'Preferência por validacao por workflow no Teams.'
		},
		schedulePreferences: ['2026-10-08T15:00', '2026-10-08T17:00'],
		mappingDate: null,
		meeting: null,
		attachments: [
			{
				fileName: 'fluxo-atual.png',
				mimeType: 'image/png',
				sizeBytes: 245000,
				downloadUrl: '/mocks/fluxo-atual.png',
				canDownload: true
			},
			{
				fileName: 'regras-de-aprovacao.pdf',
				mimeType: 'application/pdf',
				sizeBytes: 512000,
				downloadUrl: '/mocks/regras-de-aprovacao.pdf',
				canDownload: true
			}
		],
		openedAt: '2026-08-10T09:00:00.000Z',
		lastUpdate: '2026-08-12T14:20:00.000Z',
		internalObservations: null
	},
	{
		protocol: 'MAAT-2026-000103',
		status: 'Aguardando triagem',
		priority: null,
		prioritization: { score: null, maxScore: 25, label: null },
		assignee: null,
		correctionAlert: null,
		requester: {
			fullName: 'Juliana Almeida',
			corporateEmail: 'juliana.almeida@empresa.com.br',
			area: 'Recursos Humanos',
			department: undefined,
			manager: 'Roberto Lima',
			additionalContact: undefined
		},
		demand: {
			title: 'Padronização do processo de onboarding',
			requestType: 'Melhoria',
			category: 'Padronização',
			processName: 'RH-ONB-01 Admissão',
			description:
				'Padronizar etapas de onboarding para garantir experiência consistente entre unidades.',
			problem:
				'Cada unidade executa o onboarding de forma distinta, gerando retrabalho e inconsistências.',
			expectedResult: 'Checklist único e trilha de capacitação inicial padronizada.',
			justification: 'Reduzir turnover nos primeiros 90 dias com integração estruturada.'
		},
		operational: {
			processDescription: 'Admissão, integração e acompanhamento de novos colaboradores.',
			processSteps:
				'1. Contratação\n2. Envio de kit\n3. Treinamento inicial\n4. Acompanhamento 30/60/90 dias',
			systemsUsed: 'Gupy, planilhas',
			executionFrequency: 'Semanal',
			volumetry: '20',
			peopleInvolved: 3,
			averageExecutionTime: '2 horas',
			monthlyEffortHours: 40,
			hasManualControls: false,
			mainRisks: 'Informações desencontradas entre unidades.',
			clientImpact: 'Experiência inicial inconsistente.',
			operationalImpact: 'Médio',
			desiredDeadline: '2026-11-15',
			perceivedCriticality: 'Média'
		},
		complementary: undefined,
		schedulePreferences: null,
		mappingDate: null,
		meeting: null,
		attachments: [],
		openedAt: '2026-09-01T10:00:00.000Z',
		lastUpdate: '2026-09-01T10:00:00.000Z',
		internalObservations: null
	},
	{
		protocol: 'MAAT-2026-000104',
		status: 'Em triagem',
		priority: null,
		prioritization: { score: null, maxScore: 25, label: null },
		assignee: { name: 'Lucas Gomes', email: 'lucas.gomes@empresa.com.br' },
		correctionAlert: null,
		requester: {
			fullName: 'Bruno Martins',
			corporateEmail: 'bruno.martins@empresa.com.br',
			area: 'Financeiro',
			department: 'Controladoria',
			manager: 'Patrícia Melo',
			additionalContact: '11988887777'
		},
		demand: {
			title: 'Dashboard de acompanhamento orçamentário',
			requestType: 'Melhoria',
			category: 'Dashboard ou relatório',
			processName: 'FIN-ORC-02 Orçamento',
			description: 'Dashboard para acompanhamento de orçamento por centro de custo.',
			problem: 'Relatórios atuais são estáticos e consolidados manualmente.',
			expectedResult: 'Painel dinâmico com atualização diária e alertas automáticos.',
			justification: 'Melhorar visibilidade gerencial e antecipar desvios orçamentários.'
		},
		operational: {
			processDescription: 'Consolidação de despesas e acompanhamento versus orçado.',
			processSteps:
				'1. Coleta de dados do ERP\n2. Consolidação em Excel\n3. Envio por e-mail\n4. Apresentação em reunião mensal',
			systemsUsed: 'ERP, Excel, PowerPoint',
			executionFrequency: 'Mensal',
			volumetry: '50',
			peopleInvolved: 2,
			averageExecutionTime: '4 horas',
			monthlyEffortHours: 16,
			hasManualControls: 'Conferência manual em planilha antes do envio.',
			mainRisks: 'Erro manual e decisões tardias por falta de visibilidade em tempo real.',
			clientImpact: 'Gestores sem visão tempestiva do orçado vs realizado.',
			operationalImpact: 'Médio',
			desiredDeadline: '2026-12-01',
			perceivedCriticality: 'Média'
		},
		complementary: {
			hasProcessDocumentation: false,
			hasSimilarSolution: 'Dashboard legado em Excel, sem atualização automática.',
			dependsOnOtherAreas: false,
			handlesRestrictedInfo: 'Dados financeiros restritos a diretoria.',
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
		openedAt: '2026-09-10T08:30:00.000Z',
		lastUpdate: '2026-09-10T08:30:00.000Z',
		internalObservations: 'Aguardando definição de origem de dados.'
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
