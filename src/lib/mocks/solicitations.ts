import type { RequestDetail } from '$lib/types/solicitation';

export const mockSolicitations: RequestDetail[] = [
	{
		protocol: 'NEO-2026-000123',
		email: 'maria.oliveira@neo.com.br',
		demandTitle: 'Automatizar conferência de diárias',
		processName: 'Pagamento de diárias',
		status: 'Em triagem',
		assigneeName: 'Fernando Alves',
		openedAt: '2026-08-25T14:03:11.000Z',
		estimatedCompletion: '2026-10-18',
		mappingDate: null,
		meeting: {
			scheduledFor: '2026-10-15T10:30:00.000Z',
			link: 'https://meet.google.com/abc-defg-hij'
		},
		pendingIssues: [],
		nextStep: 'Aguarde o contato do analista',
		lastTechnicalMessage: 'Sua solicitação está em análise. Assim que houver uma atualização, entraremos em contato.',
		lastUpdate: '2026-08-26T10:12:40.000Z',
		conclusion: null
	},
	{
		protocol: '2026.0825.001',
		email: 'joao.silva@neo.com.br',
		demandTitle: 'Instalação de Ponto de Rede na Sala 302',
		processName: 'Infraestrutura de Rede',
		status: 'Em mapeamento',
		assigneeName: 'Carlos Silva',
		openedAt: '2026-08-25T09:00:00.000Z',
		estimatedCompletion: '2026-08-28',
		mappingDate: '2026-08-27',
		meeting: {
			scheduledFor: '2026-08-27T10:00:00.000Z',
			link: null
		},
		pendingIssues: [],
		nextStep: 'Aguardar vistoria presencial',
		lastTechnicalMessage: 'A equipe técnica fará uma vistoria presencial no local indicado no período da manhã.',
		lastUpdate: '2026-08-25T14:30:00.000Z',
		conclusion: null
	}
];
