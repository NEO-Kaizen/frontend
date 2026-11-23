# RF20 — E2E Playwright (issue #235)

Esta suíte pertence **somente ao frontend**. Usa a API real, via cookie de sessão, e a massa **fictícia** de `backend/seeds/requester_request/013_notifications.js`. Não instala nem modifica arquivos do backend.

## Pré-requisitos

- Node 24, Docker Desktop e PostgreSQL do backend funcionando;
- backend atualizado, migrations aplicadas e seeds de teste carregados em **banco descartável**;
- frontend na branch que contém `NotificationBell` e `NotificationCenter`;
- `.env.local` do frontend com `PUBLIC_API_URL=http://localhost:3000` e mocks de notificações/autenticação desabilitados;
- usuários fictícios do seed (admin, analista, solicitante de teste e Fábio).

**Atenção:** os testes alteram o status de `MAAT-8K3P-9X2M` e marcam notificações como lidas. **Nunca execute contra dados reais.** Restaure o banco com os seeds antes de cada execução. O script `npm run docker:db:setup` do backend usa `down -v` e APAGA o volume local; use-o apenas se os dados forem descartáveis.

## Instalação e execução (PowerShell)

No frontend:

```powershell
npm ci
npx playwright install chromium
$env:E2E_PASSWORD="<senha do usuário fictício do seed>"
$env:E2E_API_URL="http://localhost:3000"
npm run test:e2e
```

O `playwright.config.ts` inicia automaticamente o Vite na porta 5173 (ou reusa o servidor existente) com a URL da API configurada. Mantenha a API e PostgreSQL rodando. Pode usar `npm run test:e2e:ui` para execução interativa.

## Evidências cobertas

1. Checagem das **quatro classes de Evento** já representadas no seed, com validação de Payload, e disparo posterior de cada classe por endpoint de negócio na API real.
2. Evento `status_changed` criado por `PATCH /requests/:protocol/status` autenticado; sino do solicitante recebe incremento em até **5 segundos** após a resposta da API, sem `waitForTimeout`.
3. Centro abre sem marcar nada, clique no card marca via API e navega para `/acompanhar/:protocol`.
4. Durante a desconexão do navegador, uma segunda mudança pública é registrada. A reconexão reenvia a notificação, sem duplicação do card.
5. `Marcar todas como lidas` persiste no banco mesmo após reload.
6. Criação de Pendência, Designação de Responsável e conclusão do Agendamento pelo fluxo HTTP real; cada novo evento precisa incrementar o badge do destinatário em até 5 segundos e respeitar a Allowlist.

## Limitações e próximos cenários

Os quatro disparadores de negócio estão implementados, mas **a execução contra a API real ainda não foi validada neste ambiente**. Eles assumem os protocolos/estados e usuários do seed do backend; se o motor de Status, Pendência ou Mapeamento recusar uma transição, corrija os dados de preparação e reexecute em banco descartável. Não marque a issue como concluída até a suíte passar sem skips.

O teste exige base isolada e re-semeada: não é intencionalmente reexecutável contra o mesmo banco mutado. `npm run test:e2e` falhará com diagnóstico quando os dados esperados não existirem; não faz skip de falhas.
