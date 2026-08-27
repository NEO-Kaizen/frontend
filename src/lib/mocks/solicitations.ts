import type { SolicitationDetail } from '$lib/types/solicitation';

export const mockSolicitations: SolicitationDetail[] = [
	{
		protocol: '2026.0825.001',
		title: 'Instalação de Ponto de Rede na Sala 302',
		statusLabel: 'Em Atendimento',
		technicalResponsible: 'Carlos Silva',
		openingDate: '25/08/2026',
		completionForecast: '28/08/2026',
		lastUpdate: '25/08/2026 às 14:30',
		meeting: {
			date: '27/08/2026 às 10:00'
		},
		lastMessage:
			'A equipe técnica fará uma vistoria presencial no local indicado no período da manhã.'
	},
	{
		protocol: '2026.0825.002',
		title: 'Manutenção de Servidor de Banco de Dados',
		statusLabel: 'Concluído',
		technicalResponsible: 'Ana Souza',
		openingDate: '20/08/2026',
		completionForecast: '24/08/2026',
		lastUpdate: '24/08/2026 às 18:00',
		meeting: {
			date: '22/08/2026 às 15:30'
		},
		lastMessage:
			'Serviço finalizado com sucesso. Banco de dados operando em 100% de capacidade.'
	}
];
