import { ApiError } from '$lib/types/result';
import { mockInternalRequestDetails } from './requests.mock';

import type {
	ConversationAttachment,
	ConversationAttachmentInput,
	ConversationHistory,
	ConversationItem,
	ConversationMessage,
	ConversationRequester,
	ConversationSystemEvent,
	Pendency
} from '$lib/types/conversation';

// Fixtures fictícios da conversa — dados de demonstração, nunca reais.
// Enquanto o backend de conversa não existir, este mock responde pelo
// contrato esperado (conversation.api.ts), com os estados previstos na issue.

const ATTACHMENTS: Record<string, ConversationAttachment> = {
	comprovanteFechamento: {
		id: 'att-comprovante-ponto',
		name: 'comprovante-ponto.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 184320,
		url: '/mocks/comprovante-ponto.pdf',
		canDownload: true
	},
	planilhaVolume: {
		id: 'att-planilha-volume',
		name: 'planilha-volume.xlsx',
		mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		sizeBytes: 131072,
		url: '/mocks/planilha-volume.xlsx',
		canDownload: true
	},
	fluxoProcessoIndisponivel: {
		id: 'att-fluxo-indisponivel',
		name: 'fluxo-processo.pdf',
		mimeType: 'application/pdf',
		sizeBytes: 245760,
		url: null,
		canDownload: false
	}
};

const REQUESTER_MESSAGE_1: ConversationMessage = {
	id: 'msg-requester-1',
	type: 'message',
	authorType: 'requester',
	authorName: 'Maria Oliveira',
	authorRole: 'Solicitante',
	content:
		'Olá! Gostaria que a automação preservasse o relatório de inconsistências gerado hoje no fechamento.',
	createdAt: '2026-08-12T10:15:00.000Z',
	attachments: [ATTACHMENTS.comprovanteFechamento]
};

const ANALYST_MESSAGE_1: ConversationMessage = {
	id: 'msg-analyst-1',
	type: 'message',
	authorType: 'analyst',
	authorName: 'Fernando Alves',
	authorRole: 'Analista',
	content:
		'Olá, Maria. Vamos considerar o relatório de inconsistências como requisito obrigatório da automação.',
	createdAt: '2026-08-12T11:00:00.000Z'
};

const REQUESTER_MESSAGE_2: ConversationMessage = {
	id: 'msg-requester-2',
	type: 'message',
	authorType: 'requester',
	authorName: 'Maria Oliveira',
	authorRole: 'Solicitante',
	content: 'Segue o detalhamento solicitado sobre o processo atual.',
	createdAt: '2026-08-21T14:00:00.000Z',
	attachments: [ATTACHMENTS.planilhaVolume]
};

const ANALYST_MESSAGE_2: ConversationMessage = {
	id: 'msg-analyst-2',
	type: 'message',
	authorType: 'analyst',
	authorName: 'Fernando Alves',
	authorRole: 'Analista',
	content: 'Recebido! As alterações foram aplicadas no texto da solicitação.',
	createdAt: '2026-08-27T11:00:00.000Z'
};

const EVENT_REGISTERED: ConversationSystemEvent = {
	id: 'evt-registered',
	type: 'system',
	label: 'Demanda registrada',
	createdAt: '2026-08-10T09:41:20.000Z'
};

const EVENT_TRIAGE: ConversationSystemEvent = {
	id: 'evt-triage',
	type: 'system',
	label: 'Status alterado para Em triagem',
	createdAt: '2026-08-12T11:05:00.000Z'
};

const PENDENCY_REQUESTED: Pendency = {
	id: 'pen-requested',
	type: 'pendency',
	status: 'requested',
	comment: 'Precisamos entender a ferramenta usada hoje na conferência manual das marcações.',
	fields: [
		{
			field: 'ferramenta_conferencia',
			label: 'Ferramenta de conferência',
			requestedValue: 'Informar a ferramenta usada na conferência manual das marcações.'
		}
	],
	createdAt: '2026-08-20T09:00:00.000Z'
};

const PENDENCY_AWAITING_APPROVAL: Pendency = {
	id: 'pen-awaiting-approval',
	type: 'pendency',
	status: 'awaiting_approval',
	comment: 'Informe o volume mensal de marcações processadas para dimensionar a automação.',
	responseMessage: 'O volume médio é de 300 colaboradores, cerca de 15.000 marcações por mês.',
	fields: [
		{
			field: 'volumetria_mensal',
			label: 'Volumetria mensal',
			requestedValue: 'Informar o volume mensal de marcações processadas.',
			answeredValue: '300 colaboradores, cerca de 15.000 marcações por mês.'
		}
	],
	attachments: [ATTACHMENTS.planilhaVolume],
	createdAt: '2026-08-21T14:30:00.000Z'
};

