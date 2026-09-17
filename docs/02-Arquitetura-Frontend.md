# Arquitetura do Frontend

## 1. Objetivo

Este documento define como as partes do frontend do projeto MAAT se relacionam e quais são as responsabilidades de cada camada.

A arquitetura busca separar:

- interface;
- estado;
- regras da aplicação;
- validações;
- comunicação com o backend.

O objetivo é manter uma estrutura simples, organizada e preparada para crescer sem criar camadas desnecessárias.

---

## 2. Estrutura recomendada

```text
src/
├── lib/
│   ├── types/
│   │   ├── user.ts
│   │   ├── request.ts
│   │   ├── queue.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   │
│   ├── api/
│   │   ├── client.ts
│   │   ├── user.api.ts
│   │   ├── request.api.ts
│   │   ├── queue.api.ts
│   │   ├── auth.api.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── request.service.ts
│   │   ├── assignment.service.ts
│   │   ├── queue.service.ts
│   │   ├── auth.service.ts
│   │   ├── access.service.ts
│   │   └── index.ts
│   │
│   ├── config/
│   │   ├── portal-defaults.ts
│   │   ├── portal-config.api.ts
│   │   └── portal-config.service.ts
│   │
│   ├── server/
│   │   └── mocks/          # API mock dev-only (middleware Vite) — fora do build
│   │
│   ├── states/
│   │   ├── auth.svelte.ts
│   │   ├── toast.svelte.ts
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── users/
│   │   └── request/
│   │
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   ├── utilities.css
│   │   └── index.css
│   │
│   ├── utils/
│   ├── constants/
│   └── index.ts
│
├── routes/
│   ├── (public)/
│   ├── (app)/
│   └── (admin)/
│
├── hooks.server.ts
├── app.d.ts
└── app.html
```

> As pastas e arquivos devem ser criados conforme a necessidade do projeto. Não é necessário manter pastas vazias apenas para representar a arquitetura.

---

## 3. Fluxo da aplicação

O fluxo principal será:

```text
Página ou componente
        ↓
     Service
        ↓
       API
        ↓
     Backend
```

O retorno percorre o caminho inverso:

```text
Backend
   ↓
API
   ↓
Service
   ↓
Página ou componente
   ↓
Interface
```

Quando uma informação precisar ser compartilhada entre diferentes partes da aplicação, o estado compartilhado poderá ser utilizado.

Nem toda operação precisa utilizar estado compartilhado. Estados utilizados apenas em uma página ou componente devem permanecer locais.

---

## 4. Responsabilidades

| Camada               | Responsabilidade                                          |
| -------------------- | --------------------------------------------------------- |
| Página ou componente | Interface, eventos, loading e mensagens                   |
| Estado compartilhado | Dados compartilhados entre diferentes partes da aplicação |
| Service              | Regras, validações e sequência das operações              |
| API                  | Endpoints, métodos HTTP, headers, cookies e respostas     |
| Types                | Estrutura e formato dos dados                             |
| Mocks                | Dados fictícios utilizados no desenvolvimento             |
| Backend              | Validação definitiva, autorização e persistência          |

---

## 5. Componentes e páginas

Componentes e páginas são responsáveis pela interface e pela interação com o usuário.

Devem:

- exibir dados;
- capturar eventos;
- controlar estados visuais;
- chamar services;
- utilizar estados compartilhados quando necessário;
- mostrar loading, erro, vazio e sucesso;
- evitar conhecer detalhes de endpoints;
- evitar concentrar regras de negócio.

---

## 6. Types

A pasta `types/` representa as estruturas utilizadas no projeto.

Pode conter:

- interfaces;
- tipos;
- unions;
- estruturas de entrada e saída;
- filtros;
- paginação;
- autenticação.

> **Importante:** Os tipos que representam contratos de comunicação com o backend devem refletir fielmente a API. O frontend pode manter tipos próprios derivados para estado, regras e apresentação.

