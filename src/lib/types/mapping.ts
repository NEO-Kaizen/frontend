// Tipos do agendamento de mapeamento (aba Mapeamento).
//
// O contrato interno (GET /requests/:protocol/internal) cobre hoje apenas
// `mappingDate`, `meeting.scheduledFor`, `meeting.link` e `schedulePreferences`.
// Duração, modalidade, local, participantes e observações ainda não possuem
// suporte no backend: enquanto o contrato não existir, esses campos vivem em
// mock isolado (`$lib/mocks/mapping.mock.ts`) via `$lib/services/mapping.service.ts`.

export type MappingModality = 'Remoto' | 'Presencial';

export interface MappingParticipant {
	id: string;
	name: string;
	email: string;
}

// Agendamento persistido (leitura). Campos estendidos sem backend ficam
// `null` até o primeiro salvamento pelo mock.
export interface MappingDetail {
	scheduledFor: string | null;
	durationMinutes: number | null;
	modality: MappingModality | null;
	meetingLink: string | null;
	location: string | null;
	participants: MappingParticipant[];
	notes: string | null;
}

// Rascunho do formulário: tudo string para os inputs controlados aceitarem
// campo vazio (mesmo padrão de `EditableDraft` da edição da solicitação).
export interface MappingDraft {
	scheduledFor: string;
	durationMinutes: string;
	modality: MappingModality | '';
	meetingLink: string;
	location: string;
	participants: MappingParticipant[];
	notes: string;
}

// Payload de salvamento — ponto de integração futura com o backend.
export interface SaveMappingPayload {
	scheduledFor: string;
	durationMinutes: number | null;
	modality: MappingModality;
	meetingLink: string | null;
	location: string | null;
	participants: MappingParticipant[];
	notes: string | null;
}

export const MAPPING_MODALITY_OPTIONS: { value: MappingModality; label: string }[] = [
	{ value: 'Remoto', label: 'Remoto' },
	{ value: 'Presencial', label: 'Presencial' }
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
