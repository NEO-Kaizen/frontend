---
name: frontend-architecture
description: Essa skill define como as partes do frontend do Projeto NEO se relacionam e quais são as responsabilidades de cada camada, arquitetura separada que busca uma estrutura simples, organizada e preparada para crescer sem criar camadas desnecessárias.
metadata:
  version: '1.0'
  tags: [arquitetura front-end, estrutura do projeto, fluxo.]
---

# Arquitetura do Frontend

## 1. Objetivo

Este documento define como as partes do frontend do Projeto NEO se relacionam e quais são as responsabilidades de cada camada.

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
Store ou estado local
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
State ou página
   ↓
Interface
```

Nem toda operação precisa utilizar estado compartilhado. Estados utilizados apenas em uma página ou componente devem permanecer locais.

## 4. Componentes e páginas

Componentes e páginas são responsáveis pela interface e pela interação com o usuário.

Devem:

- exibir dados;
- capturar eventos;
- controlar estados visuais;
- chamar services ou states;
- mostrar loading, erro, vazio e sucesso;
- evitar conhecer detalhes de endpoints;
- evitar concentrar regras de negócio.

---

## 5. Types

A pasta `types/` representa as estruturas utilizadas no projeto.

Pode conter:

- interfaces;
- tipos;
- unions;
- estruturas de entrada e saída;
- filtros;
- paginação;
- autenticação.

> **Importante:** Os tipos do frontend devem representar fielmente o contrato da API. Os exemplos e estruturas iniciais deverão ser atualizados conforme as definições do backend.

A pasta `types/` não deve realizar requisições, acessar states ou conter regras de negócio.

---

## 6. API

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

## 7. Services

A pasta `services/` reúne as operações e regras da aplicação.

Os services podem:

- aplicar regras do frontend;
- validar formulários;
- validar dados recebidos da API;
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

## 8. Stores

Stores mantêm estados compartilhados entre diferentes partes da aplicação.

Exemplos:

- usuário autenticado;
- sessão;
- notificações globais;
- preferências compartilhadas;
- filtros utilizados em diferentes componentes.

Stores não devem ser criadas para qualquer variável.

Estados utilizados somente por uma página, componente, formulário ou modal devem permanecer locais.

Stores não substituem:

- API;
- backend;
- banco de dados;
- cookies;
- validação de sessão no servidor.

---

## 9. Mocks

Em desenvolvimento a API é simulada por um mock server-side dev-only, servido pelo middleware do Vite sob `/__mock/**` (`src/lib/server/mocks/`, plugin `apply: 'serve'`). O app fala HTTP de verdade (cookie de sessão, multipart, paginação/filtros) e o SSR consome a mesma API.

Os dados são fictícios e devem:

- seguir os tipos definidos no projeto;
- representar diferentes cenários;
- incluir sucesso, vazio, erro e diferentes status;
- nunca utilizar informações reais de clientes ou usuários.

Usar: em dev `PUBLIC_API_URL=/__mock`; para o backend real, aponte para a URL absoluta da API. `src/lib/server/mocks/config.ts` tem `USE_MOCK_API` (global) e `MOCK_DOMAINS` (por domínio); domínio `false` vai por proxy para `PUBLIC_REAL_API_URL`. Personas de login: `analista@maat.com.br`/`admin`, `admin@maat.com.br`/`admin`, `gestor@maat.com.br`/`admin`, `solicitante@maat.com.br`/`temp123` (os dois últimos forçam troca de senha).

Criar um domínio/endpoint:

1. tipos em `src/lib/types/` + `*.api.ts` (só `apiClient`) + service;
2. domínio no union `MockDomain` e em `MOCK_DOMAINS` (`config.ts`);
3. fixtures em `data/<domínio>.ts` (dados fictícios, funções puras);
4. handler em `handlers/<domínio>.ts` (`MockContext` → `Response`, `jsonResponse`/`MockHttpError`);
5. rota em `router.ts` (rotas específicas antes das paramétricas).

Restrições: imports relativos (o `vite.config` carrega esses módulos fora do resolver do app, então `$lib` não resolve em runtime), sem `$app/*`/`$env/*`/APIs de browser, e `*.api.ts` sem lógica de mock. O plugin não entra no build de produção.

Guia completo (endpoints, desligar mock, exemplo, troubleshooting): `docs/02-Arquitetura-Frontend.md` §10.

---

## 10. Utils e constants

### Utils

A pasta `utils/` contém funções genéricas e reutilizáveis, como:

- formatação de datas;
- formatação de protocolos;
- tratamento de mensagens de erro;
- manipulação de parâmetros de URL;
- debounce.

Uma função que representa uma regra específica do NEO deve pertencer a um service, e não a `utils/`.

### Constants

A pasta `constants/` contém valores fixos utilizados em diferentes partes do projeto

---

## 11. Routes

A pasta `routes/` segue o sistema de rotas baseado em arquivos do SvelteKit.

- `(public)`: páginas públicas, como login;
- `(app)`: páginas de qualquer usuário autenticado — `guard('anySession')`;
- `(admin)`: páginas das áreas internas (Analista, Gestor, Administrador) — `guard('internalArea')`. Grupo tem papel de guard server-side, nunca de layout visual; perfil é resolvido no access service (`GUARD_RULES`), nunca criando grupos por perfil.

Os grupos entre parênteses organizam as rotas sem alterar diretamente a URL.

---

## 12. Dependências permitidas

```text
components → services, states, types, utils e constants
pages      → components, services, states e types
states     → services e types
services   → api, types, utils e constants
api        → types e utils
```

> `src/lib/server/mocks/` é código dev-only carregado só pelo plugin do Vite; não faz parte das camadas do app.

---

## 13. Organização por funcionalidade

A estrutura inicial será organizada por responsabilidade:

```text
lib/
├── api/
├── services/
├── components/
├── types/
├── mocks/
└── states/
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

## 14. Dados no SSR, sessão e CORS

- Dado da nossa API em rota renderizada no servidor → `+page.server.ts`/`+layout.server.ts` (server load). Load universal (`+page.ts`/`+layout.ts`) só para API externa sem credenciais.
- Em SSR, use o `fetch` do evento de load (nunca o global) e repasse-o por `load → service → api → apiClient`.
- O `fetch` do load encaminha o cookie do mesmo host/subdomínio; o `handleFetch` (`hooks.server.ts`) cobre domínios irmãos (só intercepta `event.fetch`).
- Server load não aplica o modelo CORS do browser; load universal cross-origin exige `Access-Control-Allow-Origin` exato.

---

## 15. Regras gerais

- Não realizar chamadas HTTP diretamente em componentes reutilizáveis.
- Não colocar regras extensas dentro de páginas.
- Não criar states para estados locais.
- Evitar o uso de `any`.
- Manter os tipos sincronizados com o backend.
- O backend deve validar definitivamente todas as permissões e regras.

---

## 16. Resumo

```text
Types definem os dados.

API conversa com o backend.

Services aplicam regras e validações.

Stores mantêm estado compartilhado.

Mocks simulam dados.

Components e routes constroem a interface.

O backend valida e persiste definitivamente.
```
