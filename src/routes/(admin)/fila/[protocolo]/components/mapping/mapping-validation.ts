import type { MappingDraft, MappingModality, MappingResponse } from '$lib/types/mapping';
import {
	MAPPING_LOCATION_MAXLENGTH,
	MAPPING_NOTES_MAXLENGTH,
	MAPPING_SCHEDULED_STATUS_ID
} from '$lib/types/mapping';
import type { RequestStatus } from '$lib/types/request';
import {
	isFutureOrToday,
	isRequired,
	isValidDate,
	isValidEmail,
	parseNumber
} from '$lib/utils/validations';

// Referência "agora" no formato do `input[datetime-local]` (`yyyy-mm-ddThh:mm`)
// para a comparação lexicográfica de `isFutureOrToday` funcionar.
export function nowLocalMinute(): string {
	return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// Normaliza o `scheduledFor` do contrato (ISO com offset/Z) para o valor do
// `input[type=datetime-local]` (`yyyy-mm-ddThh:mm` em hora local).
// O contrato devolve UTC/Z (ex.: "2026-10-15T13:30:00Z"); o input espera hora
// local, então convertemos UTC → local (inverso de datetimeLocalToIso).
export function toDatetimeLocalValue(iso: string | null): string {
	if (!iso) return '';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return '';
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function emptyMappingDraft(): MappingDraft {
	return {
		scheduledFor: '',
		durationMinutes: '',
		// Modalidade pré-selecionada como remota (padrão da operação).
		modality: 'REMOTE',
		meetingLink: '',
		location: '',
		participants: [],
		notes: '',
		targetStatus: String(MAPPING_SCHEDULED_STATUS_ID),
		justification: '',
		lastTechnicalMessage: '',
		mappingAssigneeId: ''
	};
}

// Monta o rascunho a partir do agendamento salvo; quando ainda não há nada
// salvo, aproveita o `meeting` do contrato interno como ponto de partida.
export function toMappingDraft(
	saved: MappingResponse | null,
	fallbackScheduledFor: string | null,
	fallbackLink: string | null
): MappingDraft {
	if (!saved) {
		return {
			...emptyMappingDraft(),
			scheduledFor: toDatetimeLocalValue(fallbackScheduledFor),
			meetingLink: (fallbackLink ?? '').trim()
		};
	}
	return {
		scheduledFor: toDatetimeLocalValue(saved.scheduledFor),
		durationMinutes: saved.durationMinutes === null ? '' : String(saved.durationMinutes),
		modality: saved.modality ?? 'REMOTE',
		meetingLink: saved.meetingLink ?? '',
		location: saved.location ?? '',
		participants: saved.participants.map((participant) => ({ ...participant })),
		notes: saved.notes ?? '',
		targetStatus: saved.targetStatus
			? String(saved.targetStatus)
			: String(MAPPING_SCHEDULED_STATUS_ID),
		// `justification`/`lastTechnicalMessage` são write-only no GET: leitura
		// via `internal-notes` (§2.5); o formulário sempre parte vazio.
		justification: '',
		lastTechnicalMessage: '',
		mappingAssigneeId: saved.mappingAssigneeId ?? ''
	};
}

// Estado vazio: nenhum agendamento registrado (resposta ausente ou sem data).
export function isMappingEmpty(saved: MappingResponse | null): boolean {
	return !saved || !saved.scheduledFor;
}

const PRE_MAPPING_STATUSES: readonly RequestStatus[] = [
	'Solicitação enviada',
	'Aguardando triagem',
	'Em triagem',
	'Pendente de informações',
	'Aguardando mapeamento'
];

export function isMappingConcluded(status: RequestStatus): boolean {
	return !PRE_MAPPING_STATUSES.includes(status);
}

export function applyMappingChange(
	draft: MappingDraft,
	path:
		| 'scheduledFor'
		| 'durationMinutes'
		| 'meetingLink'
		| 'location'
		| 'notes'
		| 'targetStatus'
		| 'justification'
		| 'lastTechnicalMessage'
		| 'mappingAssigneeId',
	value: string
): void {
	switch (path) {
		case 'scheduledFor':
			draft.scheduledFor = value;
			break;
		case 'durationMinutes':
			draft.durationMinutes = value;
			break;
		case 'meetingLink':
			draft.meetingLink = value;
			break;
		case 'location':
			draft.location = value;
			break;
		case 'notes':
			draft.notes = value;
			break;
		case 'targetStatus':
			draft.targetStatus = value;
			break;
		case 'justification':
			draft.justification = value;
			break;
		case 'lastTechnicalMessage':
			draft.lastTechnicalMessage = value;
			break;
		case 'mappingAssigneeId':
			draft.mappingAssigneeId = value;
			break;
	}
}

function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

function validateParticipants(draft: MappingDraft): string | null {
	const seen = new Set<string>();
	for (const participant of draft.participants) {
		const name = participant.name.trim();
		const email = participant.email.trim();
		if (!name) return 'Informe o nome de todos os participantes.';
		if (!email) return 'Informe o e-mail de todos os participantes.';
		if (!isValidEmail(email)) return `E-mail inválido: ${email}.`;
		const key = email.toLowerCase();
		if (seen.has(key)) return `Participante duplicado: ${email}.`;
		seen.add(key);
	}
	return null;
}

// Validação completa do formulário de conclusão. Chave = nome
// do campo no draft. `nowRef` permite testar sem depender do relógio. v4:
// `targetStatus === 6` → reunião obrigatória, sem justificativa/retorno;
// `targetStatus !== 6` → reunião travada, `justification 1..4000` obrigatória
// e `lastTechnicalMessage 1..4000` obrigatório se o destino for público.
export function validateMappingDraft(
	draft: MappingDraft,
	nowRef: string = nowLocalMinute(),
	statuses: import('$lib/types/portal-config').PortalStatus[] = []
): Record<string, string> {
	const errors: Record<string, string> = {};

	// v4 — targetStatus obrigatório em conclusão (PUT mapping com completeMapping:true)
	let targetId: number | null = null;
	let targetIsPublic = false;
	if (!draft.targetStatus || draft.targetStatus.toString().trim() === '') {
		errors['targetStatus'] = 'Selecione o status de destino do mapeamento.';
	} else {
		targetId = Number(draft.targetStatus);
		if (statuses.length > 0) {
			const s = statuses.find((st) => st.id === targetId);
			if (!s || !s.isActive || s.isRestricted || s.mappingMode !== 'conclusion_only') {
				errors['targetStatus'] =
					'Status deve ter mappingMode conclusion_only e isRestricted=false.';
			} else {
				targetIsPublic = s.isPublic;
			}
		}
	}

	const isScheduled = targetId === MAPPING_SCHEDULED_STATUS_ID;

	if (isScheduled) {
		if (!isRequired(draft.scheduledFor)) {
			errors['scheduledFor'] = 'Informe a data e o horário da reunião.';
		} else if (!isValidDate(draft.scheduledFor)) {
			errors['scheduledFor'] = 'Informe uma data e um horário válidos.';
		} else if (!isFutureOrToday(draft.scheduledFor, nowRef)) {
			errors['scheduledFor'] = 'Informe uma data e um horário futuros.';
		}

		// A duração é obrigatória no agendamento (target 6): o backend rejeita a
		// conclusão sem `durationMinutes` (`missingFieldForCompletion`). Limite
		// 15..480 espelha o schema do contrato (§3.2).
		if (!isRequired(draft.durationMinutes)) {
			errors['durationMinutes'] = 'Informe a duração prevista.';
		} else {
			const duration = parseNumber(draft.durationMinutes);
			if (duration === null || !Number.isInteger(duration) || duration < 15 || duration > 480) {
				errors['durationMinutes'] = 'Informe uma duração entre 15 e 480 minutos.';
			}
		}

		if (!draft.modality) {
			errors['modality'] = 'Selecione a modalidade da reunião.';
		} else if (draft.modality === 'REMOTE') {
			if (!isRequired(draft.meetingLink)) {
				errors['meetingLink'] = 'Informe o link da videoconferência para reunião remota.';
			} else if (!isValidUrl(draft.meetingLink.trim())) {
				errors['meetingLink'] = 'Informe um link válido (http ou https).';
			}
		} else if (draft.modality === 'IN_PERSON') {
			if (!isRequired(draft.location)) {
				errors['location'] = 'Informe a sala ou o local para reunião presencial.';
			} else if (draft.location.trim().length < 3) {
				errors['location'] = 'Informe uma sala ou um local válido.';
			} else if (draft.location.trim().length > MAPPING_LOCATION_MAXLENGTH) {
				errors['location'] =
					`A sala ou o local deve ter no máximo ${MAPPING_LOCATION_MAXLENGTH} caracteres.`;
			}
		}

		const participantsError = validateParticipants(draft);
		if (participantsError) {
			errors['participants'] = participantsError;
		}

		// Observações pertencem ao lado "reunião" do mapeamento: só são
		// validadas quando o destino é o agendamento (id 6).
		if ((draft.notes ?? '').trim().length > MAPPING_NOTES_MAXLENGTH) {
			errors['notes'] = `As observações devem ter no máximo ${MAPPING_NOTES_MAXLENGTH} caracteres.`;
		}
	}

	if (!isScheduled && targetId !== null && !errors['targetStatus']) {
		if (!isRequired(draft.justification ?? '')) {
			errors['justification'] = 'Informe a justificativa (1..4000 caracteres).';
		} else if ((draft.justification ?? '').trim().length > 4000) {
			errors['justification'] = 'Limite de 4000 caracteres excedido.';
		}

		if (targetIsPublic) {
			if (!isRequired(draft.lastTechnicalMessage ?? '')) {
				errors['lastTechnicalMessage'] = 'Informe o retorno ao solicitante (1..4000 caracteres).';
			} else if ((draft.lastTechnicalMessage ?? '').trim().length > 4000) {
				errors['lastTechnicalMessage'] = 'Limite de 4000 caracteres excedido.';
			}
		}
	}

	return errors;
}

// Validação de um único campo (blur): reaproveita a validação completa e
// devolve só a chave do campo.
export function validateMappingField(
	draft: MappingDraft,
	path: string,
	statuses: import('$lib/types/portal-config').PortalStatus[] = []
): Record<string, string> {
	const all = validateMappingDraft(draft, undefined, statuses);
	if (all[path]) return { [path]: all[path] };
	return {};
}

// Rótulo da modalidade para leitura (`REMOTE` → Remoto).
export function modalityLabel(modality: MappingModality): string {
	if (modality === 'REMOTE') return 'Remoto';
	if (modality === 'IN_PERSON') return 'Presencial';
	return '---';
}
