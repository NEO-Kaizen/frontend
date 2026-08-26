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
	}
];