import {
	expect,
	request,
	type APIRequestContext,
	type Browser,
	type BrowserContext,
	type Page
} from '@playwright/test';

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

export const PROTOCOLS = {
	/** Request 1 — Fabio Solicitante, com Responsável e Agendamento no seed. */
	requester: 'MAAT-8K3P-9X2M',
	/** Request 3 — Solicitante Teste, sem Responsável no seed. */
	lifecycle: 'MAAT-2R7Q-4M1C'
} as const;

export const SEED_STATE = {
	requesterRequestStatus: 'Mapeamento agendado',
	lifecycleRequestStatus: 'Solicitação enviada',
	mappingTargetName: 'Mapeamento agendado',
	unassignedNotice: 'Sem responsável designado'
} as const;

export const USERS = {
	admin: { email: 'administrador_teste@email.com', path: '/home' },
	analyst: { email: 'analista_teste@email.com', path: '/home' },
	requester: { email: 'fabio.solicitante@email.com', path: '/' },
	pendingRequester: { email: 'solicitante_teste@email.com', path: '/' }
} as const;

export type UserKey = keyof typeof USERS;

/** Eventos emitidos pela v1 do RF20 (issue #156). */
export const EXPECTED_EVENT_TYPES = [
	'status_changed',
	'pending_item_created',
	'pending_item_reopened',
	'pending_item_validated',
	'pending_item_responded',
	'pending_item_responded_unassigned',
	'responsible_assigned',
	'mapping_scheduled'
] as const;

export type NotificationItem = {
	id: string;
	type: string;
	payload: Record<string, unknown>;
	createdAt: string;
	readAt: string | null;
};

export type PortalStatus = {
	id: number;
	name: string;
	isActive: boolean;
	isPublic: boolean;
	isRestricted: boolean;
	isTerminal: boolean;
	mappingMode: string;
	triageMode: string;
};

export type InternalRequest = {
	status: string;
	assignee: { id: string; name: string; email: string } | null;
	mappingAssignee: { id: string; name: string; email: string } | null;
};

export type PendingItem = {
	id: string;
	batchId: string;
	type: 'field_edit' | 'observation';
	status: 'requested' | 'responded' | 'validated';
	field: { fieldKey: string; currentValue: string | number | boolean | null } | null;
};

type PayloadRule = { allowed: readonly string[]; required: readonly string[] };

const BASE_KEYS = ['type', 'protocol', 'title'] as const;

/**
 * Allowlist por Evento, espelhando `notificationEvents.ts` do backend.
 * `required` é verificado além da ausência de campos extras: um payload
 * incompleto (ex.: `responsible_assigned` sem `status`) também falha.
 */
const NOTIFICATION_RULES: Record<string, PayloadRule> = {
	status_changed: {
		allowed: [...BASE_KEYS, 'newStatus'],
		required: ['newStatus']
	},
	mapping_scheduled: {
		allowed: [...BASE_KEYS, 'scheduledAt'],
		required: ['scheduledAt']
	},
	responsible_assigned: {
		allowed: [...BASE_KEYS, 'category', 'status'],
		required: ['category', 'status']
	},
	pending_item_created: { allowed: BASE_KEYS, required: [] },
	pending_item_reopened: { allowed: BASE_KEYS, required: [] },
	pending_item_validated: { allowed: BASE_KEYS, required: [] },
	pending_item_responded: { allowed: BASE_KEYS, required: [] },
	pending_item_responded_unassigned: {
		allowed: [...BASE_KEYS, 'notice'],
		required: ['notice']
	}
};

function seedPassword(): string {
	const password = process.env.E2E_PASSWORD;

	if (!password) {
		throw new Error('Defina E2E_PASSWORD (senha fictícia dos usuários do seed).');
	}

	return password;
}

export async function loginApi(email: string): Promise<APIRequestContext> {
	const api = await request.newContext({ baseURL: API_URL });
	const response = await api.post('/auth/login', {
		data: { email, password: seedPassword() }
	});

	expect(
		response.ok(),
		`Login API de ${email}: ${response.status()} ${await response.text()}`
	).toBeTruthy();

	return api;
}

/**
 * Autentica a `page` sem navegar: o cookie de sessão fica no contexto do
 * navegador e o teste escolhe quando abrir a rota. Útil quando a rota precisa
 * observar estados de carregamento antes de liberar as requisições da API.
 */
