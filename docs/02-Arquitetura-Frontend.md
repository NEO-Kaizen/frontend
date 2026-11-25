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
│   ├── mocks/
│   │   ├── users.mock.ts
│   │   ├── profiles.mock.ts
│   │   ├── requests.mock.ts
│   │   ├── auth.mock.ts
│   │   └── index.ts
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
- `isProtocol(value)` valida apenas a estrutura do protocolo (prefixo alfanumérico de 1 a 10 caracteres + dois blocos alfanuméricos de 4), sem exigir o `protocolMask` configurado — protocolos de outros prefixos são aceitos na busca; `protocolMask` permanece em `page.data.portalConfig` para exibição (placeholder) e configuração no admin;
- o tema (3 tokens de cor) é aplicado como exemplo/baseline no `+layout.svelte` via wrapper `.app-root` + diretivas `style:--*` (CSS custom properties): o wrapper é o container de layout (flex, centralização, `min-height: 100dvh`, fundo via `--background-color`), cobrindo o `body` — renderizado no SSR (sem `$effect`, sem flash) e reativo a `data`. Nota: o Svelte 5 não suporta interpolação `{expr}` em `<style>` (recurso removido do Svelte 4), e `:global()` só serve para CSS estático — por isso as custom properties reativas vão via `style:` num wrapper;
- configuração de portal (runtime) é diferente do toggle dev de mocks: o toggle dev de mock/API permanece **apenas** em `mocks/index.ts` (`dev` de `$app/environment`), inerte em produção; nenhum flag runtime do portal entra nos mocks. O mock/domínio `config` da API real será adicionado em `mocks/index.ts` quando o endpoint existir (#90);
- a aplicação do tema completo (tokens em páginas, flash minimizado) é escopo da issue #89; esta camada apenas prepara o transporte.

---

## 10. Mocks

A pasta `mocks/` contém dados fictícios utilizados enquanto o backend ainda não estiver disponível ou durante testes.

Os mocks devem:

- utilizar apenas dados fictícios;
- seguir os tipos definidos no projeto;
- representar diferentes cenários;
- incluir sucesso, vazio, erro e diferentes status;
- nunca utilizar informações reais de clientes ou usuários.

### Toggle central de mocks

Os mocks são controlados por `src/lib/mocks/index.ts` — único ponto para ligar/desligar:

- `MOCKS_ENABLED`: interruptor global (default do repositório: desligado; ligue localmente em desenvolvimento);
- `MOCK_DOMAINS`: toggle por domínio (`auth`, `users`, `profiles`, `request`; novos domínios entram aqui).

Regras:

- mocks existem apenas em desenvolvimento: em build de produção, as branches dos `*.api.ts` e os módulos de mock são eliminados do bundle;
- para testar com a API real, desligue o interruptor global (`MOCKS_ENABLED`) ou um domínio específico em `MOCK_DOMAINS` (mudança local, sem commit);
- os `*.api.ts` consomem o toggle com `import.meta.env.DEV` inline no ponto de chamada — o que garante a eliminação do import dinâmico no build de produção;
- feature flags em tempo de execução não pertencem aos mocks (pertencem à camada de app-config).

### Obrigatoriedade do padrão

Toda integração com o backend nasce acompanhada do mock correspondente, sempre neste formato:

- novos domínios entram em `MOCK_DOMAINS` (`src/lib/mocks/index.ts`);
- os `*.api.ts` consomem o toggle com `import.meta.env.DEV` inline no ponto de chamada, via import dinâmico do módulo de mock.

Esse formato garante duas coisas: o frontend funciona integralmente desacoplado do backend (desenvolvimento e testes sem API), e o código de mock nunca entra no bundle de produção. Mocks fora desse padrão — imports estáticos, flags em runtime lidas no build de produção — quebram uma das duas garantias e não devem ser introduzidos.

### Domínio `profiles`

O domínio `profiles` atende a gestão de perfis:

- `GET /profiles`: lista os perfis, incluindo inativos;
- `GET /profiles/keys`: catálogo de chaves, custódias permitidas, dependências e predicados de atribuição;
- `POST /profiles`: cria perfil;
- `PATCH /profiles/:id`: edição parcial de identidade, composição e flags;
- `PATCH /profiles/:id/status`: ativa/desativa perfil;
- `POST /profiles/:id/duplicate`: duplica um perfil.

Regras representadas no mock e na UI: nome único entre perfis ativos; perfil Root só editável pelo Root e nunca desativável; editar, ativar/desativar e duplicar exigem alvo estritamente abaixo da autoridade do ator (Root é exceção); desativação bloqueada por contagem de usuários; custódia concedível pelo ator; dependências e chaves fixas em `own` ou `global`; guarda atômica de composição + flags. As leituras mock são SSR-safe e não fazem gate de sessão (o `guardAny` do load cobre); as mutações exigem `profile:manage`.

O contrato assumido pelo frontend está tipado em [`src/lib/types/profile.ts`](../src/lib/types/profile.ts), com endpoints, payloads e regras descritos acima.

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

Exceção: helpers puros de autorização (`has`, `can`, `canGrantCustody`, `canEditProfile`) vivem em `utils/permission-checks.ts` para serem consumidos por UI, services e mocks sem criar ciclo. Regras que orquestram dados continuam nos services.

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
- `(app)`: páginas de qualquer usuário autenticado — `guardSession`;
- `(admin)`: páginas das áreas internas — `guardAny(ADMIN_AREA_KEYS)` no layout, com guards por chave nas páginas.

Os grupos entre parênteses organizam as rotas sem alterar diretamente a URL e devem ser criados conforme a necessidade do projeto.

**Grupo ≠ perfil.** O perfil do usuário nunca gera um novo grupo de rotas. O access service (`src/lib/services/access.service.ts`) expõe `has(chave)`, `hasAny(chaves)` e `can(chave, vínculo)` como funções puras sobre a sessão. Perfis customizados entram apenas pela lista efetiva de permissões devolvida por `/auth/me`.

**Alçada administrativa.** A autorização para gerenciar usuários é calculada por dominância estrita de permissões (`isAuthorityStrictlyBelow`), não por nome de Perfil, rótulo da sessão ou `isActive`. O service `src/lib/services/account-authority.service.ts` separa Perfis designáveis em formulários (ativos, não Root e abaixo do ator) de Perfis cujos usuários podem ser administrados (não Root e abaixo do ator, inclusive inativos). A identificação de Admin Root usa `user.isRoot`, a marca estável de `SessionUser`; o rótulo `role` serve apenas para exibição. Veja `docs/adr/0001-alcada-por-permissoes.md`.

O grupo `(admin)` tem papel de guard server-side (não define layout visual): o Header permanece único, com navegação anotada por chave e filtrada por `has`/`hasAny`.

**Colocação de componentes.** Componentes específicos de uma página podem ficar colocalizados em `routes/.../components/` (padrão suportado pelo SvelteKit: arquivos sem prefixo `+` nunca se tornam rotas). Componentes reutilizados por várias páginas pertencem a `lib/components/`.

### Regra da home

O logo e o item "Home" da navegação apontam sempre para `/`; o destino pós-login é calculado pelo access service a partir das chaves efetivas, nesta prioridade:

- `queue:read` → `/fila`;
- `reports:read` → `/dashboard`;
- `user:read` ou `profile:read` → `/usuarios`;
- chaves de leitura do portal → `/configuracoes`;
- `request:track` → `/acompanhar`;
- senão → `/sem-autorizacao`.

`returnTo` e a troca de senha pendente têm precedência sobre esse cálculo. Nenhum `href` na UI é fixado em um destino por perfil.

---

## 13. Dependências permitidas

```text
components → services, states, types, utils e constants
pages      → components, services, states e types
states     → services e types
config     → api, types e utils
services   → api, types, mocks, utils e constants
api        → types e utils
mocks      → types e utils
```

---

## 14. Organização por funcionalidade

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

- Desligar localmente o domínio de mock (`MOCK_DOMAINS.request`) e validar um hard reload na rota: o backend deve receber o cookie e o HTML do SSR deve vir com os dados.
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
