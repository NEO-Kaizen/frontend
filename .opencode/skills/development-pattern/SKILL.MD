---
name: development-pattern
description: Essa skill define os padrões de desenvolvimento adotados no frontend do Projeto NEO. Seu objetivo é manter o código organizado, consistente e de fácil manutenção, estabelecendo convenções para escrita de código, criação de componentes, nomenclatura, acessibilidade e boas práticas..
metadata:
  version: '1.0'
  tags:
    [
      convenções gerais,
      nomenclatura,
      funções,
      componentes de funcionalidades,
      componentes de layout,
      props
    ]
---

# Padrões de Desenvolvimento

## 1. Objetivo

Este documento define os padrões de desenvolvimento adotados no frontend do Projeto NEO.

Seu objetivo é manter o código organizado, consistente e de fácil manutenção, estabelecendo convenções para escrita de código, criação de componentes, nomenclatura, acessibilidade e boas práticas.

---

# 2. Convenções Gerais

Todo código desenvolvido deve priorizar:

- simplicidade;
- legibilidade;
- reutilização quando necessária;
- baixo acoplamento;
- responsabilidade única;
- consistência entre os arquivos do projeto.

Evite criar abstrações, componentes ou estruturas sem uma necessidade real.

---

# 3. Nomenclatura

| Elemento             | Padrão               | Exemplo                         |
| -------------------- | -------------------- | ------------------------------- |
| Elemento             | Padrão               | Exemplo                         |
| -------------------- | -------------------- | ------------------              |
| Variável             | camelCase            | `currentUser`                   |
| Função               | camelCase com verbo  | `loadUsers`                     |
| Componente           | PascalCase           | `UserTable.svelte`              |
| Tipo / Interface     | PascalCase           | `UserRole`                      |
| Constante global     | UPPER_SNAKE_CASE     | `MAX_FILE_SIZE`                 |
| Arquivo TypeScript   | kebab-case           | `auth.service.ts`               |
| Estado compartilhado | `.svelte.ts` (runes) | `auth.svelte.ts`                |
| Service              | `.service.ts`        | `user.service.ts`               |
| API                  | `.api.ts`            | `user.api.ts`                   |
| Mock (dev-only)      | `.ts` server-side    | `server/mocks/handlers/auth.ts` |

A equipe deve manter um único padrão durante todo o projeto.

---

# 4. TypeScript

Sempre que possível:

- evitar `any`;
- utilizar interfaces e types;
- tipar parâmetros e retornos públicos;
- manter os tipos sincronizados com o backend.

---

# 5. Funções

Funções devem:

- possuir uma única responsabilidade;
- possuir nomes que representem ações;
- receber apenas as dependências necessárias;
- permanecer pequenas e objetivas.

---

# 6. Componentes

## 6.1 Componentes de UI

São componentes reutilizáveis e independentes da regra de negócio.

Exemplos:

- Button
- Input
- Select
- Modal
- Badge
- Icon
- Table

Os componentes da pasta `ui/` não devem conhecer regras específicas do Projeto NEO.

---

## 6.2 Componentes de funcionalidade

Representam uma funcionalidade do sistema.

Exemplos:

- UserTable
- SolicitationCard
- AssignAnalystModal
- RequestStatusBadge

Podem utilizar:

- Types
- Services
- Stores
- Componentes de UI

---

## 6.3 Componentes de Layout

São responsáveis pela estrutura da aplicação.

Exemplos:

- Header
- Sidebar
- DashboardLayout
- PageContainer

---

## 6.4 Props

As props devem:

- possuir nomes claros;
- ser explicitamente tipadas;
- possuir valores padrão quando necessário;
- evitar configurações excessivas;
- representar apenas uma responsabilidade.

Evitar nomes genéricos como:

- `data`
- `item`
- `value`

Sempre que possível, utilizar nomes que representem exatamente o conteúdo recebido.

---

## 6.5 Estados

Componentes que dependem de dados devem prever:

- carregamento;
- erro;
- lista vazia;
- sucesso;
- estado desabilitado;
- falta de permissão.

---

# 7. Tratamento de Erros

Erros técnicos não devem ser exibidos diretamente ao usuário.

Apresente mensagens amigáveis e compreensíveis.

---

# 8. Comentários

Comentários devem explicar o motivo de uma decisão, e não repetir o que o código já demonstra.

Utilize comentários apenas quando realmente agregarem entendimento.

---

# 9. Booleanos

Variáveis booleanas devem representar perguntas.

Exemplos:

- `isLoading`
- `isActive`
- `hasPermission`
- `canEdit`
- `shouldRedirect`

---

# 10. Acessibilidade

Todo componente deve considerar:

- navegação por teclado;
- foco visível;
- contraste adequado;
- labels;
- textos alternativos;
- HTML semântico;
- mensagens de erro acessíveis.

Evite utilizar elementos que não possuem semântica adequada para ações interativas.

---

# 11. Formatação

Antes de abrir um Pull Request, execute:

```bash
npm run format
npm run lint
npm run check
```

Todos os arquivos devem estar formatados e sem erros de lint.

---

# 12. Código Morto

Remova sempre que possível:

- imports não utilizados;
- variáveis não utilizadas;
- componentes abandonados;
- comentários antigos;
- `console.log` de depuração;
- código comentado sem justificativa.

---

# 13. Carregamento de dados (loads)

- Dado da nossa API em rota renderizada no servidor → `+page.server.ts`/`+layout.server.ts` (server load); load universal (`+page.ts`/`+layout.ts`) só para API externa sem credenciais.
- Em SSR, use o `fetch` do evento de load (nunca o global) e repasse-o por `load → service → api → apiClient`.
- Sessão por cookie: o `fetch` do load cobre mesmo host/subdomínio; o `handleFetch` cobre domínios irmãos.

---

# 14. Resumo

Todo código desenvolvido deve seguir os princípios abaixo:

- simplicidade;
- legibilidade;
- tipagem adequada;
- reutilização consciente;
- responsabilidade única;
- acessibilidade;
- consistência entre componentes;
- organização;
- manutenção facilitada.
