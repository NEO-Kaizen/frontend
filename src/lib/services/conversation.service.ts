import {
	getConversation as getConversationApi,
	sendConversationMessage as sendConversationMessageApi
} from '$lib/api/conversation.api';

import type {
	ConversationAttachmentInput,
	ConversationHistory,
	ConversationItem,
	ConversationMessage,
	PendencyStatus
} from '$lib/types/conversation';
import { ApiError, type Result } from '$lib/types/result';

// Estados de pendência que ainda exigem ação do analista: a resposta chegou
// e falta a validação. 'requested' aguarda o solicitante e não conta.
export const UNVALIDATED_PENDENCY_STATUSES: readonly PendencyStatus[] = [
	'awaiting_approval',
	'answered'
] as const;

// Única fonte de cálculo da quantidade de pendências não validadas — alimenta
// o badge da aba e a exibição do banner de alterações respondidas. A regra
// definitiva respeita os estados retornados pelo contrato (#123/backend).
export function selectUnvalidatedPendencies(items: ConversationItem[]): number {
	return items.reduce(
		(count, item) =>
			item.type === 'pendency' && UNVALIDATED_PENDENCY_STATUSES.includes(item.status)
				? count + 1
				: count,
		0
	);
}

export async function getConversation(
	protocol: string,
	fetchImpl?: typeof fetch
): Promise<Result<ConversationHistory>> {
	try {
		const data = await getConversationApi(protocol, fetchImpl);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			const message =
				error.status === 404
					? 'Conversa não encontrada.'
					: 'Não foi possível carregar o histórico de conversa.';
			return { ok: false, error: { status: error.status, message } };
		}
		return { ok: false, error: { message: 'Não foi possível carregar o histórico de conversa.' } };
	}
}

export async function sendConversationMessage(
	protocol: string,
	content: string,
	attachments: ConversationAttachmentInput[] = []
): Promise<Result<ConversationMessage>> {
	try {
		const data = await sendConversationMessageApi(protocol, content, attachments);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return { ok: false, error: { status: error.status, message: error.message } };
		}
		return { ok: false, error: { message: 'Não foi possível enviar a mensagem.' } };
	}
}
