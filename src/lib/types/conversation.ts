// Contrato de conversa da solicitação — thread, eventos e pendências.
// Base para a aba "Histórico de Conversa" da página interna de Tratativa.

export type ConversationAuthorType = 'requester' | 'analyst';

export type PendencyStatus = 'requested' | 'awaiting_approval' | 'answered';

export interface ConversationAttachment {
	id: string;
	name: string;
	mimeType?: string;
	sizeBytes?: number;
	url: string | null;
	canDownload: boolean;
}

export interface ConversationMessage {
	id: string;
	type: 'message';
	authorType: ConversationAuthorType;
	authorName: string;
	authorRole?: string;
	content: string;
	createdAt: string;
	attachments?: ConversationAttachment[];
}

export interface ConversationSystemEvent {
	id: string;
	type: 'system';
	label: string;
	createdAt: string;
}

export interface PendencyField {
	field: string;
	label: string;
	requestedValue?: string | null;
	answeredValue?: string | null;
}

// Card visual de pendência. As regras de negócio (validação, solicitar
// novamente, ciclo de status) pertencem à integração da issue #123 — este
// tipo reflete apenas o que a camada visual consome.
export interface Pendency {
	id: string;
	type: 'pendency';
	status: PendencyStatus;
	fields: PendencyField[];
	comment?: string;
	responseMessage?: string;
	attachments?: ConversationAttachment[];
	createdAt: string;
}

export type ConversationItem = ConversationMessage | ConversationSystemEvent | Pendency;

export interface ConversationRequester {
	id: string;
	name: string;
	isOnline: boolean;
}

export interface ConversationHistory {
	protocol: string;
	requester: ConversationRequester;
	items: ConversationItem[];
}

// Anexo no envio da mensagem — apenas metadados; o binário é derivado no
// servidor quando o endpoint real for liberado.
export interface ConversationAttachmentInput {
	name: string;
	mimeType?: string;
	sizeBytes?: number;
}
