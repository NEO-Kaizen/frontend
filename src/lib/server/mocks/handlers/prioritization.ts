import type { MockContext } from '../context';
import * as prioritizationData from '../data/prioritization';
import { requestExists } from '../data/requests';
import { isRecord, jsonResponse, MockHttpError, readJsonBody } from '../http';

export async function criteria(): Promise<Response> {
	return jsonResponse(await prioritizationData.getPrioritizationCriteria());
}

export async function score({ request, params }: MockContext): Promise<Response> {
	const protocol = params[0];
	const body = await readJsonBody(request);
	const notes = prioritizationData.validatePrioritizationNotes(
		isRecord(body) ? body.notes : undefined
	);

	if (!requestExists(protocol)) {
		throw new MockHttpError(404, 'Solicitação não encontrada');
	}

	return jsonResponse(await prioritizationData.savePrioritization(protocol, notes));
}