export async function loginOnPage(page: Page, key: UserKey): Promise<void> {
	const response = await page.request.post(`${API_URL}/auth/login`, {
		data: { email: USERS[key].email, password: seedPassword() }
	});

	expect(
		response.ok(),
		`Login de ${USERS[key].email}: ${response.status()} ${await response.text()}`
	).toBeTruthy();
}

export async function loginPage(page: Page, key: UserKey): Promise<void> {
	await loginOnPage(page, key);

	await page.goto(USERS[key].path);
	await waitForBell(page);
}

export async function openPage(
	browser: Browser,
	key: UserKey
): Promise<{ context: BrowserContext; page: Page }> {
	const context = await browser.newContext();
	const page = await context.newPage();

	await loginPage(page, key);

	return { context, page };
}

export function bell(page: Page) {
	return page.locator('.notification-bell');
}

export function notificationCenter(page: Page) {
	return page.getByRole('dialog', { name: 'Centro de notificações' });
}

export async function waitForBell(page: Page): Promise<void> {
	const element = bell(page);

	await expect(element).toBeVisible({ timeout: 10_000 });
	await expect(element).toHaveAttribute('aria-label', /^Notificações: /, { timeout: 10_000 });
}

function unreadFromLabel(label: string | null): number {
	if (!label) throw new Error('Sino sem aria-label.');

	if (label.includes('nenhuma não lida')) return 0;

	const match = label.match(/Notificações: (\d+) não lida/);

	if (!match) throw new Error(`Contador do sino ainda não está disponível: ${label}`);

	return Number(match[1]);
}

export async function readUnread(page: Page): Promise<number> {
	await waitForBell(page);

	return unreadFromLabel(await bell(page).getAttribute('aria-label'));
}

/**
 * O limite do RF20 é de 5s desde o commit. Medimos desde o início da
 * requisição de mutação — um limite superior para o commit, portanto mais
 * rigoroso do que esperar a resposta da API e só então começar a contar.
 */
export function latencyBudget(startedAt: number): number {
	const remaining = 5_000 - (Date.now() - startedAt);

	expect(
		remaining,
		'A mutação excedeu o limite de 5s do RF20; o SSE não pode ser avaliado.'
	).toBeGreaterThan(0);

	return remaining;
}

export async function waitForCount(page: Page, expected: number, timeout = 5_000): Promise<void> {
	if (expected === 0) {
		await expect(bell(page)).toHaveAttribute('aria-label', /^Notificações: nenhuma não lida/, {
			timeout
		});
		return;
	}

	await expect(bell(page)).toHaveAttribute(
		'aria-label',
		new RegExp(`^Notificações: ${expected} não lida`),
		{ timeout }
	);
}

export async function waitForUnread(
	page: Page,
	expected: number,
	startedAt: number
): Promise<void> {
	await waitForCount(page, expected, latencyBudget(startedAt));
}

export async function listNotifications(api: APIRequestContext): Promise<NotificationItem[]> {
	const collected: NotificationItem[] = [];
	let cursor: string | null = null;

	do {
		const query = new URLSearchParams({ limit: '50' });

		if (cursor) query.set('cursor', cursor);

		const response = await api.get(`${API_URL}/notifications?${query.toString()}`);

		expect(
			response.ok(),
			`Listagem de notificações: ${response.status()} ${await response.text()}`
		).toBeTruthy();

		const data = (await response.json()) as {
			items: NotificationItem[];
			nextCursor: string | null;
		};

		expect(Array.isArray(data.items)).toBeTruthy();
		collected.push(...data.items);
		cursor = data.nextCursor;
	} while (cursor !== null);

	return collected;
}

export async function getUnreadCount(api: APIRequestContext): Promise<number> {
	const response = await api.get(`${API_URL}/notifications/unread-count`);

	expect(response.ok(), `Contador não lido: ${response.status()}`).toBeTruthy();

	return ((await response.json()) as { unreadCount: number }).unreadCount;
}

export function assertPayload(item: NotificationItem): void {
	const rule = NOTIFICATION_RULES[item.type];

	if (!rule) {
		throw new Error(`Tipo de Evento inesperado na matriz RF20: ${item.type}`);
	}

	expect(item.id).toBeTruthy();
	expect(item.payload.type).toBe(item.type);
	expect(item.payload.protocol).toEqual(expect.any(String));
	expect(item.payload.title).toEqual(expect.any(String));

	const allowed = new Set(rule.allowed);

	for (const key of Object.keys(item.payload)) {
		expect(allowed.has(key), `Campo fora da Allowlist: ${key} (${item.type})`).toBeTruthy();
	}

	for (const key of rule.required) {
		expect(item.payload[key], `Campo obrigatório ausente: ${key} (${item.type})`).toEqual(
			expect.any(String)
		);
	}
}

