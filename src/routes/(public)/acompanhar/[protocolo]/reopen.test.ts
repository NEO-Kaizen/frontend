import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import Page from './+page.svelte';
import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import type { SessionUser } from '$lib/types/auth';
import type {
	PublicRequestDetails,
	RequesterRequestDetails,
	TrackingDetailsResponse
} from '$lib/types/requester-tracking';
import { reopenRequest } from '$lib/services/requester-tracking.service';
import { MAX_JUSTIFICATION_LENGTH } from '$lib/utils/validations';

// Renderiza a página, modal, service, API e cliente HTTP reais. Somente o
// transporte HTTP e o destino dos toasts são substituídos. Nenhum banco.
const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_API_URL: 'http://rf02.invalid' } }));
vi.mock('$app/environment', async (original) => ({
	...(await original<typeof import('$app/environment')>()),
	browser: true
}));
vi.mock('$lib/mocks', () => ({ MOCK_DOMAINS: false }));
vi.mock('$lib/states/toast.svelte', () => ({ toastState: { add: mocks.toast } }));
// JSDOM não executa animações CSS; a validação visual usa Chromium.
vi.mock('svelte/transition', async (original) => ({
	...(await original<typeof import('svelte/transition')>()),
	fade: () => ({ duration: 0 }),
	fly: () => ({ duration: 0 })
}));

const A = 'MAAT-RF2A-AAA2';
const B = 'MAAT-RF2A-AAA3';
const REF_A = '11111111-1111-4111-8111-111111111111';
const REF_B = '22222222-2222-4222-8222-222222222222';
const owner: SessionUser = {
	id: '4',
	name: 'Pessoa fictícia',
	email: 'solicitante@example.invalid',
	avatarUrl: null,
	role: 'Solicitante',
	isRoot: false,
	mustChangePassword: false,
	permissions: [{ key: 'request:track', custody: 'own' }]
};
const date = '2026-11-25T12:00:00Z';
const impacts: PublicRequestDetails['impacts'] = {
	mainRisks: 'Riscos',
	clientImpact: 'Clientes',
	operationalImpact: 'Operação',
	perceivedCriticality: 'Baixa',
	desiredDeadline: date
};
function publicDetails(protocol: string): PublicRequestDetails {
	return {
		protocol,
		status: 'Concluído',
		openedAt: date,
		lastUpdate: date,
		meeting: null,
		lastTechnicalMessage: null,
		requester: {
			fullName: owner.name,
			area: 'Área fictícia',
			corporateEmail: owner.email,
			manager: 'Gestor'
		},
		demand: {
			title: `Demanda ${protocol}`,
			processName: 'Processo',
			requestType: 'Automação',
			category: 'Automação',
			description: 'Descrição',
			problem: 'Problema',
			justification: 'Motivo',
			expectedResult: 'Resultado'
		},
		impacts
	};
}
function tracking(
	protocol: string,
	overrides: Partial<RequesterRequestDetails> = {}
): TrackingDetailsResponse {
	return {
		mode: 'authenticated',
		details: {
			...publicDetails(protocol),
			canCancel: false,
			canReopen: true,
			closureRef: protocol === A ? REF_A : REF_B,
			operational: {
				...impacts,
				processDescription: 'Processo',
				processSteps: 'Etapas',
				systemsUsed: 'Sistema',
				executionFrequency: 'Diária',
				volumetry: '10',
				peopleInvolved: 1,
				averageExecutionTime: '1h',
				monthlyEffortHours: 10,
				hasManualControls: false
			},
			schedulePreferences: null,
			mappingDate: null,
			attachments: [],
			...overrides
		}
	};
}
function data(protocol = A, user: SessionUser | null = owner) {
	return {
		protocol,
		user,
		solicitationMode: 'PUBLIC' as const,
		portalConfig: DEFAULT_PORTAL_CONFIG
	};
}
function json(value: unknown, status = 200) {
	return new Response(JSON.stringify(value), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}
function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}
const records = new Map<string, TrackingDetailsResponse>();
const post = vi.fn<(protocol: string, init: RequestInit) => Promise<Response>>();
const read = vi.fn<(protocol: string) => Promise<Response>>();
const transport = vi.fn<typeof fetch>();
const reopenName = 'Reabrir solicitação';
const confirmName = 'Confirmar reabertura';
function success(protocol: string) {
	records.set(
		protocol,
		tracking(protocol, { status: 'Solicitação enviada', canReopen: false, closureRef: undefined })
	);
	return json({ protocol, statusId: 1, status: 'Solicitação enviada' });
}
async function open() {
	await fireEvent.click(await screen.findByRole('button', { name: reopenName }));
	return screen.findByRole('dialog', { name: reopenName });
}
async function reason(dialog: HTMLElement, value = '  Reavaliar solicitação.  ') {
	await fireEvent.input(within(dialog).getByLabelText('Justificativa da reabertura'), {
		target: { value }
	});
}
function confirm(dialog: HTMLElement) {
	return within(dialog).getByRole('button', { name: confirmName });
}
async function submit(dialog: HTMLElement) {
	// Submit real do formulário: não depende do suporte de navegação do JSDOM.
	const form = dialog.querySelector('form');
	if (!form) throw new Error('Formulário da RF02 ausente');
	await fireEvent.submit(form);
}
async function closed() {
	await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}

