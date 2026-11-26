import { expect, test } from '@playwright/test';
import {
	EXPECTED_EVENT_TYPES,
	PROTOCOLS,
	SEED_STATE,
	USERS,
	answerPendingItems,
	assertPayload,
	assignAnalyst,
	bell,
	changeStatus,
	completeMapping,
	createPendingItem,
	freshNotifications,
	getInternalRequest,
	getPortalStatuses,
	getUnreadCount,
	getUserId,
	listNotifications,
	loginApi,
	loginPage,
	notificationCenter,
	openPage,
	openPendingBatch,
	publicRequesterApi,
	readUnread,
	reopenPendingBatch,
	selectMappingStatus,
	selectStatus,
	validatePendingBatch,
	waitForCount,
	waitForUnread
} from './support/rf20';

/**
 * Suíte E2E do RF20 com API real e massa fictícia do seed.
 *
 * Pré-requisito: banco descartável recém-semeado. Os testes são seriais porque
 * compartilham o estado das solicitações 1 e 3; a guarda do beforeAll falha com
 * instrução de reset quando a massa não está no estado esperado.
 */
test.describe.serial('RF20 — Notificações in-app (seed descartável)', () => {
	test.beforeAll(async () => {
		const admin = await loginApi(USERS.admin.email);

		try {
			const requesterRequest = await getInternalRequest(admin, PROTOCOLS.requester);
			const lifecycleRequest = await getInternalRequest(admin, PROTOCOLS.lifecycle);

			expect(
				requesterRequest.status,
				`Massa E2E fora do estado do seed: ${PROTOCOLS.requester} deveria estar em "${SEED_STATE.requesterRequestStatus}". Restaure com "npm run seed:run" no backend.`
			).toBe(SEED_STATE.requesterRequestStatus);

			expect(
				lifecycleRequest.status,
				`Massa E2E fora do estado do seed: ${PROTOCOLS.lifecycle} deveria estar em "${SEED_STATE.lifecycleRequestStatus}". Restaure com "npm run seed:run" no backend.`
			).toBe(SEED_STATE.lifecycleRequestStatus);

			expect(
				lifecycleRequest.assignee,
				`Massa E2E fora do estado do seed: ${PROTOCOLS.lifecycle} não deveria ter Responsável. Restaure com "npm run seed:run" no backend.`
			).toBeNull();
		} finally {
			await admin.dispose();
		}
	});

	test('matriz: todos os Eventos do RF20 têm Notificação e Payload na Allowlist', async () => {
		const users = Object.values(USERS);
		const apis = await Promise.all(users.map((user) => loginApi(user.email)));

		try {
			const pages = await Promise.all(apis.map((api) => listNotifications(api)));
			const all = pages.flat();

			for (const item of all) assertPayload(item);

			const types = new Set(all.map((item) => item.type));

			for (const type of EXPECTED_EVENT_TYPES) {
				expect(types.has(type), `Seed não produziu o Evento ${type}`).toBeTruthy();
			}

			for (const [index, api] of apis.entries()) {
				const unread = pages[index].filter((item) => item.readAt === null).length;

				expect(
					await getUnreadCount(api),
					`Contador não lido de ${users[index].email} não bate com a lista`
				).toBe(unread);
			}
		} finally {
			await Promise.all(apis.map((api) => api.dispose()));
		}
	});

	test('status_changed: notifica o solicitante em até 5s e respeita a Allowlist', async ({
		page
	}) => {
		await loginPage(page, 'requester');

		const before = await readUnread(page);
		const old = await listNotifications(page.request);
		const admin = await loginApi(USERS.admin.email);

		try {
			const current = await getInternalRequest(admin, PROTOCOLS.requester);
			const target = selectStatus(await getPortalStatuses(admin), current.status);
			const startedAt = Date.now();

			await changeStatus(admin, PROTOCOLS.requester, target);
			await waitForUnread(page, before + 1, startedAt);

			const fresh = freshNotifications(old, await listNotifications(page.request));
			const changed = fresh.filter(
				(item) => item.type === 'status_changed' && item.payload.protocol === PROTOCOLS.requester
			);

			expect(changed).toHaveLength(1);
			changed.forEach(assertPayload);
			expect(changed[0].payload.newStatus).toBe(target.name);
		} finally {
			await admin.dispose();
		}
	});

	test('Centro: abrir não marca; clique marca e navega', async ({ page }) => {
		await loginPage(page, 'requester');

		const before = await readUnread(page);
		const items = await listNotifications(page.request);
		const unreadStatus = items.find(
			(item) =>
				item.type === 'status_changed' &&
				item.payload.protocol === PROTOCOLS.requester &&
				item.readAt === null
		);

		if (!unreadStatus) {
			throw new Error('O teste anterior deveria deixar uma notificação de status não lida.');
		}

		const newStatus = String(unreadStatus.payload.newStatus);

		await bell(page).click();

		const center = notificationCenter(page);

		await expect(center).toBeVisible();
		expect(await readUnread(page)).toBe(before);

		const card = center.getByRole('button', {
			name: new RegExp(`Não lida: ${PROTOCOLS.requester}.*Novo status: ${newStatus}`)
		});

		await expect(card).toBeVisible();
		await card.click();

		await expect(page).toHaveURL(new RegExp(`/acompanhar/${PROTOCOLS.requester}`));
		await waitForCount(page, before - 1);

		const after = await listNotifications(page.request);

		expect(after.find((item) => item.id === unreadStatus.id)?.readAt).not.toBeNull();
	});

	test('Reconexão: replay não duplica a Notificação', async ({ page, context }) => {
		const requesterApi = await loginApi(USERS.requester.email);
		const admin = await loginApi(USERS.admin.email);
		const streamPattern = '**/notifications/stream*';

		try {
			await loginPage(page, 'requester');

			const before = await readUnread(page);
			const old = await listNotifications(requesterApi);
			const current = await getInternalRequest(admin, PROTOCOLS.requester);
			const target = selectStatus(await getPortalStatuses(admin), current.status);

			// `setOffline` não derruba um EventSource já aberto: o navegador pode
			// manter a conexão até o keep-alive seguinte. Bloquear a rota do stream
			// e recarregar garante que o cliente fique realmente desconectado, com a
			// âncora (`lastEventId`) vinda do snapshot da página.
			await context.route(streamPattern, (route) => route.abort('failed'));
			await page.reload();
			await expect(bell(page)).toBeVisible();
			await expect(
				bell(page),
				'O SSE deveria cair quando a rota do stream é bloqueada.'
			).toHaveAttribute('aria-label', /^Notificações indisponíveis/, { timeout: 10_000 });

			await changeStatus(admin, PROTOCOLS.requester, target);
			await context.unroute(streamPattern);

			// A entrega fica bloqueada durante a desconexão simulada; o limite de
			// 5s vale para o cliente conectado, então a reconexão usa 20s.
			await waitForCount(page, before + 1, 20_000);

			const fresh = freshNotifications(old, await listNotifications(requesterApi)).filter(
				(item) => item.type === 'status_changed' && item.payload.protocol === PROTOCOLS.requester
			);

			expect(fresh).toHaveLength(1);
			expect(fresh[0].payload.newStatus).toBe(target.name);
			assertPayload(fresh[0]);

			await bell(page).click();

			const center = notificationCenter(page);

			await expect(center).toBeVisible();
			await expect(
				center.getByRole('button', {
					name: new RegExp(`Não lida: ${PROTOCOLS.requester}.*Novo status: ${target.name}`)
				})
			).toHaveCount(1);
		} finally {
			await context.unroute(streamPattern);
			await requesterApi.dispose();
			await admin.dispose();
		}
	});

	test('Marcar todas: persiste após reload', async ({ page }) => {
		await loginPage(page, 'requester');

		const before = await readUnread(page);

		expect(before).toBeGreaterThan(0);

		await bell(page).click();

		const center = notificationCenter(page);

		await expect(center).toBeVisible();
		await center.getByRole('button', { name: 'Marcar todas como lidas' }).click();
		await waitForCount(page, 0);
		await page.reload();
		await waitForCount(page, 0, 10_000);

		expect(await getUnreadCount(page.request)).toBe(0);
	});

	test('responsible_assigned: notifica o analista em até 5s', async ({ page }) => {
		await loginPage(page, 'analyst');

		const before = await readUnread(page);
		const old = await listNotifications(page.request);
		const analystId = await getUserId(page.request);
		const admin = await loginApi(USERS.admin.email);

		try {
			const startedAt = Date.now();

			await assignAnalyst(admin, PROTOCOLS.lifecycle, { assigneeId: analystId });
			await waitForUnread(page, before + 1, startedAt);

			const fresh = freshNotifications(old, await listNotifications(page.request));
			const assigned = fresh.filter(
				(item) =>
					item.type === 'responsible_assigned' && item.payload.protocol === PROTOCOLS.lifecycle
			);

			expect(assigned).toHaveLength(1);
			assigned.forEach(assertPayload);

			const category = String(assigned[0].payload.category);
			const status = String(assigned[0].payload.status);

			await bell(page).click();

			const center = notificationCenter(page);

			await expect(center).toBeVisible();
			await expect(
				center.locator('.notification-card').filter({ hasText: PROTOCOLS.lifecycle })
			).toContainText(`Responsável designado · ${category} · ${status}`);
		} finally {
			await admin.dispose();
		}
	});

	test('pending_item_responded: resposta do lote do seed notifica o responsável em até 5s', async ({
		page
	}) => {
		const admin = await loginApi(USERS.admin.email);
		const publicApi = await publicRequesterApi(admin, PROTOCOLS.lifecycle);

		try {
			await loginPage(page, 'analyst');

			const before = await readUnread(page);
			const old = await listNotifications(page.request);
			const batch = await openPendingBatch(admin, PROTOCOLS.lifecycle);
			const { startedAt, answered } = await answerPendingItems(
				publicApi,
				PROTOCOLS.lifecycle,
				batch.items
			);

			expect(answered).toBeGreaterThan(0);
			await waitForUnread(page, before + 1, startedAt);

			const fresh = freshNotifications(old, await listNotifications(page.request));
			const responded = fresh.filter(
				(item) =>
					item.type === 'pending_item_responded' && item.payload.protocol === PROTOCOLS.lifecycle
			);

			expect(responded).toHaveLength(1);
			responded.forEach(assertPayload);
			await validatePendingBatch(admin, PROTOCOLS.lifecycle, batch.batchId, batch.items);
		} finally {
			await admin.dispose();
			await publicApi.dispose();
		}
	});

	test('pending_item_created: criação notifica o solicitante em até 5s', async ({ page }) => {
		await loginPage(page, 'pendingRequester');

		const before = await readUnread(page);
		const old = await listNotifications(page.request);
		const admin = await loginApi(USERS.admin.email);

		try {
			const startedAt = Date.now();

			await createPendingItem(
				admin,
				PROTOCOLS.lifecycle,
				'Verificação E2E da criação de Pendência.'
			);
			await waitForUnread(page, before + 1, startedAt);

			const fresh = freshNotifications(old, await listNotifications(page.request));
			const created = fresh.filter(
				(item) =>
					item.type === 'pending_item_created' && item.payload.protocol === PROTOCOLS.lifecycle
			);

			expect(created).toHaveLength(1);
			created.forEach(assertPayload);
		} finally {
			await admin.dispose();
		}
	});

	test('pending_item_responded: resposta do lote criado notifica o responsável em até 5s', async ({
		page
	}) => {
		const admin = await loginApi(USERS.admin.email);
		const publicApi = await publicRequesterApi(admin, PROTOCOLS.lifecycle);

		try {
			await loginPage(page, 'analyst');

			const before = await readUnread(page);
			const old = await listNotifications(page.request);
			const batch = await openPendingBatch(admin, PROTOCOLS.lifecycle);
			const { startedAt, answered } = await answerPendingItems(
				publicApi,
				PROTOCOLS.lifecycle,
				batch.items
			);

			expect(answered).toBeGreaterThan(0);
			await waitForUnread(page, before + 1, startedAt);

			const fresh = freshNotifications(old, await listNotifications(page.request));
			const responded = fresh.filter(
				(item) =>
					item.type === 'pending_item_responded' && item.payload.protocol === PROTOCOLS.lifecycle
			);

			expect(responded).toHaveLength(1);
			responded.forEach(assertPayload);
			await validatePendingBatch(admin, PROTOCOLS.lifecycle, batch.batchId, batch.items);
		} finally {
			await admin.dispose();
			await publicApi.dispose();
		}
	});

	test('pending_item_reopened e pending_item_validated notificam o solicitante em até 5s', async ({
		page
	}) => {
		const admin = await loginApi(USERS.admin.email);
		const publicApi = await publicRequesterApi(admin, PROTOCOLS.lifecycle);

		try {
			await loginPage(page, 'pendingRequester');

			const before = await readUnread(page);
			const old = await listNotifications(page.request);
			const createStartedAt = Date.now();
			const batch = await createPendingItem(
				admin,
				PROTOCOLS.lifecycle,
				'Ciclo de reabertura e validação do E2E.'
			);

			await waitForUnread(page, before + 1, createStartedAt);

			const firstAnswer = await answerPendingItems(publicApi, PROTOCOLS.lifecycle, batch.items);

			expect(firstAnswer.answered).toBeGreaterThan(0);

			const reopenStartedAt = Date.now();

			await reopenPendingBatch(
				admin,
				PROTOCOLS.lifecycle,
				batch.batchId,
				batch.items,
				'Reabrir para validar o ciclo no E2E.'
			);
			await waitForUnread(page, before + 2, reopenStartedAt);

			const secondAnswer = await answerPendingItems(publicApi, PROTOCOLS.lifecycle, batch.items);

			expect(secondAnswer.answered).toBeGreaterThan(0);

			const validateStartedAt = Date.now();

			await validatePendingBatch(admin, PROTOCOLS.lifecycle, batch.batchId, batch.items);
			await waitForUnread(page, before + 3, validateStartedAt);

			const fresh = freshNotifications(old, await listNotifications(page.request));
			const byType = (type: string) =>
				fresh.filter((item) => item.type === type && item.payload.protocol === PROTOCOLS.lifecycle);

			for (const type of [
				'pending_item_created',
				'pending_item_reopened',
				'pending_item_validated'
			]) {
				const notifications = byType(type);

				expect(notifications, `O ciclo deveria emitir ${type}`).toHaveLength(1);
				notifications.forEach(assertPayload);
			}
		} finally {
			await admin.dispose();
			await publicApi.dispose();
		}
	});

	test('pending_item_responded_unassigned: sem responsável, notifica Administradores em até 5s', async ({
		page
	}) => {
		const admin = await loginApi(USERS.admin.email);
		const publicApi = await publicRequesterApi(admin, PROTOCOLS.lifecycle);

		try {
			await loginPage(page, 'admin');

			await assignAnalyst(admin, PROTOCOLS.lifecycle, { assigneeId: null });

			const before = await readUnread(page);
			const old = await listNotifications(page.request);
			const batch = await createPendingItem(
				admin,
				PROTOCOLS.lifecycle,
				'Verificação E2E sem responsável.'
			);
			const { startedAt, answered } = await answerPendingItems(
				publicApi,
				PROTOCOLS.lifecycle,
				batch.items
			);

			expect(answered).toBeGreaterThan(0);
			await waitForUnread(page, before + 1, startedAt);

			const fresh = freshNotifications(old, await listNotifications(page.request));
			const unassigned = fresh.filter(
				(item) =>
					item.type === 'pending_item_responded_unassigned' &&
					item.payload.protocol === PROTOCOLS.lifecycle
			);

			expect(unassigned).toHaveLength(1);
			unassigned.forEach(assertPayload);
			expect(unassigned[0].payload.notice).toBe(SEED_STATE.unassignedNotice);

			await bell(page).click();

			const center = notificationCenter(page);

			await expect(center).toBeVisible();

			// O seed já tem um card com o mesmo aviso para o Administrador. O
			// primeiro card de request 3 é a Notificação recém-criada (lista mais
			// recente primeiro); é ela que precisa exibir o notice do backend.
			await expect(
				center.locator('.notification-card').filter({ hasText: PROTOCOLS.lifecycle }).first()
			).toContainText(SEED_STATE.unassignedNotice);

			await validatePendingBatch(admin, PROTOCOLS.lifecycle, batch.batchId, batch.items);
		} finally {
			await admin.dispose();
			await publicApi.dispose();
		}
	});

	test('mapping_scheduled: notifica solicitante e designado em até 5s', async ({
		page,
		browser
	}) => {
		const admin = await loginApi(USERS.admin.email);
		const analystApi = await loginApi(USERS.analyst.email);
		const analystId = await getUserId(analystApi);

		try {
			// A designação do Mapeamento acontece antes de abrir as páginas para
			// que a Notificação de designação não seja confundida com a de
			// Agendamento na contagem inicial.
			await assignAnalyst(admin, PROTOCOLS.lifecycle, { mappingAssigneeId: analystId });

			await loginPage(page, 'pendingRequester');

			const analyst = await openPage(browser, 'analyst');

			try {
				const requesterBefore = await readUnread(page);
				const analystBefore = await readUnread(analyst.page);
				const requesterOld = await listNotifications(page.request);
				const analystOld = await listNotifications(analyst.page.request);
				const target = selectMappingStatus(await getPortalStatuses(admin));
				const scheduledFor = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
					.toISOString()
					.replace(/\.\d{3}Z$/, 'Z');
				const startedAt = Date.now();

				await completeMapping(admin, PROTOCOLS.lifecycle, target.id, scheduledFor);
				await waitForUnread(page, requesterBefore + 1, startedAt);
				await waitForUnread(analyst.page, analystBefore + 1, startedAt);

				const requesterScheduled = freshNotifications(
					requesterOld,
					await listNotifications(page.request)
				).filter(
					(item) =>
						item.type === 'mapping_scheduled' && item.payload.protocol === PROTOCOLS.lifecycle
				);
				const analystScheduled = freshNotifications(
					analystOld,
					await listNotifications(analyst.page.request)
				).filter(
					(item) =>
						item.type === 'mapping_scheduled' && item.payload.protocol === PROTOCOLS.lifecycle
				);

				expect(requesterScheduled).toHaveLength(1);
				expect(analystScheduled).toHaveLength(1);
				requesterScheduled.forEach(assertPayload);
				analystScheduled.forEach(assertPayload);
				expect(requesterScheduled[0].payload.scheduledAt).toBe(scheduledFor);
				expect(analystScheduled[0].payload.scheduledAt).toBe(scheduledFor);
			} finally {
				await analyst.context.close();
			}
		} finally {
			await admin.dispose();
			await analystApi.dispose();
		}
	});
});