A pasta `types/` não deve realizar requisições, acessar estados compartilhados ou conter regras de negócio.

---

## 7. API

A pasta `api/` concentra a comunicação HTTP com o backend.

Ela é responsável por:

- URL base;
- endpoints;
- métodos HTTP;
- headers;
- cookies;
- body;
- tratamento inicial das respostas;
- tratamento padronizado de erros HTTP.

A API não deve:

- decidir permissões;
- controlar componentes;
- manipular modais;
- exibir mensagens;
- conter regras de negócio.

---

## 8. Services

A pasta `services/` reúne as operações e regras da aplicação.

Os services podem:

- aplicar regras do frontend;
- validar formulários;
- tipar os dados recebidos da API utilizando TypeScript;
- verificar condições antes de uma ação;
- coordenar etapas de uma operação;
- utilizar funções da API;
- converter dados para o formato utilizado pela aplicação.

Exemplo de organização quando uma área crescer:

```text
services/
└── users/
    ├── user.service.ts
    ├── user.validation.ts
    └── index.ts
```

> Mesmo estando em um arquivo separado, a validação continua pertencendo à camada de services.

---

## 9. Estado compartilhado

Estado compartilhado é implementado em `states/*.svelte.ts` com runes do Svelte 5 (`$state`/`$derived`), padrão oficial do Svelte 5. States não substituem a sessão definida no servidor. Exemplos:

- usuário autenticado;
- sessão;
- notificações globais;
- preferências compartilhadas;
- filtros utilizados em diferentes componentes.

Estados compartilhados não devem ser criados para qualquer variável.

Estados utilizados somente por uma página, componente, formulário ou modal devem permanecer locais.

Estados compartilhados não substituem:

- API;
- backend;
- banco de dados;
- cookies;
- validação de sessão no servidor.

### 9.1 Configuração do portal (`config/`)

A configuração pública do portal (runtime) vive na pasta `config/` com o tipo em `types/portal-config.ts`:

- `types/portal-config.ts` — contrato `PortalConfig` (nome da plataforma, modo de solicitação `PUBLIC`/`AUTHENTICATED`, prefixo de exibição do protocolo, tokens de tema e assets). O contrato definitivo é definido pela issue #90; issues futuras (#88, #89, #92) incrementam campos em vez de criar mecanismos próprios;
- `config/portal-defaults.ts` — único dono dos defaults locais (espelha `global.css` `:root` e os assets estáticos);
- `config/portal-config.api.ts` — leitura via camada `api/` (`apiClient`); o endpoint real nasce com a #90;
- `config/portal-config.service.ts` — resolução com fallback: falha de rede ou valor inválido cai no default por campo (validação allowlist — apenas strings tipadas e URLs seguras; nenhum HTML/CSS/JS vindo da API é aceito).

Fluxo:

```text
hooks.server.ts (loadPortalConfig → locals.portalConfig, com fallback)
        ↓
+layout.server.ts (repassa locals → data.portalConfig)
        ↓
+layout.svelte (favicon/title/estilos do tema a partir de data)
        ↓
Componentes (leem via page.data.portalConfig; nunca fetch direto)
```

Regras:

