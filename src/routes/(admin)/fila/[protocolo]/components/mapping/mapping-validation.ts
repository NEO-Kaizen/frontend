import type { MappingDraft, MappingModality, MappingResponse } from '$lib/types/mapping';
import { MAPPING_LOCATION_MAXLENGTH, MAPPING_NOTES_MAXLENGTH } from '$lib/types/mapping';
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
// `input[type=datetime-local]` (`yyyy-mm-ddThh:mm`).
export function toDatetimeLocalValue(iso: string | null): string {
	if (!iso) return '';
	const match = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
	return match ? match[1] : '';
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
		notes: ''
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
		notes: saved.notes ?? ''
	};
}

// Estado vazio: nenhum agendamento registrado (resposta ausente ou sem data).
export function isMappingEmpty(saved: MappingResponse | null): boolean {
	return !saved || !saved.scheduledFor;
}

export function applyMappingChange(
	draft: MappingDraft,
	path: 'scheduledFor' | 'durationMinutes' | 'meetingLink' | 'location' | 'notes',
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
// do campo no draft. `nowRef` permite testar sem depender do relógio.
export function validateMappingDraft(
	draft: MappingDraft,
	nowRef: string = nowLocalMinute()
): Record<string, string> {
	const errors: Record<string, string> = {};

	if (!isRequired(draft.scheduledFor)) {
		errors['scheduledFor'] = 'Informe a data e o horário da reunião.';
	} else if (!isValidDate(draft.scheduledFor)) {
		errors['scheduledFor'] = 'Informe uma data e um horário válidos.';
	} else if (!isFutureOrToday(draft.scheduledFor, nowRef)) {
		errors['scheduledFor'] = 'Informe uma data e um horário futuros.';
	}

	if (draft.durationMinutes.trim() !== '') {
		const duration = parseNumber(draft.durationMinutes);
		if (duration === null || !Number.isInteger(duration) || duration <= 0) {
			errors['durationMinutes'] = 'Informe uma duração válida em minutos.';
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

	if (draft.notes.trim().length > MAPPING_NOTES_MAXLENGTH) {
		errors['notes'] = `As observações devem ter no máximo ${MAPPING_NOTES_MAXLENGTH} caracteres.`;
	}

	return errors;
}

// Validação de um único campo (blur): reaproveita a validação completa e
// devolve só a chave do campo.
export function validateMappingField(draft: MappingDraft, path: string): Record<string, string> {
	const all = validateMappingDraft(draft);
	if (all[path]) return { [path]: all[path] };
	return {};
}

// Rótulo da modalidade para leitura (`REMOTE` → Remoto).
export function modalityLabel(modality: MappingModality): string {
	if (modality === 'REMOTE') return 'Remoto';
	if (modality === 'IN_PERSON') return 'Presencial';
	return '---';
}