const PENDENCY_ANSWERED: Pendency = {
	id: 'pen-answered',
	type: 'pendency',
	status: 'answered',
	comment:
		'Descreva o passo a passo completo do fechamento atual para avaliarmos onde automatizar.',
	responseMessage:
		'Hoje o fechamento é manual: coletamos as marcações, conferimos cada divergência e ajustamos antes da liberação da folha.',
	fields: [
		{
			field: 'descricao_processo_atual',
			label: 'Descrição do processo atual',
			requestedValue: 'Descrever o passo a passo do fechamento atual.',
			answeredValue: '1. Extração das marcações\n2. Conferência manual\n3. Ajustes\n4. Fechamento.'
		}
	],
	attachments: [ATTACHMENTS.comprovanteFechamento, ATTACHMENTS.fluxoProcessoIndisponivel],
	createdAt: '2026-08-27T10:00:00.000Z'
};

const FIXTURE_ITEMS: ConversationItem[] = [
	EVENT_REGISTERED,
	REQUESTER_MESSAGE_1,
	ANALYST_MESSAGE_1,
	EVENT_TRIAGE,
	PENDENCY_REQUESTED,
	REQUESTER_MESSAGE_2,
	PENDENCY_AWAITING_APPROVAL,
	PENDENCY_ANSWERED,
	ANALYST_MESSAGE_2
];

const MOCK_REQUESTER: ConversationRequester = {
	id: 'req-maria-oliveira',
	name: 'Maria Oliveira'
};

// Store em memória — permite enviar mensagens em dev sem backend.
const mockConversations: ConversationHistory[] = [
	{
		protocol: 'MAAT-6N2W-8VBM',
		requester: MOCK_REQUESTER,
		items: FIXTURE_ITEMS
	}
];

const MOCK_LATENCY_MS = 500;

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getConversationMock(protocol: string): Promise<ConversationHistory> {
	const normalized = protocol.toLowerCase().trim();
	const found = mockConversations.find(
		(conversation) => conversation.protocol.toLowerCase().trim() === normalized
	);

	// Protocolo conhecido pelo mock sem conversa registrada → histórico vazio
	// (estado vazio da UI). Protocolo inexistente também não quebra a página.
	const history: ConversationHistory = found ?? {
		protocol,
		requester: { id: `req-${normalized}`, name: 'Solicitante' },
		items: []
	};

	return delay(MOCK_LATENCY_MS).then(() => structuredClone(history));
}

export function sendConversationMessageMock(
	protocol: string,
	content: string,
	attachments: ConversationAttachmentInput[]
): Promise<ConversationMessage> {
	const normalized = protocol.toLowerCase().trim();
	let conversation = mockConversations.find(
		(item) => item.protocol.toLowerCase().trim() === normalized
	);

	if (!conversation) {
		const detail = mockInternalRequestDetails.find(
			(requests) => requests.protocol.toLowerCase().trim() === normalized
		);
		if (!detail) {
			return Promise.reject(new ApiError(404, 'Solicitação não encontrada.'));
		}
		conversation = {
			protocol,
			requester: { id: `req-${normalized}`, name: detail.requester.fullName },
			items: []
		};
		mockConversations.push(conversation);
	}

	const analystName = mockInternalRequestDetails.find(
		(requests) => requests.protocol.toLowerCase().trim() === normalized
	)?.assignee?.name;

	const createdAt = new Date().toISOString();
	const message: ConversationMessage = {
		id: `msg-${createdAt}`,
		type: 'message',
		authorType: 'analyst',
		authorName: analystName ?? 'Analista',
		authorRole: 'Analista',
		content,
		createdAt,
		attachments: attachments.length
			? attachments.map((attachment) => ({
					id: `att-${attachment.name}-${createdAt}`,
					name: attachment.name,
					mimeType: attachment.mimeType,
					sizeBytes: attachment.sizeBytes,
					url: null,
					canDownload: false
				}))
			: undefined
	};

	conversation.items.push(message);

	return delay(MOCK_LATENCY_MS).then(() => structuredClone(message));
}