export function freshNotifications(
	before: NotificationItem[],
	after: NotificationItem[]
): NotificationItem[] {
	const known = new Set(before.map((item) => item.id));

	return after.filter((item) => !known.has(item.id));
}

export async function getInternalRequest(
	api: APIRequestContext,
	protocol: string
): Promise<InternalRequest> {
	const response = await api.get(`${API_URL}/requests/${protocol}/internal`);

	expect(
		response.ok(),
		`Detalhe interno de ${protocol}: ${response.status()} ${await response.text()}`
	).toBeTruthy();

	return (await response.json()) as InternalRequest;
}

export async function getPortalStatuses(api: APIRequestContext): Promise<PortalStatus[]> {
	const response = await api.get(`${API_URL}/portal-config`);

	expect(response.ok(), `Portal config: ${response.status()}`).toBeTruthy();

	const data = (await response.json()) as { statuses: PortalStatus[] };

	return data.statuses;
}

export function selectStatus(statuses: PortalStatus[], current: string): PortalStatus {
	const target = statuses.find(
		(status) =>
			status.isActive &&
			status.isPublic &&
			!status.isRestricted &&
			!status.isTerminal &&
			status.name !== current
	);

	if (!target) {
		throw new Error(`Nenhum Status público e elegível para sair de "${current}".`);
	}

	return target;
}

export function selectMappingStatus(statuses: PortalStatus[]): PortalStatus {
	const target = statuses.find(
		(status) =>
			status.name === SEED_STATE.mappingTargetName &&
			status.mappingMode === 'conclusion_only' &&
			!status.isRestricted
	);

	if (!target) {
		throw new Error('Status "Mapeamento agendado" não encontrado no seed.');
	}

	return target;
}

export async function changeStatus(
	api: APIRequestContext,
	protocol: string,
	target: PortalStatus
): Promise<void> {
	const response = await api.patch(`${API_URL}/requests/${protocol}/status`, {
		data: {
			targetStatus: target.id,
			justification: 'Teste E2E RF20 em base descartável.',
			lastTechnicalMessage: 'Atualização fictícia de teste.'
		}
	});

	expect(
		response.ok(),
		`PATCH status de ${protocol}: ${response.status()} ${await response.text()}`
	).toBeTruthy();
}

export async function assignAnalyst(
	api: APIRequestContext,
	protocol: string,
	data: { assigneeId?: string | null; mappingAssigneeId?: string | null }
): Promise<void> {
	const response = await api.patch(`${API_URL}/requests/${protocol}/internal/assignee`, {
		data
	});

	expect(
		response.ok(),
		`Designação de ${protocol}: ${response.status()} ${await response.text()}`
	).toBeTruthy();
}

export async function getUserId(api: APIRequestContext): Promise<string> {
	const response = await api.get(`${API_URL}/auth/me`);

	expect(response.ok(), `Sessão: ${response.status()}`).toBeTruthy();

	return ((await response.json()) as { id: string }).id;
}

export async function getPendingItems(
	api: APIRequestContext,
	protocol: string
): Promise<{ batchId: string | null; requestAttachment: boolean; items: PendingItem[] }> {
	const response = await api.get(`${API_URL}/requests/${protocol}/pending-items`);

	expect(
		response.ok(),
		`Pendências de ${protocol}: ${response.status()} ${await response.text()}`
	).toBeTruthy();

	return (await response.json()) as {
		batchId: string | null;
		requestAttachment: boolean;
		items: PendingItem[];
	};
}

export async function openPendingBatch(
	api: APIRequestContext,
	protocol: string
): Promise<{ batchId: string; items: PendingItem[] }> {
	const pending = await getPendingItems(api, protocol);
	const open = pending.items.filter((item) => item.status !== 'validated');

	expect(open.length, 'O cenário deve ter um lote aberto.').toBeGreaterThan(0);

	const batchIds = new Set(open.map((item) => item.batchId));

	expect(batchIds.size, 'O cenário deve ter um único lote aberto.').toBe(1);

	return { batchId: open[0].batchId, items: open };
}

function correctedValueFor(item: PendingItem): string | number | boolean {
	const current = item.field?.currentValue;

	if (typeof current === 'string') return `${current} — E2E`;
	if (typeof current === 'number' || typeof current === 'boolean') return current;

	return 'Título corrigido no E2E';
}

