import {
	createInternalObservation,
	getInternalObservations
} from '$lib/api/internal-observations.api';
import type {
	InternalObservation,
	InternalObservationsData
} from '$lib/types/internal-observation';
import { ApiError, type Result } from '$lib/types/result';

export async function loadInternalObservations(
	protocol: string
): Promise<Result<InternalObservationsData>> {
	try {
		const data = await getInternalObservations(protocol);
		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}

		return {
			ok: false,
			error: {
				message: 'Não foi possível carregar as observações internas.'
			}
		};
	}
}

export async function submitInternalObservation(
	protocol: string,
	content: string
): Promise<Result<InternalObservation>> {
	const normalizedContent = content.trim();

	if (!normalizedContent) {
		return {
			ok: false,
			error: {
				message: 'Digite uma observação antes de enviar.'
			}
		};
	}

	try {
		const data = await createInternalObservation(protocol, {
			content: normalizedContent
		});

		return { ok: true, data };
	} catch (error) {
		if (error instanceof ApiError) {
			return {
				ok: false,
				error: {
					status: error.status,
					message: error.message
				}
			};
		}

		return {
			ok: false,
			error: {
				message: 'Não foi possível enviar a observação interna.'
			}
		};
	}
}