- a configuração é resolvida no servidor (no `hooks.server.ts`, mesmo padrão do `locals.user`) e entregue por `data`; componentes não leem a API diretamente;
- consumidores leem `page.data.portalConfig` (reativo, SSR-consistente) — não há store/estado de módulo para config; se no futuro houver mutação cliente a partir do admin (#90), um estado em `states/*.svelte.ts` (runes) pode ser adicionado na hora da necessidade;
- `protocolMask` (prefixo do protocolo) é repassado como parâmetro a services/validações (`isProtocol(value, prefix)`), pois services não acessam `page.data`;
- o tema (3 tokens de cor) é aplicado como exemplo/baseline no `+layout.svelte` via wrapper `.app-root` + diretivas `style:--*` (CSS custom properties): o wrapper é o container de layout (flex, centralização, `min-height: 100dvh`, fundo via `--background-color`), cobrindo o `body` — renderizado no SSR (sem `$effect`, sem flash) e reativo a `data`. Nota: o Svelte 5 não suporta interpolação `{expr}` em `<style>` (recurso removido do Svelte 4), e `:global()` só serve para CSS estático — por isso as custom properties reativas vão via `style:` num wrapper;
- configuração de portal (runtime) é um dado de aplicação; não se confunde com o mock de desenvolvimento, que vive só no middleware Vite (`src/lib/server/mocks/`, `apply: 'serve'`) e é inerte em produção. O domínio `portal-config` do mock já atende `GET /portal-config` em dev (#90);
- a aplicação do tema completo (tokens em páginas, flash minimizado) é escopo da issue #89; esta camada apenas prepara o transporte.

---

## 10. Mocks

Em desenvolvimento a API é simulada por um **mock server-side dev-only**, servido pelo próprio dev server do Vite via middleware sob `/__mock/**`. O app fala HTTP de verdade: cookie de sessão, upload multipart e paginação/filtros passam pelo protocolo, e o SSR consome a mesma API.

Os dados continuam fictícios e devem:

- seguir os tipos definidos no projeto;
- representar diferentes cenários;
- incluir sucesso, vazio, erro e diferentes status;
- nunca utilizar informações reais de clientes ou usuários.

### Como funciona

- implementação em `src/lib/server/mocks/`: plugin Vite (`plugin.ts`, `apply: 'serve'`), roteador (`router.ts`), handlers por domínio e fixtures reutilizáveis em `data/`;
- o plugin é registrado em `vite.config.ts` e **não existe no build de produção** — nenhuma rota `/__mock` nem dado fictício entra no bundle;
- em dev, `PUBLIC_API_URL=/__mock`; para usar o backend real, aponte essa variável para a URL absoluta da API (troca única, sem código);
- `src/lib/server/mocks/config.ts` concentra o interruptor global (`USE_MOCK_API`) e a granularidade por domínio (`MOCK_DOMAINS`); domínio desligado é encaminhado por proxy para `PUBLIC_REAL_API_URL`;
- SSR: o `fetch` do load resolveria `/__mock` internamente (sem passar pelo middleware). O `handleFetch` (`src/hooks.server.ts`) força uma requisição HTTP real e reenvia o cookie da sessão;
- o estado do mock é **em memória**: usuários/solicitações criados e avaliações salvas duram só enquanto o dev server viver (reiniciar ou HMR limpa).

> Não há mais mocks no bundle. Os antigos `src/lib/mocks/*.mock.ts` e o toggle
> `MOCKS_ENABLED`/`MOCK_DOMAINS` do cliente (com branches nos `*.api.ts`) foram
> removidos: os `*.api.ts` sempre chamam o `apiClient`.

### Como usar

1. Copie `.env.example` para `.env` e garanta:

   ```bash
   PUBLIC_API_URL=/__mock
   PUBLIC_REAL_API_URL=http://localhost:3000   # backend do proxy (domínios desligados)
   ```

2. Suba o app com `npm run dev`. Não é preciso backend.

Personas fictícias de login:

| E-mail                    | Senha     | Perfil        | Troca de senha obrigatória |
| ------------------------- | --------- | ------------- | -------------------------- |
| `analista@maat.com.br`    | `admin`   | Analista      | não                        |
| `admin@maat.com.br`       | `admin`   | Administrador | não                        |
| `gestor@maat.com.br`      | `admin`   | Gestor        | sim                        |
| `solicitante@maat.com.br` | `temp123` | Solicitante   | sim                        |

> `gestor` e `solicitante` entram com `mustChangePassword: true` e caem em `/redefinir-senha`. Para testar as áreas internas rapidamente, use `analista` ou `admin`.

Domínios e endpoints mockados (`src/lib/server/mocks/router.ts`):

| Domínio          | Endpoints                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`           | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/change-password`                                                                                                   |
| `users`          | `GET /users`, `GET /users/metrics`, `POST /users`, `PATCH /users/:id/status`, `POST /users/:id/reset-password`                                                                         |
| `request`        | `POST /requests` (multipart), `GET /requests`, `GET /queue`, `GET /queue/metrics`, `GET /requests/:protocol`, `GET /requests/:protocol/internal`, `PATCH /requests/:protocol/internal` |
| `prioritization` | `GET /prioritization/criteria`, `PUT /prioritization/:protocol/score`                                                                                                                  |
| `portal-config`  | `GET /portal-config`                                                                                                                                                                   |

**Desligar o mock**

- Tudo de uma vez: `USE_MOCK_API = false` em `config.ts` — todos os domínios passam a ir por proxy ao backend real. Alternativa sem código: aponte `PUBLIC_API_URL` para a URL absoluta do backend.
- Um domínio só: `MOCK_DOMAINS.<domínio> = false` em `config.ts`; as demais rotas continuam mockadas e o domínio desligado é encaminhado a `PUBLIC_REAL_API_URL` (cookie e multipart são repassados). `PUBLIC_API_URL` **permanece** `/__mock`.

**Depurar**

- `401` em rota autenticada = sem cookie `session_id` (faça login). O cookie é `HttpOnly`, então só o servidor o lê.
- Para inspecionar o HTTP direto:

  ```bash
  curl -i -c /tmp/c.txt -H 'Content-Type: application/json' \
    -d '{"email":"analista@maat.com.br","password":"admin"}' \
    http://localhost:5173/__mock/auth/login
  curl -i -b /tmp/c.txt http://localhost:5173/__mock/auth/me
  ```

- Se o app ignorar o mock, confira `PUBLIC_API_URL` (precisa ser `/__mock`) e reinicie o dev server após mexer no `.env`.

### Como criar um domínio/endpoint

1. **Contrato primeiro**: tipos em `src/lib/types/`, função em `src/lib/api/<domínio>.api.ts` (só `apiClient`) e a regra no service. O `*.api.ts` nunca contém lógica de mock.
2. **Registre o domínio** em `src/lib/server/mocks/config.ts` (union `MockDomain` e mapa `MOCK_DOMAINS`).
3. **Dados/fixtures** em `src/lib/server/mocks/data/<domínio>.ts` — apenas dados fictícios e funções puras (sem `document`/APIs de browser).
4. **Handler** em `src/lib/server/mocks/handlers/<domínio>.ts` — funções que recebem `MockContext` e devolvem `Response`, usando `jsonResponse`, `MockHttpError`, `readSessionId` e `readJsonBody`/`isRecord`. **Valide a entrada** (corpo ausente/malformado, tipos e campos obrigatórios) e devolva `400` — o mock deve espelhar o contrato, não vazar `500`.
5. **Rota** em `src/lib/server/mocks/router.ts` — registre método + regex + domínio. Rotas específicas vêm **antes** das paramétricas (`/queue/metrics` antes de `/queue`; `/requests/:protocol/internal` antes de `/requests/:protocol`).

Exemplo mínimo (domínio fictício `status`):

```ts
// src/lib/server/mocks/config.ts
export type MockDomain = 'auth' | /* ... */ 'status';
export const MOCK_DOMAINS: Record<MockDomain, boolean> = { /* ... */ status: true };

// src/lib/server/mocks/data/status.ts
export function getStatus(): { status: string } {
	return { status: 'ok' };
}

// src/lib/server/mocks/handlers/status.ts
import { getStatus } from '../data/status';
import { jsonResponse } from '../http';

export function get(): Response {
	return jsonResponse(getStatus());
}

// src/lib/server/mocks/router.ts
import * as statusHandlers from './handlers/status';
// ...
{ method: 'GET', domain: 'status', pattern: /^\/status$/, handle: statusHandlers.get },
```

Restrições ao escrever em `src/lib/server/mocks/`:

- use **imports relativos** (`../http`, `../../../types/...`): o `vite.config` carrega esses módulos fora do resolver do app, então `$lib` não resolve em runtime;
- não importe `$app/*`, `$env/*` nem APIs de browser — o código roda no middleware do dev server;
- os `*.api.ts` do app permanecem sem qualquer branch de mock.

### Obrigatoriedade do padrão

Esse formato mantém o frontend desacoplado do backend (dev e testes sem API) e garante que o código de mock nunca entre no build de produção. Toda integração nova com o backend nasce acompanhada do mock correspondente: domínio em `MOCK_DOMAINS`, rota/handler/fixtures em `src/lib/server/mocks/` e `*.api.ts` limpo.

---

## 11. Utils e constants

### Utils

A pasta `utils/` contém funções genéricas e reutilizáveis, como:

- formatação de datas;
- formatação de protocolos;
- tratamento de mensagens de erro;
- manipulação de parâmetros de URL;
- debounce.

Uma função que representa uma regra específica do MAAT deve pertencer a um service, e não a `utils/`.

### Constants

A pasta `constants/` contém valores fixos utilizados em diferentes partes do projeto.

---

## 12. Routes

A pasta `routes/` segue o sistema de rotas baseado em arquivos do SvelteKit.

Os principais arquivos utilizados são:

- `+page.svelte`: define o conteúdo de uma página.
- `+layout.svelte`: define um layout compartilhado entre uma rota e suas subrotas.

Exemplo:

```text
routes/
├── +page.svelte
├── login/
│   └── +page.svelte
└── +layout.svelte
```

Nesse exemplo:

- `+page.svelte` representa a página `/`;
- `login/+page.svelte` representa a página `/login`;
- `+layout.svelte` pode conter elementos compartilhados entre as páginas.

Caso seja necessário organizar grupos de rotas, o SvelteKit permite utilizar grupos:

```text
routes/
├── (public)/
├── (app)/
└── (admin)/
```

- `(public)`: páginas públicas (anônimos e Solicitante);
- `(app)`: páginas de qualquer usuário autenticado — `guard('anySession')`;
- `(admin)`: páginas das áreas internas (Analista, Gestor, Administrador) — `guard('internalArea')`.

Os grupos entre parênteses organizam as rotas sem alterar diretamente a URL e devem ser criados conforme a necessidade do projeto.

**Grupo ≠ perfil.** O perfil do usuário (Solicitante, Analista, Gestor, Administrador) nunca gera um novo grupo de rotas; é resolvido na tabela `GUARD_RULES` do access service (`src/lib/services/access.service.ts`). Um futuro perfil Gestor, por exemplo, é uma linha em `profiles` de uma regra — não um grupo `(gestor)/`.

O grupo `(admin)` tem papel de guard server-side (não define layout visual): o Header permanece único, com navegação por perfil.

**Colocação de componentes.** Componentes específicos de uma página podem ficar colocalizados em `routes/.../components/` (padrão suportado pelo SvelteKit: arquivos sem prefixo `+` nunca se tornam rotas). Componentes reutilizados por várias páginas pertencem a `lib/components/`.

### Regra da home

O logo e o item "Home" da navegação apontam sempre para `/`; a decisão de "qual é a home por contexto" vive em um único lugar no servidor (`(public)/+page.server.ts`, via access service):

- anônimo → permanece na home pública;
- Solicitante autenticado → permanece na home pública;
- Analista/Gestor/Administrador → `redirect(303, '/home')`.

Nenhum `href` na UI é fixado em `/home`.

---

## 13. Dependências permitidas

```text
components → services, states, types, utils e constants
pages      → components, services, states e types
states     → services e types
config     → api, types e utils
services   → api, types, utils e constants
api        → types e utils
```

> `src/lib/server/mocks/` é código dev-only carregado apenas pelo plugin do Vite;
> não faz parte das camadas do app nem do build de produção.

---

## 14. Organização por funcionalidade

A estrutura inicial será organizada por responsabilidade:

```text
lib/
├── api/
├── services/
├── components/
├── types/
├── states/
└── server/mocks/   # API mock dev-only (fora do build)
```

Caso uma funcionalidade cresça muito, seus arquivos podem ser agrupados:

```text
features/
└── users/
    ├── components/
    ├── services/
    ├── types/
    ├── mocks/
    └── index.ts
```

A pasta `features/` não precisa ser criada no início. Ela deve ser adotada somente quando melhorar a organização do projeto.

---

## 15. Regras gerais

- Não realizar chamadas HTTP diretamente em componentes reutilizáveis.
- Não colocar regras extensas dentro de páginas.
- Não criar estados compartilhados para estados que podem permanecer locais.
- Não utilizar `any`. Todo o código deve possuir tipagem.
- Manter os tipos sincronizados com o backend.
- O backend deve validar definitivamente todas as permissões e regras.

---

## 16. Dados no SSR, sessão e CORS

O carregamento de dados que depende da API acontece no servidor. Esta seção fixa as regras para preservar a sessão (cookie) e evitar bloqueios de CORS no SSR.

### 16.1 Onde cada `load` roda

- `+page.server.ts` / `+layout.server.ts` (server load): rodam sempre no servidor — lugar dos dados da nossa API.
- `+page.ts` / `+layout.ts` (load universal): rodam no servidor durante o SSR e no browser. O SvelteKit aplica a eles o modelo CORS do browser também no servidor; por isso ficam restritos a APIs externas.

Regra prática:

- dado da nossa API → **server load**;
- load universal apenas para **API externa sem credenciais**.

### 16.2 Sessão (cookie) no servidor

- No SSR, o `fetch` global do Node não carrega o cookie da página. O `fetch` com credencial é o fornecido ao `load` (`event.fetch`).
- O `apiClient` (`src/lib/api/client.ts`) exige esse `fetch` explicitamente: no servidor, sem `fetchImpl`, lança erro em vez de perder a sessão silenciosamente.
- O `fetch` do load é repassado pela cadeia `load → service → api → apiClient` (`fetchImpl` opcional; obrigatório em todo caminho de SSR).
- O `fetch` do load encaminha cookie quando o destino é o mesmo host do app ou um subdomínio mais específico (porta não conta). Para domínios irmãos (ex.: `app.x.com` → `api.x.com`), o `handleFetch` (`src/hooks.server.ts`) injeta o cookie dinamicamente. Ele só intercepta `event.fetch`.

### 16.3 CORS

- Load universal cross-origin exige `Access-Control-Allow-Origin` na resposta (igual à origem do app) — mais um motivo para dado da própria API ir em server load, que não aplica essa checagem.
- Chamadas feitas no browser (ex.: busca do `Header`) continuam sujeitas a CORS. Como o `apiClient` usa `credentials: 'include'`, o backend precisa responder `Access-Control-Allow-Origin` exato + `Access-Control-Allow-Credentials: true` (`*` não serve).

### 16.4 Fluxo

```text
load (server load)
   ↓ repassa event.fetch
service → api → apiClient(fetchImpl)
   ↓
Backend (recebe o cookie da sessão)
   ↓
dados → page.data
```

### 16.5 Verificação

- Em `src/lib/server/mocks/config.ts`, desligar um domínio (`MOCK_DOMAINS.request = false`) e validar um hard reload na rota: o proxy encaminha ao backend real, que deve receber o cookie, e o HTML do SSR deve vir com os dados.
- `npm run check` e `npm run lint`.

---

## 17. Resumo

```text
Types definem os dados.

API conversa com o backend.

Services aplicam regras e validações.

Estados compartilhados mantêm dados que precisam ser acessados em diferentes partes da aplicação.

Mocks simulam dados.

Components e routes constroem a interface.

O backend valida e persiste definitivamente.
```