export async function answerPendingItems(
	publicApi: APIRequestContext,
	protocol: string,
	items: PendingItem[]
): Promise<{ startedAt: number; answered: number }> {
	let startedAt = Date.now();
	let answered = 0;

	for (const item of items) {
		if (item.status !== 'requested') continue;

		if (answered === 0) startedAt = Date.now();

		const data =
			item.type === 'field_edit'
				? { correctedValue: correctedValueFor(item) }
				: { response: 'Resposta fictícia do E2E RF20.' };

		const response = await publicApi.patch(
			`${API_URL}/requests/${protocol}/pending-items/${item.id}`,
			{ data }
		);

		expect(
			response.ok(),
			`Resposta da pendência ${item.id}: ${response.status()} ${await response.text()}`
		).toBeTruthy();

		answered += 1;
	}

	return { startedAt, answered };
}

type ReviewDecision =
	| { id: string; decision: 'validate' }
	| {
			id: string;
			decision: 'reopen';
			comment: string;
	  };

async function reviewPendingBatch(
	api: APIRequestContext,
	protocol: string,
	batchId: string,
	items: PendingItem[],
	buildDecision: (id: string) => ReviewDecision
): Promise<void> {
	const response = await api.patch(`${API_URL}/requests/${protocol}/pending-items/review`, {
		data: {
			batchId,
			items: items.map((item) => buildDecision(item.id))
		}
	});

	expect(
		response.ok(),
		`Revisão do lote ${batchId}: ${response.status()} ${await response.text()}`
	).toBeTruthy();
}

export async function validatePendingBatch(
	api: APIRequestContext,
	protocol: string,
	batchId: string,
	items: PendingItem[]
): Promise<void> {
	await reviewPendingBatch(api, protocol, batchId, items, (id) => ({
		id,
		decision: 'validate'
	}));
}

export async function reopenPendingBatch(
	api: APIRequestContext,
	protocol: string,
	batchId: string,
	items: PendingItem[],
	comment: string
): Promise<void> {
	await reviewPendingBatch(api, protocol, batchId, items, (id) => ({
		id,
		decision: 'reopen',
		comment
	}));
}

export async function createPendingItem(
	api: APIRequestContext,
	protocol: string,
	comment: string
): Promise<{ batchId: string; items: PendingItem[] }> {
	// Um único item mantém a relação 1 resposta → 1 Notificação. O lote com
	// observação + campo geraria duas Notificações ao responsável.
	const response = await api.post(`${API_URL}/requests/${protocol}/pending-items`, {
		data: {
			requestAttachment: false,
			items: [{ fieldKey: 'demand.title', comment }]
		}
	});

	expect(
		response.ok(),
		`Criação de pendência: ${response.status()} ${await response.text()}`
	).toBeTruthy();

	return (await response.json()) as { batchId: string; items: PendingItem[] };
}

export async function publicRequesterApi(
	admin: APIRequestContext,
	protocol: string
): Promise<APIRequestContext> {
	const detailResponse = await admin.get(`${API_URL}/requests/${protocol}/internal`);

	expect(
		detailResponse.ok(),
		`Detalhe de ${protocol}: ${detailResponse.status()} ${await detailResponse.text()}`
	).toBeTruthy();

	const detail = (await detailResponse.json()) as {
		requester?: { fullName?: string; corporateEmail?: string };
	};
	const name = detail.requester?.fullName;
	const email = detail.requester?.corporateEmail;

	if (!name || !email) {
		throw new Error('Solicitante da solicitação não encontrado para a identidade pública.');
	}

	return request.newContext({
		baseURL: API_URL,
		extraHTTPHeaders: {
			'X-Requester-Identity': JSON.stringify({ name, email })
		}
	});
}

export async function completeMapping(
	api: APIRequestContext,
	protocol: string,
	targetStatus: number,
	scheduledFor: string
): Promise<void> {
	const response = await api.put(`${API_URL}/queue/requests/${protocol}/mapping`, {
		data: {
			completeMapping: true,
			targetStatus,
			scheduledFor,
			durationMinutes: 30,
			modality: 'IN_PERSON',
			location: 'Sala fictícia de validação E2E',
			participants: [],
			justification: 'Agendamento gerado exclusivamente na base descartável E2E.'
		}
	});

	expect(
		response.ok(),
		`Agendamento de ${protocol}: ${response.status()} ${await response.text()}`
	).toBeTruthy();
}
