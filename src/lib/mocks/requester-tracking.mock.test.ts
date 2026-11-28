import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionUser } from '$lib/types/auth';

const session = vi.hoisted(() => ({ user: vi.fn() }));
vi.mock('./auth.mock', async (importOriginal) => ({
	...(await importOriginal<typeof import('./auth.mock')>()),
	getMockSessionUser: session.user
}));

import { getSessionTrackingMock, reopenRequestMock } from './requester-tracking.mock';
import { mockRequests, mockRequestDetails, mockInternalRequestDetails } from './requests.mock';

const owner: SessionUser = {
	id: '4',
	name: 'Carlos Mendes',
	email: 'solicitante@maat.com.br',
	avatarUrl: null,
	role: 'Solicitante',
	isRoot: false,
	mustChangePassword: false,
	permissions: [{ key: 'request:track', custody: 'own' }]
};
const completed = 'MAAT-RF2A-AAA2';
const canceled = 'MAAT-RF2A-AAA3';
const summaries = structuredClone(mockRequests);
const publicDetails = structuredClone(mockRequestDetails);
const internalDetails = structuredClone(mockInternalRequestDetails);

async function tracking(protocol: string) {
	const result = await getSessionTrackingMock(protocol);
	if (result.mode !== 'authenticated') throw new Error('Esperava tracking autenticado.');
	return result.details;
}

async function reference(protocol: string) {
	const details = await tracking(protocol);
	expect(details.canReopen).toBe(true);
	if (!details.closureRef) throw new Error('Esperava referência de encerramento.');
	return details.closureRef;
}

describe('RF02 — reabertura no mock compartilhado', () => {
	beforeEach(() => {
		mockRequests.splice(0, mockRequests.length, ...structuredClone(summaries));
		mockRequestDetails.splice(0, mockRequestDetails.length, ...structuredClone(publicDetails));
		mockInternalRequestDetails.splice(
			0,
			mockInternalRequestDetails.length,
			...structuredClone(internalDetails)
		);
		sessionStorage.clear();
		session.user.mockReturnValue(owner);
	});

	it.each([completed, canceled])('reabre %s e sincroniza as três projeções', async (protocol) => {
		const before = await tracking(protocol);
		const closureRef = await reference(protocol);
		expect(await reference(protocol)).toBe(closureRef);
		await expect(
			reopenRequestMock(protocol, { justification: 'Reavaliar', closureRef })
		).resolves.toEqual({
			protocol,
			statusId: 1,
			status: 'Solicitação enviada'
		});
		const after = await tracking(protocol);
		expect(after).toMatchObject({
			status: 'Solicitação enviada',
			canReopen: false,
			canCancel: false,
			attachments: before.attachments,
			openedAt: before.openedAt
		});
		expect(after.closureRef).toBeUndefined();
		expect(mockRequests.find((item) => item.protocol === protocol)).toMatchObject({
			status: 'Solicitação enviada',
			assigneeId: null,
			priority: null
		});
		expect(mockRequestDetails.find((item) => item.protocol === protocol)).toMatchObject({
			status: 'Solicitação enviada',
			meeting: null
		});
		expect(mockInternalRequestDetails.find((item) => item.protocol === protocol)).toMatchObject({
			status: 'Solicitação enviada',
			triage: null,
			assignee: null
		});
		await expect(
			reopenRequestMock(protocol, { justification: 'Repetição', closureRef })
		).rejects.toMatchObject({ status: 409, code: 'rf02_closure_conflict' });
	});

	it('nega a operação sem sessão, sem permissão ou sem titularidade direta', async () => {
		const closureRef = await reference(completed);
		const payload = { justification: 'Reavaliar', closureRef };
		session.user.mockReturnValue(null);
		await expect(reopenRequestMock(completed, payload)).rejects.toMatchObject({ status: 401 });
		session.user.mockReturnValue({ ...owner, permissions: [] });
		await expect(reopenRequestMock(completed, payload)).rejects.toMatchObject({ status: 403 });
		session.user.mockReturnValue({ ...owner, id: '3' });
		expect((await tracking(completed)).canReopen).toBe(false);
		await expect(reopenRequestMock(completed, payload)).rejects.toMatchObject({ status: 404 });
		await expect(reopenRequestMock('MAAT-XXXX-XXXX', payload)).rejects.toMatchObject({
			status: 404
		});
		session.user.mockReturnValue(owner);
		expect(await reference(completed)).toBe(closureRef);
	});

	it('rejeita justificativas inválidas e referência obsoleta sem mudar o status', async () => {
		const closureRef = await reference(canceled);
		for (const justification of [' ', 'a'.repeat(4001)]) {
			await expect(
				reopenRequestMock(canceled, { justification, closureRef })
			).rejects.toMatchObject({ status: 422 });
		}
		await expect(
			reopenRequestMock(canceled, { justification: 'Reavaliar', closureRef: crypto.randomUUID() })
		).rejects.toMatchObject({ status: 409 });
		expect((await tracking(canceled)).status).toBe('Cancelado');
	});
});
