import { test, expect, request, type APIRequestContext, type Page } from '@playwright/test';

/** RF20: executado exclusivamente contra API real + seeds fictícios descartáveis. */
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';
const PASSWORD = process.env.E2E_PASSWORD;
const PROTOCOL = 'MAAT-8K3P-9X2M';
const USERS = {
  requester: 'fabio.solicitante@email.com',
  pendingRequester: 'solicitante_teste@email.com',
  analyst: 'analista_teste@email.com',
  admin: 'administrador_teste@email.com'
};

type Notification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
};
type Status = { id: number; name: string; isActive: boolean; isPublic: boolean; isRestricted: boolean };

// Contrato RF20: nenhuma informação interna entra no payload. Os dois aliases
// (status/notice) são emitidos pelo seed antigo e continuam estritamente públicos.
const BASE_KEYS = ['type', 'protocol', 'title'];
function allowedKeys(type: string): Set<string> {
  if (type === 'status_changed') return new Set([...BASE_KEYS, 'newStatus']);
  if (type === 'responsible_assigned') {
    return new Set([...BASE_KEYS, 'category', 'currentStatus', 'status']);
  }
  if (type === 'mapping_scheduled' || type === 'mapping_rescheduled') {
    return new Set([...BASE_KEYS, 'scheduledAt']);
  }
  if (type === 'pending_item_responded_unassigned') {
    return new Set([...BASE_KEYS, 'unassignedWarning', 'notice']);
  }
  if (type.startsWith('pending_item_')) return new Set(BASE_KEYS);
  throw new Error(`Tipo de Evento inesperado na matriz RF20: ${type}`);
}
const FORBIDDEN_KEYS = [
  'score', 'scores', 'internalNotes', 'notes', 'triage', 'priority',
  'risks', 'nextSteps', 'requesterEmail', 'requesterName', 'justification'
];

async function loginApi(email: string): Promise<APIRequestContext> {
  if (!PASSWORD) throw new Error('Defina E2E_PASSWORD (senha dos usuários fictícios do seed).');
  const api = await request.newContext({ baseURL: API_URL });
  const res = await api.post('/auth/login', { data: { email, password: PASSWORD } });
  expect(res.ok(), `Login API de ${email}: ${res.status()} ${await res.text()}`).toBeTruthy();
  return api;
}

/**
 * Usa a identidade do solicitante registrada na própria demanda.
 * A conta de notificação pode ser diferente do nome/e-mail público da demanda.
 * Não usa cookie: o backend valida X-Requester-Identity contra a solicitação.
 */
async function publicRequesterApi(
  admin: APIRequestContext,
  protocol: string
): Promise<APIRequestContext> {
  const detailResponse = await admin.get(`/requests/${protocol}/internal`);
  expect(
    detailResponse.ok(),
    `Detalhe da solicitação: ${detailResponse.status()} ${await detailResponse.text()}`
  ).toBeTruthy();

  const detail = (await detailResponse.json()) as {
    requester: { fullName: string; corporateEmail: string };
  };
  const name = detail.requester?.fullName;
  const email = detail.requester?.corporateEmail;
  expect(name, 'Nome do solicitante deve existir na solicitação').toBeTruthy();
  expect(email, 'E-mail do solicitante deve existir na solicitação').toBeTruthy();

  // Contexto separado e SEM sessão autenticada para exercitar o fluxo público real.
  return request.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: {
      'X-Requester-Identity': JSON.stringify({ name, email })
    }
  });
}

async function items(api: APIRequestContext): Promise<Notification[]> {
  const collected: Notification[] = [];
  let cursor: string | null = null;
  do {
    const query = cursor ? `?limit=50&cursor=${encodeURIComponent(cursor)}` : '?limit=50';
    const res = await api.get(`/notifications${query}`);
    expect(res.ok(), `Listagem: ${res.status()} ${await res.text()}`).toBeTruthy();
    const data = (await res.json()) as { items: Notification[]; nextCursor: string | null };
    expect(Array.isArray(data.items)).toBeTruthy();
    collected.push(...data.items);
    cursor = data.nextCursor;
  } while (cursor !== null);
  return collected;
}

function assertPayload(item: Notification): void {
  expect(item.id).toBeTruthy();
  expect(item.payload.protocol).toEqual(expect.any(String));
  expect(item.payload.title).toEqual(expect.any(String));
  expect(item.payload.type).toEqual(item.type);
  const keys = allowedKeys(item.type);
  for (const key of Object.keys(item.payload)) {
    expect(keys.has(key), `Campo fora da Allowlist: ${key} (${item.type})`).toBeTruthy();
  }
  for (const key of FORBIDDEN_KEYS) {
    expect(item.payload).not.toHaveProperty(key);
  }
}

