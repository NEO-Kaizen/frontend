import { apiClient } from './client';
import { MOCK_DOMAINS } from '$lib/mocks';

import type {
	ConversationAttachmentInput,
	ConversationHistory,
	ConversationMessage
} from '$lib/types/conversation';

const REQUESTS_PATH = '/requests';

// GET /requests/:protocol/conversation — histórico completo da conversa
// (thread, eventos e pendências). Contrato proposto enquanto o backend não
// disponibiliza o endpoint; em DEV o mock responde pelo mesmo formato.
export async function getConversation(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<ConversationHistory> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.conversation) {
		const { getConversationMock } = await import('$lib/mocks/conversation.mock');
		return getConversationMock(protocol);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<ConversationHistory>(`${REQUESTS_PATH}/${encoded}/conversation`, {}, fetchImpl);
}

// POST /requests/:protocol/messages — envia mensagem do analista. O envio de
// anexos fica preparado no payload (metadados), sem endpoint fictício em
// produção: o upload binário aguarda a definição do backend.
export async function sendConversationMessage(
	protocol: string,
	content: string,
	attachments: ConversationAttachmentInput[] = []
): Promise<ConversationMessage> {
	if (import.meta.env.DEV && MOCK_DOMAINS && MOCK_DOMAINS.conversation) {
		const { sendConversationMessageMock } = await import('$lib/mocks/conversation.mock');
		return sendConversationMessageMock(protocol, content, attachments);
	}

	const encoded = encodeURIComponent(protocol);
	return apiClient<ConversationMessage>(`${REQUESTS_PATH}/${encoded}/messages`, {
		method: 'POST',
		body: JSON.stringify({ content, attachments })
	});
}
