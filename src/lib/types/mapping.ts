// Tipos do mapeamento (aba Mapeamento).
//
// Contrato Front ↔ Back — Mapeamento:
// GET /queue/requests/{protocol}/mapping → MappingResponse
// PUT /queue/requests/{protocol}/mapping → MappingPayload com
// `completeMapping: true` (o frontend envia somente conclusão; o backend
// altera o status para "Mapeamento agendado").

// Valor da API; a interface exibe Remoto/Presencial (ver MODALITY_LABELS).
export type Modality = 'REMOTE' | 'IN_PERSON';

export interface Participant {
	// Opcional de propósito: cadastrados têm `id`, externos `null` na resposta
	// (DTO do backend) e omitido no payload.
	id?: string | null;
	name: string;
	email: string;
}

// Designado para EXECUTAR o mapeamento — vínculo próprio e distinto do
// responsável pela solicitação (espelho de `MappingAssignee` do backend).
// `id` = `details_professional.professional_id` (uuid); `userId` = `users.user_id`.
export interface MappingAssignee {
	id: string;
	userId: string;
	name: string;
	email: string;
	jobTitle: string | null;
}

export interface MappingResponse {
	protocol: string;
	// `mapping_id` (uuid); `null` = estado vazio (sem mapeamento registrado).
	id: string | null;
	scheduledFor: string | null;
	durationMinutes: number | null;
	modality: Modality | null;
	meetingLink: string | null;
	location: string | null;
	participants: Participant[];
	notes: string | null;
	mappingAssignee: MappingAssignee | null;
	// v4 — PUT mapping pode designar mapeador e avançar status (ids ecoados no
	// GET para edição/conclusão; o objeto resolvido fica em `mappingAssignee`).
	// `justification`/`lastTechnicalMessage` são write-only no GET; legíveis
	// via `GET /requests/:protocol/internal-notes` (históricos/evento).
	mappingAssigneeId?: string | null;
	targetStatus?: number | null;
	justification?: string | null;
	lastTechnicalMessage?: string | null;
}

export interface MappingPayload {
	scheduledFor: string | null;
	durationMinutes: number | null;
	modality: Modality | null;
	meetingLink: string | null;
	location: string | null;
	participants: Participant[];
	notes: string | null;
	// `true` conclui (backend valida e muda o status para o `targetStatus`). O frontend envia sempre `true`.
	completeMapping: boolean;
	// v4 — designação e avanço de status na conclusão
	mappingAssigneeId?: string | null;
	targetStatus?: number | null;
	justification?: string | null;
	lastTechnicalMessage?: string | null;
}

export type MappingModality = MappingResponse['modality'];
export type MappingParticipant = MappingResponse['participants'][number];

// Aliases da implementação anterior — mantidos para não churnar imports.
export type MappingDetail = MappingResponse;
export type SaveMappingPayload = MappingPayload;

export const MODALITY_LABELS: Record<Modality, string> = {
	REMOTE: 'Remoto',
	IN_PERSON: 'Presencial'
};

// Rascunho do formulário: tudo string para os inputs controlados aceitarem
// campo vazio (mesmo padrão de `EditableDraft` da edição da solicitação).
export interface MappingDraft {
	scheduledFor: string;
	durationMinutes: string;
	modality: Modality | '';
	meetingLink: string;
	location: string;
	participants: MappingParticipant[];
	notes: string;
	targetStatus?: string;
	justification?: string;
	lastTechnicalMessage?: string;
	mappingAssigneeId?: string;
}

export const MAPPING_SCHEDULED_STATUS_ID = 6;

export const MAPPING_MODALITY_OPTIONS: { value: Modality; label: string }[] = [
	{ value: 'REMOTE', label: 'Remoto' },
	{ value: 'IN_PERSON', label: 'Presencial' }
];

export const MAPPING_DURATION_OPTIONS: { value: string; label: string }[] = [
	{ value: '15', label: '15 minutos' },
	{ value: '30', label: '30 minutos' },
	{ value: '45', label: '45 minutos' },
	{ value: '60', label: '1 hora' },
	{ value: '90', label: '1 hora e 30 minutos' },
	{ value: '120', label: '2 horas' }
];

export const MAPPING_NOTES_MAXLENGTH = 2000;
export const MAPPING_LOCATION_MAXLENGTH = 255;
