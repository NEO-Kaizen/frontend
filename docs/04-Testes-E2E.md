# Testes E2E de Notificações (RF20)

Suíte Playwright das issues #235 e #236. Exercita a matriz de Eventos do RF20
pela API real e pela interface (sino, Centro, leitura e SSE) e o acabamento de
movimento/carregamento, usando somente a massa fictícia do seed do backend.

## Pré-requisitos

- Node 24 no frontend (`engines` do `package.json`).
- Backend `main` com o RF20 (migrations aplicadas) e PostgreSQL descartável.
  O seed de branches antigas pode não ter os Status que a suíte pressupõe.
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
- **Conteúdo dos cards**: `responsible_assigned` exibe
  `Responsável designado · {categoria} · {status}` e
  `pending_item_responded_unassigned` exibe
  `Pendência respondida. {notice}`, ancorados pelo id da Notificação.
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
- **Movimento e carregamento (#236)**: skeleton no badge e na lista, respeito a
  `prefers-reduced-motion` no skeleton/lista/Toast, Toast disparado pelo fluxo
  real de erro, duração de exibição com relógio falso e snapshots visuais do
  skeleton do sino e do Centro, além do Toast. O Centro também é checado em
  390px para não vazar do viewport nem criar rolagem horizontal própria.

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
- O spec de movimento usa `test.describe.serial`, segura o contador e a primeira
  página de propósito e usa `page.clock` para validar a duração do Toast sem
  esperar 4s reais. Os snapshots desativam animações e cobrem somente o
  skeleton (sino e Centro) e o Toast, que não dependem do conteúdo mutável do
  seed.

## Resultado da última execução

- **2026-11-23**: `14 passed (44.9s)` na suíte completa. Os dois testes de
  movimento levaram 3.6s e 2.8s; o spec de movimento também passou isolado
  depois da suíte RF20.
- Backend `main` (3171c3e) com o RF20, PostgreSQL descartável e seed
  recém-aplicado.
- Node 24.22.3; Chromium 1255 (Playwright 1.65.1).
- Comando: `E2E_PASSWORD=<senha do seed> E2E_API_URL=http://localhost:3000 npm run test:e2e`.

## Limitações

- A suíte exige banco recém-semeado; ela não é idempotente por design.
- A latência de 5s depende do backend e do PostgreSQL locais; o teste valida o
  caminho real do SSE, não um mock.
- Os snapshots visuais são baselines Linux/Chromium, em
  `tests/e2e/notification-motion.spec.ts-snapshots/`. Em outro SO, gere as
  baselines locais com `--update-snapshots` ou rode a suíte no CI Linux.
- O spec de movimento pressupõe que a Home busque o contador e a primeira
  página no mount; é essa espera que permite observar os dois skeletons.