async function loginUi(page: Page, email: string): Promise<void> {
  if (!PASSWORD) throw new Error('Defina E2E_PASSWORD antes de executar.');

  // Autenticação real pela API. page.request compartilha os cookies com o navegador.
  // Evita submeter o formulário antes da hidratação do Svelte (POST /login -> 405).
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: { email, password: PASSWORD }
  });
  expect(
    response.ok(),
    `Login API de ${email}: ${response.status()} ${await response.text()}`
  ).toBeTruthy();

  // Analistas acessam a área interna; solicitantes, a página pública.
  await page.goto(email === USERS.analyst ? '/home' : '/');

  const bell = page.locator('.notification-bell');
  await expect(bell).toBeVisible({ timeout: 10_000 });
  await expect(bell).toHaveAttribute(
    'aria-label', /Notificações: (\d+ não lida|nenhuma não lida)/,
    { timeout: 10_000 }
  );
}

function unreadFromLabel(label: string | null): number {
  if (!label) throw new Error('Sino sem aria-label');
  if (label.includes('nenhuma não lida')) return 0;
  const match = label.match(/Notificações: (\d+) não lida/);
  if (!match) throw new Error(`Contador ainda não disponível: ${label}`);
  return Number(match[1]);
}

async function readyUnread(page: Page): Promise<number> {
  const bell = page.locator('.notification-bell');
  await expect(bell).toHaveAttribute('aria-label', /Notificações: (\d+ não lida|nenhuma não lida)/);
  return unreadFromLabel(await bell.getAttribute('aria-label'));
}

async function chooseTarget(
  api: APIRequestContext,
  excludeIds: number[] = [],
  excludeNames: string[] = []
): Promise<Status> {
  const response = await api.get('/portal-config');
  expect(response.ok()).toBeTruthy();
  const config = (await response.json()) as { statuses: Status[] };
  const status = config.statuses.find((s) =>
    s.isActive && s.isPublic && !s.isRestricted &&
    !excludeIds.includes(s.id) && !excludeNames.includes(s.name)
  );
  expect(status, 'Seed deve expor status público elegível diferente do atual').toBeDefined();
  return status!;
}

async function changeStatus(api: APIRequestContext, target: Status): Promise<void> {
  const result = await api.patch(`/requests/${PROTOCOL}/status`, {
    data: {
      targetStatus: target.id,
      justification: 'Teste E2E RF20 em base descartável',
      lastTechnicalMessage: 'Atualização fictícia de teste.'
    }
  });
  expect(result.ok(), `PATCH status ${result.status()}: ${await result.text()}`).toBeTruthy();
}

