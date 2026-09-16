import type {
	MappingDetail,
	MappingDraft,
	MappingModality,
	SaveMappingPayload
} from '$lib/types/mapping';
import { MAPPING_LOCATION_MAXLENGTH, MAPPING_NOTES_MAXLENGTH } from '$lib/types/mapping';
import { isFutureOrToday, isRequired, isValidDate, parseNumber } from '$lib/utils/validations';

// Referência "agora" no formato do `input[datetime-local]` (`yyyy-mm-ddThh:mm`)
// para a comparação lexicográfica de `isFutureOrToday` funcionar.
export function nowLocalMinute(): string {
	return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// Normaliza o `scheduledFor` do contrato (ISO com segundos/Z ou
// `datetime-local`) para o valor do `input[type=datetime-local]` (`yyyy-mm-ddThh:mm`).
export function toDatetimeLocalValue(iso: string | null): string {
	if (!iso) return '';
	const match = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
	return match ? match[1] : '';
}

export function emptyMappingDraft(): MappingDraft {
	return {
		scheduledFor: '',
		durationMinutes: '',
		modality: '',
		meetingLink: '',
		location: '',
		participants: [],
		notes: ''
	};
}

// Monta o rascunho a partir do agendamento salvo; quando ainda não há nada
// salvo, aproveita o `meeting` do contrato interno como ponto de partida.
export function toMappingDraft(
	saved: MappingDetail | null,
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
		modality: saved.modality ?? '',
		meetingLink: saved.meetingLink ?? '',
		location: saved.location ?? '',
		participants: saved.participants.map((participant) => ({ ...participant })),
		notes: saved.notes ?? ''
	};
}

// Estado vazio: nenhum agendamento registrado.
export function isMappingEmpty(saved: MappingDetail | null): boolean {
	return !saved || !saved.scheduledFor;
}

export function applyMappingChange(
	draft: MappingDraft,
	path: 'scheduledFor' | 'durationMinutes' | 'modality' | 'meetingLink' | 'location' | 'notes',
	value: string
): void {
	draft[path] = value as never;
}

function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

// Validação completa (criação e edição usam as mesmas regras). Chave = nome do
// campo no draft. `nowRef` permite testar sem depender do relógio.
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
	} else if (draft.modality === 'Remoto') {
		if (!isRequired(draft.meetingLink)) {
			errors['meetingLink'] = 'Informe o link da videoconferência para reunião remota.';
		} else if (!isValidUrl(draft.meetingLink.trim())) {
			errors['meetingLink'] = 'Informe um link válido (http ou https).';
		}
	} else if (draft.modality === 'Presencial') {
		if (!isRequired(draft.location)) {
			errors['location'] = 'Informe a sala ou o local para reunião presencial.';
		} else if (draft.location.trim().length < 3) {
			errors['location'] = 'Informe uma sala ou um local válido.';
		} else if (draft.location.trim().length > MAPPING_LOCATION_MAXLENGTH) {
			errors['location'] =
				`A sala ou o local deve ter no máximo ${MAPPING_LOCATION_MAXLENGTH} caracteres.`;
		}
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

export function toSavePayload(draft: MappingDraft): SaveMappingPayload {
	// Pré-condição: `draft` já validado por `validateMappingDraft` (chamado em
	// `handleSave` antes daqui), logo `modality` nunca é `''` neste ponto.
	const modality = draft.modality as MappingModality;
	const duration = parseNumber(draft.durationMinutes.trim());
	return {
		scheduledFor: draft.scheduledFor,
		durationMinutes: duration === null ? null : duration,
		modality,
		meetingLink: draft.meetingLink.trim() || null,
		location: draft.location.trim() || null,
		participants: draft.participants.map((participant) => ({ ...participant })),
		notes: draft.notes.trim() || null
	};
}
