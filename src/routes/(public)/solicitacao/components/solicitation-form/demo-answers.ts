import type {
	ComplementaryData,
	DemandData,
	IdentificationData,
	OperationalData
} from '$lib/types/request';

// Respostas fictícias usadas pelo botão "Preencher exemplo" do formulário.
// Datas são calculadas no clique para sempre satisfazerem as validações de
// "hoje ou futuro" (prazo desejado e preferência de horários).

function toDateInput(date: Date): string {
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function toDateTimeInput(date: Date): string {
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function daysFromNow(days: number, hour = 9): Date {
	const date = new Date();
	date.setDate(date.getDate() + days);
	date.setHours(hour, 0, 0, 0);
	return date;
}

export function getDemoIdentification(): IdentificationData {
	return {
		fullName: 'Maria Oliveira',
		corporateEmail: 'maria.oliveira@empresa.com.br',
		area: 'Operações',
		department: 'Departamento Pessoal',
		manager: 'Fernando Alves',
		additionalContact: 'Ramal 4210'
	};
}

export function getDemoDemand(category: string): DemandData {
	return {
		title: 'Automação do fechamento mensal de ponto',
		category: (category || 'Automação') as DemandData['category'],
		processName: 'Fechamento mensal de ponto',
		requestType: 'Automação',
		description: 'Automatizar a apuração do ponto para reduzir o tempo de fechamento mensal.',
		problem: 'O fechamento exige conferência manual de marcações e causa atrasos na folha.',
		justification: 'Reduzir o esforço manual e evitar erros na apuração de horas.',
		expectedResult: 'Apuração automática com relatório de inconsistências.'
	};
}

export function getDemoOperational(): OperationalData {
	return {
		processDescription:
			'Coleta de marcações, conferência de inconsistências e fechamento da folha.',
		processSteps:
			'1. Extração das marcações\n2. Conferência de faltas e atrasos\n3. Ajustes manuais\n4. Fechamento',
		systemsUsed: 'Relógio de ponto, planilhas Excel',
		executionFrequency: 'Mensal',
		volumetry: '300 marcações/mês',
		peopleInvolved: '2',
		averageExecutionTime: '6 horas',
		monthlyEffortHours: '12',
		hasManualControls: 'Sim',
		hasManualControlsDetail: 'Conferência manual das marcações antes do fechamento.',
		mainRisks: 'Erro de apuração e atraso na folha de pagamento.',
		clientImpact: 'Colaboradores com pagamento em atraso.',
		operationalImpact: 'Alto',
		desiredDeadline: toDateInput(daysFromNow(30)),
		perceivedCriticality: 'Alta'
	};
}

export function getDemoComplementary(): ComplementaryData {
	return {
		hasProcessDocumentation: 'Sim',
		hasProcessDocumentationDetail: 'Manual de fechamento disponível na intranet.',
		hasSimilarSolution: 'Não',
		hasSimilarSolutionDetail: '',
		dependsOnOtherAreas: 'Sim',
		dependsOnOtherAreasDetail: 'Recursos Humanos e Financeiro.',
		handlesRestrictedInfo: 'Não',
		handlesRestrictedInfoDetail: '',
		additionalNotes: 'Solicitação fictícia criada pelo botão de demonstração.',
		files: [],
		preferredSchedule: [toDateTimeInput(daysFromNow(7, 10)), toDateTimeInput(daysFromNow(7, 14))]
	};
}