test.describe.serial('RF20 — Notificações reais (seed descartável)', () => {
  test('matriz: os quatro Eventos têm Notificações e Payload Allowlist', async () => {
    const contexts = await Promise.all(Object.values(USERS).map(loginApi));
    try {
      const pages = await Promise.all(contexts.map(items));
      const all = pages.flat();
      for (const item of all) assertPayload(item);
      for (const [eventName, matches] of Object.entries({
        status: (n: Notification) => n.type === 'status_changed',
        pending: (n: Notification) => n.type.startsWith('pending_item_'),
        mapping: (n: Notification) => n.type.startsWith('mapping_'),
        assignment: (n: Notification) => n.type === 'responsible_assigned'
      })) {
        expect(all.some(matches), `Seed não produziu a categoria ${eventName}`).toBeTruthy();
      }
      // O seed inclui vários destinatários: o contador deve ser individual.
      const reader = contexts[0];
      const unread = await reader.get('/notifications/unread-count');
      expect(unread.ok()).toBeTruthy();
      const data = (await unread.json()) as { unreadCount: number };
      expect(data.unreadCount).toBe(pages[0].filter((n) => n.readAt === null).length);
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.dispose()));
    }
  });

  test('SSE <=5s, Centro não marca, clique navega, read-all persiste e replay não duplica', async ({ page, context }) => {
    const admin = await loginApi(USERS.admin);
    const requester = await loginApi(USERS.requester);
    try {
      await loginUi(page, USERS.requester);
      const bell = page.locator('.notification-bell');
      const before = await readyUnread(page);
      const oldItems = await items(requester);
      const current = await admin.get(`/requests/${PROTOCOL}/internal`);
      expect(current.ok()).toBeTruthy();
      const requestBody = (await current.json()) as { status?: string };
      // O estado pode ter mudado após testes manuais; não assumir o ID 6 do seed.
      expect(requestBody.status, 'A API deve informar o status atual da solicitação').toEqual(expect.any(String));
      const first = await chooseTarget(admin, [], [requestBody.status!]);
      await changeStatus(admin, first);
      // Limite do RF20: começa quando a API confirma o commit.
      await expect(bell).toHaveAttribute('aria-label', new RegExp(`Notificações: ${before + 1} não lida`), { timeout: 5_000 });
      const fresh = (await items(requester)).filter((n) => !oldItems.some((old) => old.id === n.id));
      expect(fresh.filter((n) => n.type === 'status_changed')).toHaveLength(1);
      fresh.forEach(assertPayload);
      await bell.click();
      const center = page.getByRole('dialog', { name: 'Centro de notificações' });
      await expect(center).toBeVisible();
      expect(await readyUnread(page)).toBe(before + 1); // abrir = somente leitura
      const latest = center.getByRole('button', { name: new RegExp(`Não lida: ${PROTOCOL}.*Novo status: ${first.name}`) });
      await expect(latest).toBeVisible();
      await latest.click();
      await expect(page).toHaveURL(new RegExp(`/acompanhar/${PROTOCOL}`));
      const firstAfterRead = (await items(requester)).find((n) => n.id === fresh[0].id);
      expect(firstAfterRead?.readAt).not.toBeNull();

      // Reconexão: mutate enquanto o browser está offline, depois valida replay único.
      await context.setOffline(true);
      const second = await chooseTarget(admin, [first.id]);
      await changeStatus(admin, second);
      await context.setOffline(false);
      await expect(bell).toHaveAttribute('aria-label', new RegExp(`Notificações: ${before + 1} não lida`), { timeout: 15_000 });
      await bell.click();
      await expect(center.getByRole('button', { name: new RegExp(`Não lida: ${PROTOCOL}.*Novo status: ${second.name}`) })).toHaveCount(1);
      await center.getByRole('button', { name: 'Marcar todas como lidas' }).click();
      await expect(bell).toHaveAttribute('aria-label', /nenhuma não lida/);
      await page.reload();
      expect(await readyUnread(page)).toBe(0);
      const count = await requester.get('/notifications/unread-count');
      expect(((await count.json()) as { unreadCount: number }).unreadCount).toBe(0);
    } finally {
      await context.setOffline(false);
      await Promise.all([admin.dispose(), requester.dispose()]);
    }
  });

  test('Pendência criada gera notificação no sino em até 5 segundos', async ({ page }) => {
    const admin = await loginApi(USERS.admin);
    const requester = await loginApi(USERS.pendingRequester);
    const protocol = 'MAAT-2R7Q-4M1C';
    const publicRequester = await publicRequesterApi(admin, protocol);
    try {
      // O seed inclui um lote aberto; encerre-o pelo fluxo público antes de criar outro.
      const initial = await admin.get(`/requests/${protocol}/pending-items`);
      expect(initial.ok()).toBeTruthy();
      const pending = (await initial.json()) as {
        items: Array<{
          id: string;
          batchId: string;
          status: string;
          type: string;
          field?: { currentValue?: string | number | boolean | null };
        }>;
      };
      // Não pressupor que o lote do seed tem um único item.
      // Uma revisão deve abranger todos os itens respondidos do lote.
      const openItems = pending.items.filter((item) => item.status !== 'validated');
      const byBatch = new Map<string, typeof openItems>();
      for (const item of openItems) {
        const group = byBatch.get(item.batchId) ?? [];
        group.push(item);
        byBatch.set(item.batchId, group);
      }
      for (const [batchId, batchItems] of byBatch) {
        for (const item of batchItems) {
          if (item.status !== 'requested') continue;
          const body = item.type === 'field_edit'
            ? { correctedValue: item.field?.currentValue ?? 'Título corrigido para E2E' }
            : { response: 'Resposta fictícia para fechar o lote inicial.' };
          const response = await publicRequester.patch(
            `/requests/${protocol}/pending-items/${item.id}`,
            { data: body }
          );
          expect(
            response.ok(),
            `Responder seed: ${response.status()} ${await response.text()}`
          ).toBeTruthy();
        }
        const reviewed = await admin.patch(`/requests/${protocol}/pending-items/review`, {
          data: {
            batchId,
            items: batchItems.map((item) => ({ id: item.id, decision: 'validate' }))
          }
        });
        expect(
          reviewed.ok(),
          `Validar seed: ${reviewed.status()} ${await reviewed.text()}`
        ).toBeTruthy();
      }

      await loginUi(page, USERS.pendingRequester);
      const before = await readyUnread(page);
      const old = await items(requester);
      const created = await admin.post(`/requests/${protocol}/pending-items`, {
        data: {
          observation: 'Verificação E2E da emissão de Pendência',
          requestAttachment: false,
          items: [{ fieldKey: 'demand.title', comment: 'Atualizar título para o teste E2E.' }]
        }
      });
      expect(created.ok(), `Criar Pendência: ${created.status()} ${await created.text()}`).toBeTruthy();
      const batch = (await created.json()) as {
        batchId: string;
        items: Array<{ id: string; type: string; field?: { fieldKey: string; currentValue: string } }>;
      };
      await expect(page.locator('.notification-bell')).toHaveAttribute(
        'aria-label', new RegExp(`Notificações: ${before + 1} não lida`), { timeout: 5_000 }
      );
      const arriving = (await items(requester)).filter((n) => !old.some((prev) => prev.id === n.id));
      expect(arriving.filter((n) => n.type === 'pending_item_created')).toHaveLength(1);
      arriving.forEach(assertPayload);

      // Não deixa lote aberto para o teste seguinte de Mapeamento.
      for (const item of batch.items) {
        const payload = item.type === 'observation'
          ? { response: 'Evidência fictícia respondida.' }
          : { correctedValue: `${item.field?.currentValue ?? 'Título'} — E2E` };
        const answer = await publicRequester.patch(`/requests/${protocol}/pending-items/${item.id}`, {
          data: payload
        });
        expect(answer.ok(), `Responder Pendência: ${answer.status()} ${await answer.text()}`).toBeTruthy();
      }
      const validated = await admin.patch(`/requests/${protocol}/pending-items/review`, {
        data: {
          batchId: batch.batchId,
          items: batch.items.map((item) => ({ id: item.id, decision: 'validate' }))
        }
      });
      expect(validated.ok(), `Validar Pendência: ${validated.status()} ${await validated.text()}`).toBeTruthy();
    } finally {
      await Promise.all([admin.dispose(), requester.dispose(), publicRequester.dispose()]);
    }
  });

  test('Designação de Responsável notifica o analista em até 5 segundos', async ({ page }) => {
    const admin = await loginApi(USERS.admin);
    const analyst = await loginApi(USERS.analyst);
    const protocol = 'MAAT-2R7Q-4M1C';
    try {
      await loginUi(page, USERS.analyst);
      const before = await readyUnread(page);
      const old = await items(analyst);
      const assigned = await admin.patch(`/requests/${protocol}/internal/assignee`, {
        data: { assigneeId: '101' }
      });
      expect(assigned.ok(), `Designação: ${assigned.status()} ${await assigned.text()}`).toBeTruthy();
      await expect(page.locator('.notification-bell')).toHaveAttribute(
        'aria-label', new RegExp(`Notificações: ${before + 1} não lida`), { timeout: 5_000 }
      );
      const arriving = (await items(analyst)).filter((n) => !old.some((prev) => prev.id === n.id));
      expect(arriving.filter((n) => n.type === 'responsible_assigned')).toHaveLength(1);
      arriving.forEach(assertPayload);
    } finally {
      await Promise.all([admin.dispose(), analyst.dispose()]);
    }
  });

  test('Agendamento do Mapeamento notifica o solicitante em até 5 segundos', async ({ page }) => {
    const admin = await loginApi(USERS.admin);
    const requester = await loginApi(USERS.pendingRequester);
    const protocol = 'MAAT-2R7Q-4M1C';
    try {
      await loginUi(page, USERS.pendingRequester);
      const before = await readyUnread(page);
      const old = await items(requester);
      const scheduled = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = await admin.put(`/queue/requests/${protocol}/mapping`, {
        data: {
          completeMapping: true,
          targetStatus: 6,
          scheduledFor: scheduled,
          durationMinutes: 30,
          modality: 'IN_PERSON',
          location: 'Sala fictícia de validação E2E',
          participants: [],
          justification: 'Agendamento gerado exclusivamente na base descartável E2E'
        }
      });
      expect(result.ok(), `Agendamento: ${result.status()} ${await result.text()}`).toBeTruthy();
      await expect(page.locator('.notification-bell')).toHaveAttribute(
        'aria-label', new RegExp(`Notificações: ${before + 1} não lida`), { timeout: 5_000 }
      );
      const arriving = (await items(requester)).filter((n) => !old.some((prev) => prev.id === n.id));
      expect(arriving.filter((n) => n.type === 'mapping_scheduled')).toHaveLength(1);
      arriving.forEach(assertPayload);
    } finally {
      await Promise.all([admin.dispose(), requester.dispose()]);
    }
  });

});
