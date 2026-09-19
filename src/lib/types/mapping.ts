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
	// Opcional de propósito: cadastrados podem ter `id`, externos não.
	id?: string;
	name: string;
	email: string;
}

export interface MappingResponse {
	protocol: string;
	scheduledFor: string | null;
	durationMinutes: number | null;
	modality: Modality | null;
	meetingLink: string | null;
	location: string | null;
	participants: Participant[];
	notes: string | null;
}

export interface MappingPayload {
	scheduledFor: string | null;
	durationMinutes: number | null;
	modality: Modality | null;
	meetingLink: string | null;
	location: string | null;
	participants: Participant[];
	notes: string | null;
	// `true` conclui (backend valida e muda o status). O frontend envia sempre `true`.
	completeMapping: boolean;
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
}

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