beforeEach(() => {
	vi.clearAllMocks();
	sessionStorage.clear();
	records.clear();
	records.set(A, tracking(A));
	records.set(B, tracking(B, { status: 'Cancelado' }));
	post.mockImplementation(async (protocol) => success(protocol));
	read.mockImplementation(async (protocol) => json(records.get(protocol)));
	transport.mockImplementation(async (input, init = {}) => {
		const url = new URL(String(input));
		if (url.origin !== 'http://rf02.invalid') throw new Error(`Origem inesperada: ${url.origin}`);
		const [, prefix, protocol, action] = url.pathname.split('/');
		if (prefix !== 'requests') throw new Error(`Rota inesperada: ${url.pathname}`);
		if (action === 'tracking' && !init.method) return read(protocol);
		if (action === 'pending-items' && !init.method)
			return json({ batchId: null, requestAttachment: false, items: [] });
		if (action === 'reopen' && init.method === 'POST') return post(protocol, init);
		if (action === 'public' && url.pathname.endsWith('/verify') && init.method === 'POST')
			return json({ protocol, canAccess: true });
		throw new Error(`Requisição inesperada: ${url.pathname} ${init.method}`);
	});
	vi.stubGlobal('fetch', transport);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	sessionStorage.clear();
});

describe('RF02 — acompanhamento e operação de reabertura', () => {
	it.each([{ canReopen: false }, { closureRef: undefined }])(
		'F01: oculta ação quando a capacidade ou referência está ausente (%j)',
		async (overrides) => {
			records.set(A, tracking(A, overrides));
			render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
			await screen.findByRole('heading', { name: `Demanda ${A}` });
			expect(screen.queryByRole('button', { name: reopenName })).not.toBeInTheDocument();
			expect(post).not.toHaveBeenCalled();
		}
	);

	it('F01: identidade pública não habilita a reabertura', async () => {
		records.set(A, { mode: 'public', details: publicDetails(A) });
		render(Page, {
			props: { data: data(A, null), params: { protocolo: data(A, null).protocol }, form: null }
		});
		await fireEvent.input(await screen.findByLabelText('Nome completo'), {
			target: { value: owner.name }
		});
		await fireEvent.input(screen.getByLabelText('E-mail corporativo'), {
			target: { value: owner.email }
		});
		const form = screen.getByLabelText('Nome completo').closest('form');
		if (!form) throw new Error('Formulário público ausente');
		await fireEvent.submit(form);
		await screen.findByRole('heading', { name: `Demanda ${A}` });
		expect(screen.queryByRole('button', { name: reopenName })).not.toBeInTheDocument();
		expect(post).not.toHaveBeenCalled();
	});

	it('F02/F03: exige confirmação, recusa vazio e aceita o limite após trim', async () => {
		render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
		const dialog = await open();
		expect(within(dialog).getByText(A)).toBeInTheDocument();
		expect(confirm(dialog)).toBeDisabled();
		await submit(dialog);
		await reason(dialog, '   ');
		expect(confirm(dialog)).toBeDisabled();
		await submit(dialog);
		await reason(dialog, 'a'.repeat(MAX_JUSTIFICATION_LENGTH + 1));
		expect(confirm(dialog)).toBeDisabled();
		expect(within(dialog).getByRole('alert')).toHaveTextContent('4.000');
		await submit(dialog);
		expect(post).not.toHaveBeenCalled();
		await reason(dialog, ` ${'a'.repeat(MAX_JUSTIFICATION_LENGTH)} `);
		expect(confirm(dialog)).toBeEnabled();
		await submit(dialog);
		await closed();
		expect(JSON.parse(String(post.mock.calls[0][1].body))).toEqual({
			justification: 'a'.repeat(MAX_JUSTIFICATION_LENGTH),
			closureRef: REF_A
		});
	});

	it.each([A, B])('F04/F05: envia POST e atualiza o acompanhamento de %s', async (protocol) => {
		render(Page, {
			props: { data: data(protocol), params: { protocolo: data(protocol).protocol }, form: null }
		});
		const dialog = await open();
		await reason(dialog);
		await submit(dialog);
		await closed();
		await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
		expect(post).toHaveBeenCalledTimes(1);
		const [sentProtocol, init] = post.mock.calls[0];
		expect(sentProtocol).toBe(protocol);
		expect(init).toMatchObject({ method: 'POST', credentials: 'include' });
		expect(JSON.parse(String(init.body))).toEqual({
			justification: 'Reavaliar solicitação.',
			closureRef: protocol === A ? REF_A : REF_B
		});
		await screen.findByText('Solicitação enviada', { exact: true });
		expect(screen.queryByRole('button', { name: reopenName })).not.toBeInTheDocument();
		expect(mocks.toast).toHaveBeenCalledWith('Solicitação reaberta com sucesso.', 'success');
	});

	it('F06: conflito 409 descarta a confirmação e exige nova referência', async () => {
		post.mockImplementationOnce(async () => {
			records.set(A, tracking(A, { closureRef: REF_B }));
			return json({ message: 'Conflito', code: 'rf02_closure_conflict' }, 409);
		});
		render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
		const dialog = await open();
		await reason(dialog);
		await submit(dialog);
		await closed();
		expect(mocks.toast).toHaveBeenCalledWith(
			expect.stringContaining('O encerramento mudou'),
			'error'
		);
		const fresh = await open();
		expect(within(fresh).getByLabelText('Justificativa da reabertura')).toHaveValue('');
		await reason(fresh);
		await submit(fresh);
		await closed();
		expect(JSON.parse(String(post.mock.calls[1][1].body)).closureRef).toBe(REF_B);
	});

	it.each([401, 403, 404])(
		'F07: erro de acesso %s retira dados e ações da interface',
		async (status) => {
			post.mockResolvedValueOnce(json({ message: 'Acesso indisponível.' }, status));
			render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
			const dialog = await open();
			await reason(dialog);
			await submit(dialog);
			await closed();
			expect(screen.queryByRole('heading', { name: `Demanda ${A}` })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: reopenName })).not.toBeInTheDocument();
			expect(read).toHaveBeenCalledTimes(1);
		}
	);

	it('F08: 422 mantém o modal e permite corrigir a justificativa', async () => {
		post.mockResolvedValueOnce(json({ message: 'Justificativa recusada.' }, 422));
		render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
		const dialog = await open();
		await reason(dialog, 'Primeira tentativa');
		await submit(dialog);
		expect(await within(dialog).findByRole('alert')).toHaveTextContent('Justificativa recusada.');
		expect(within(dialog).getByLabelText('Justificativa da reabertura')).toHaveValue(
			'Primeira tentativa'
		);
		await reason(dialog, 'Justificativa corrigida');
		await submit(dialog);
		await closed();
		expect(post).toHaveBeenCalledTimes(2);
	});

	it('F09: bloqueia segundo submit enquanto o POST está pendente', async () => {
		const gate = deferred<Response>();
		post.mockReturnValueOnce(gate.promise);
		render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
		const dialog = await open();
		await reason(dialog);
		try {
			await submit(dialog);
			expect(within(dialog).getByRole('button', { name: 'Reabrindo…' })).toBeDisabled();
			await submit(dialog);
			expect(post).toHaveBeenCalledTimes(1);
		} finally {
			gate.resolve(success(A));
		}
		await closed();
	});

	it('F10: resposta atrasada do POST de A não altera o acompanhamento de B', async () => {
		const gate = deferred<Response>();
		post.mockReturnValueOnce(gate.promise);
		const { rerender } = render(Page, {
			props: { data: data(), params: { protocolo: data().protocol }, form: null }
		});
		const dialog = await open();
		await reason(dialog);
		try {
			await submit(dialog);
			await rerender({ data: data(B) });
			await screen.findByRole('heading', { name: `Demanda ${B}` });
			await closed();
		} finally {
			gate.resolve(success(A));
		}
		await gate.promise;
		await tick();
		await new Promise<void>((done) => setTimeout(done, 0));
		expect(screen.getByRole('heading', { name: `Demanda ${B}` })).toBeInTheDocument();
		expect(screen.getByText('Cancelado', { exact: true })).toBeInTheDocument();
		expect(mocks.toast).not.toHaveBeenCalled();
		const fresh = await open();
		expect(within(fresh).getByText(B)).toBeInTheDocument();
		await reason(fresh);
		await submit(fresh);
		await closed();
		expect(post.mock.calls.map(([protocol]) => protocol)).toEqual([A, B]);
	});

	it('F11: falha de comunicação bloqueia nova operação até revalidar', async () => {
		post.mockRejectedValueOnce(new TypeError('Rede indisponível'));
		render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
		const dialog = await open();
		read.mockRejectedValueOnce(new TypeError('Rede indisponível'));
		await reason(dialog);
		await submit(dialog);
		await closed();
		const retry = await screen.findByRole('button', { name: 'Atualizar acompanhamento' });
		expect(screen.queryByRole('button', { name: reopenName })).not.toBeInTheDocument();
		await fireEvent.click(retry);
		await screen.findByRole('button', { name: reopenName });
		expect(post).toHaveBeenCalledTimes(1);
	});

	it('F12: Escape fecha a confirmação sem enviar o POST', async () => {
		render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
		const dialog = await open();
		await reason(dialog);
		await fireEvent.keyDown(window, { key: 'Escape' });
		await closed();
		expect(post).not.toHaveBeenCalled();
	});

	it('F13: mantém as classes de cancelamento aprovadas e não permite reabrir ativo', async () => {
		records.set(
			A,
			tracking(A, {
				status: 'Solicitação enviada',
				canCancel: true,
				canReopen: false,
				closureRef: undefined
			})
		);
		render(Page, { props: { data: data(), params: { protocolo: data().protocol }, form: null } });
		const cancel = await screen.findByRole('button', { name: 'Cancelar solicitação' });
		expect(cancel).toHaveClass('cancel-trigger');
		expect(cancel.closest('.right-status')).toHaveClass('has-cancel');
		expect(cancel.querySelector('.material-symbols-outlined')).not.toBeNull();
		expect(screen.queryByRole('button', { name: reopenName })).not.toBeInTheDocument();
		await fireEvent.click(cancel);
		const dialog = await screen.findByRole('dialog', { name: 'Cancelar solicitação' });
		expect(within(dialog).getByRole('button', { name: 'Confirmar cancelamento' })).toHaveClass(
			'cancel-confirm'
		);
	});

	it('service: justificativa inválida não alcança o transporte HTTP', async () => {
		for (const justification of [' ', 'a'.repeat(MAX_JUSTIFICATION_LENGTH + 1)]) {
			await expect(reopenRequest(A, { justification, closureRef: REF_A })).resolves.toMatchObject({
				ok: false,
				error: { status: 422 }
			});
		}
		expect(transport).not.toHaveBeenCalled();
	});
});
