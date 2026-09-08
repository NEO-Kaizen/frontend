import type { RequestDetail, RequestSummary } from '$lib/types/request';

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
			result: 'Não elegível',
			justification: 'Solicitação cancelada pelo próprio solicitante antes da triagem.'
		}
	}
];
