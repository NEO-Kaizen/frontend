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
│   │   ├── solicitation.ts
│   │   ├── queue.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   │
│   ├── api/
│   │   ├── client.ts
│   │   ├── user.api.ts
│   │   ├── solicitation.api.ts
│   │   ├── queue.api.ts
│   │   ├── auth.api.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── solicitation.service.ts
│   │   ├── assignment.service.ts
│   │   ├── queue.service.ts
│   │   ├── auth.service.ts
│   │   └── index.ts
│   │
│   ├── mocks/
│   │   ├── users.ts
│   │   ├── solicitations.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   │
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── toast.store.ts
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   ├── users/
│   │   └── solicitation/
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
Store ou página
   ↓
Interface
```

Nem toda operação precisa utilizar uma store. Estados utilizados apenas em uma página ou componente devem permanecer locais.

---

## 4. Responsabilidades

| Camada               | Responsabilidade                                          |
| -------------------- | --------------------------------------------------------- |
| Página ou componente | Interface, eventos, loading e mensagens                   |
| Store                | Estado compartilhado entre diferentes partes da aplicação |
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
- chamar services ou stores;
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

A pasta `types/` não deve realizar requisições, acessar stores ou conter regras de negócio.

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

## 9. Stores

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

## 10. Mocks

A pasta `mocks/` contém dados fictícios utilizados enquanto o backend ainda não estiver disponível ou durante testes.

Os mocks devem:

- utilizar apenas dados fictícios;
- seguir os tipos definidos no projeto;
- representar diferentes cenários;
- incluir sucesso, vazio, erro e diferentes status;
- nunca utilizar informações reais de clientes ou usuários.

---

## 11. Utils e constants

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

## 12. Routes

A pasta `routes/` segue o sistema de rotas baseado em arquivos do SvelteKit.

Sugestão de grupos (sujeito a mudanças):

```text
routes/
├── (public)/
├── (app)/
└── (admin)/
```

- `(public)`: páginas públicas, como login;
- `(app)`: páginas disponíveis para usuários autenticados;
- `(admin)`: páginas administrativas.

Os grupos entre parênteses organizam as rotas sem alterar diretamente a URL.

---

## 13. Dependências permitidas

```text
components → services, stores, types, utils e constants
pages      → components, services, stores e types
stores     → services e types
services   → api, types, mocks, utils e constants
api        → types e utils
mocks      → types
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
└── stores/
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
- Não criar stores para estados locais.
- Não utilizar any. Todo o código deve possuir tipagem.
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
