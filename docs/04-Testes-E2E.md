# Testes E2E de Notificações (RF20)

Suíte Playwright da issue #235. Exercita a matriz de Eventos do RF20 pela API
real e pela interface (sino, Centro, leitura e SSE), usando somente a massa
fictícia do seed do backend.

## Pré-requisitos

- Node 24 no frontend (`engines` do `package.json`).
- Backend com o RF20 (migrations aplicadas) e PostgreSQL descartável.
- Chromium do Playwright instalado no frontend.

## Preparar o backend

Em `backend/`, com o `.env` de desenvolvimento configurado conforme o
`SETUP.md`:

```bash
docker compose up -d postgres
npm run migrate:latest
npm run seed:run
npm run dev
```

`npm run seed:run` restaura a massa: o seed 001 trunca as solicitações em
cascata. Rode-o antes de cada execução da suíte, porque os testes alteram
Status, Pendências, designações e Notificações.

> **Nunca execute contra dados reais.** O seed usa solicitações, usuários e
> anexos fictícios.

## Preparar o frontend

```bash
npm ci
npx playwright install chromium
export E2E_PASSWORD="<senha fictícia do seed 004>"
export E2E_API_URL="http://localhost:3000"
npm run test:e2e
```

A senha de desenvolvimento dos usuários fictícios está no seed
`seeds/requester_request/004_users.js` do backend. O `playwright.config.ts`
inicia o Vite na porta 5173 e define `PUBLIC_API_URL` para a API; não é
necessário `.env.local`. Os mocks já estão desligados em
`src/lib/mocks/index.ts` (`MOCKS_ENABLED = false`).

Variáveis opcionais:

- `E2E_API_URL` — padrão `http://localhost:3000`;
- `E2E_FRONTEND_PORT` — padrão `5173`.

## O que a suíte cobre

- **Matriz completa**: os oito tipos de Evento do RF20 têm Notificação e o
  contador de não lidas bate com a lista de cada usuário.
- **Allowlist exata**: campos obrigatórios por Evento e nenhum campo fora da
  Allowlist (`responsible_assigned` usa `category`/`status`;
  `pending_item_responded_unassigned` usa `notice`).
- **Entrega em até 5s** para os destinatários corretos:
  - `status_changed` → solicitante;
  - `responsible_assigned` → analista designado;
  - `pending_item_created` → solicitante;
  - `pending_item_reopened` e `pending_item_validated` → solicitante;
  - `pending_item_responded` → responsável;
  - `pending_item_responded_unassigned` → Administradores ativos, com o aviso;
  - `mapping_scheduled` → solicitante **e** designado do Mapeamento.
- **Centro**: abrir não marca; clique marca e navega para o acompanhamento;
  "marcar todas" persiste após reload.
- **Reconexão**: a rota do SSE é bloqueada para derrubar a conexão de verdade;
  a reconexão reenvia a Notificação sem duplicar o card.

## Determinismo

- `describe.serial` com `workers: 1`.
- `beforeAll` verifica o estado do seed e falha com instrução de reset quando a
  massa não está pronta.
- Auto-wait do Playwright, sem `waitForTimeout`.
- O limite de 5s é medido desde o início da requisição de mutação — um limite
  superior para o commit, mais rigoroso que começar a contar após a resposta da
  API. A reconexão usa 20s porque a entrega fica bloqueada durante a queda
  simulada.
- O lote criado pela suíte tem um único item, mantendo a relação 1 resposta → 1
  Notificação ao responsável.

## Resultado da última execução

- **2026-11-23**: `12 passed (27.2s)`.
- Backend `main` com o RF20, PostgreSQL descartável e seed recém-aplicado.
- Node 24.22.3; Chromium 1255 (Playwright 1.65.1).
- Comando: `E2E_PASSWORD=<senha do seed> E2E_API_URL=http://localhost:3000 npm run test:e2e`.

## Limitações

- A suíte exige banco recém-semeado; ela não é idempotente por design.
- A latência de 5s depende do backend e do PostgreSQL locais; o teste valida o
  caminho real do SSE, não um mock.
