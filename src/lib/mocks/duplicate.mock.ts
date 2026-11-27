import { ApiError } from '$lib/types/result';
import type {
	DuplicateAlertItem,
	DuplicateCheckResponse,
	DuplicateConfidence
} from '$lib/types/duplicate';
import type { ApiErrorResponse } from '$lib/types/request';

// Fixtures do contrato público do RF16 (backend#208). São compartilhadas pelo
// mock de desenvolvimento e pelas fixtures de Playwright. Nunca incluem
// Protocolo, score, total, contagem, Notas internas, Triagem, Prioridade,
// Responsável, Anexos ou PII de terceiros.
export const DUPLICATE_ITEMS = {
	// Solicitação aberta: só template, sem texto livre.
	open: {
		publicId: '8f14e45f-ea3a-4b2c-9c1d-1f7a5e6b2c90',
		title: 'Solicitação de Automação em andamento',
		summary: 'Solicitação em andamento da categoria Automação, registrada no período 2026-Q4.',
		category: 'Automação',
		status: 'Em andamento',
		period: '2026-Q4'
	},
	// Solicitação concluída: texto tarjado, sem PII.
	concluded: {
		publicId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
		title: 'Automatizar conciliação bancária',
		summary: 'Conferência de extratos e lançamentos com trilha de auditoria.',
		category: 'Automação',
		status: 'Concluída',
		period: '2026-Q4'
	},
	openMelhoria: {
		publicId: '1b4e28ba-2fa1-11d2-883f-0016d3cca427',
		title: 'Solicitação de Melhoria de processo em andamento',
		summary:
			'Solicitação em andamento da categoria Melhoria de processo, registrada no período 2026-Q3.',
		category: 'Melhoria de processo',
		status: 'Em andamento',
		period: '2026-Q3'
	},
	concludedDashboard: {
		publicId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
		title: 'Padronizar relatório mensal de indicadores',
		summary: 'Relatório consolidado com a mesma estrutura em todas as áreas.',
		category: 'Dashboard ou relatório',
		status: 'Concluída',
		period: '2026-Q4'
	}
} as const satisfies Record<string, DuplicateAlertItem>;

export const DUPLICATE_RESPONSES: Record<DuplicateConfidence, DuplicateCheckResponse> = {
	high: {
		confidence: 'high',
		items: [DUPLICATE_ITEMS.open, DUPLICATE_ITEMS.concluded, DUPLICATE_ITEMS.openMelhoria]
	},
	medium: {
		confidence: 'medium',
		items: [
			DUPLICATE_ITEMS.open,
			DUPLICATE_ITEMS.concluded,
			DUPLICATE_ITEMS.openMelhoria,
			DUPLICATE_ITEMS.concludedDashboard
		]
	},
	none: { confidence: 'none', items: [] }
};

export const DUPLICATE_ERROR: ApiErrorResponse = {
	status: 'error',
	statusCode: 500,
	message: 'Erro interno do servidor'
};

export type DuplicateMockScenario = DuplicateConfidence | 'error';

let scenario: DuplicateMockScenario = 'medium';

// Hook de desenvolvimento/teste: escolhe o cenário devolvido pelos mocks sem
// alterar o contrato das funções usadas pela API.
export function __setDuplicateMockScenario(next: DuplicateMockScenario): void {
	scenario = next;
}

export function __resetDuplicateMockScenario(): void {
	scenario = 'medium';
}

function getDuplicateResponseForScenario(): DuplicateCheckResponse {
	if (scenario === 'error') {
		throw new ApiError(DUPLICATE_ERROR.statusCode, DUPLICATE_ERROR.message);
	}

	return structuredClone(DUPLICATE_RESPONSES[scenario]);
}

// Mock de desenvolvimento: mantém o frontend funcional sem backend. O cenário
// padrão é `medium` (bloco inline); os testes/dev podem trocar para `high`,
// `none` ou `error` com `__setDuplicateMockScenario`.
export async function checkDuplicatesMock(): Promise<DuplicateCheckResponse> {
	return getDuplicateResponseForScenario();
}

export async function getTrackingDuplicatesMock(): Promise<DuplicateCheckResponse> {
	return getDuplicateResponseForScenario();
}
