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

| Elemento           | Padrão              | Exemplo            |
| ------------------ | ------------------- | ------------------ |
| Variável           | camelCase           | `currentUser`      |
| Função             | camelCase com verbo | `loadUsers`        |
| Componente         | PascalCase          | `UserTable.svelte` |
| Tipo / Interface   | PascalCase          | `UserRole`         |
| Constante global   | UPPER_SNAKE_CASE    | `MAX_FILE_SIZE`    |
| Arquivo TypeScript | kebab-case          | `auth.service.ts`  |
| Store              | `.store.ts`         | `auth.store.ts`    |
| Service            | `.service.ts`       | `user.service.ts`  |
| API                | `.api.ts`           | `user.api.ts`      |

A equipe deve manter um único padrão durante todo o projeto.

---

## 4. Padrões Svelte

Para manter o código alinhado às práticas do Svelte 5 e SvelteKit:

- Priorizar os recursos nativos e padrões idiomáticos do Svelte.
- Manter o estado local quando não houver necessidade de compartilhamento.
- Utilizar `$derived` para valores que podem ser derivados de outros estados, evitando duplicação de estado.
- Evitar o uso de `$effect` quando o comportamento puder ser representado por estado derivado.
- Evitar manipulação manual do DOM quando o comportamento puder ser implementado pelos recursos do Svelte.
- Manter clara a separação entre código executado no cliente e no servidor no SvelteKit.
- Consultar a documentação oficial do Svelte antes de introduzir soluções alternativas para comportamentos já suportados pelo framework.

Esses padrões podem ser revisados e ampliados conforme novas necessidades forem identificadas durante o desenvolvimento.

# 5. TypeScript

Sempre que possível:

- Não utilizar any. Todo o código deve possuir tipagem;
- utilizar interfaces e types;
- tipar parâmetros e retornos públicos;
- manter os tipos sincronizados com o backend.

---

# 6. Funções

Funções devem:

- possuir uma única responsabilidade;
- possuir nomes que representem ações;
- receber apenas as dependências necessárias;
- permanecer pequenas e objetivas.

---

# 7. Componentes

## 7.1 Componentes de UI

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

## 7.2 Componentes de funcionalidade

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

## 7.3 Componentes de Layout

São responsáveis pela estrutura da aplicação.

Exemplos:

- Header
- Sidebar
- DashboardLayout
- PageContainer

---

## 7.4 Props

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

## 7.5 Estados

Componentes que dependem de dados devem prever:

- carregamento;
- erro;
- lista vazia;
- sucesso;
- estado desabilitado;
- falta de permissão.

Toda interação deve possuir retorno visual para o usuário.

---

## 7.6 Header por perfil

O Header pode variar conforme o perfil do usuário.

Evite criar um Header completamente diferente para cada perfil.

Sempre que possível, utilize o mesmo componente, alterando apenas as opções disponíveis conforme as permissões do usuário.

---

## 7.7 Ícones

Os ícones devem utilizar um dicionário centralizado.

Isso evita repetição de nomes e facilita futuras alterações.

---

# 8. CSS

Evite estilos inline repetidos.

Sempre que possível:

- utilizar classes;
- utilizar os tokens do Design System;
- reutilizar componentes já existentes;
- evitar valores fixos espalhados pelo projeto.

---

# 9. Tratamento de Erros

Erros técnicos não devem ser exibidos diretamente ao usuário.

Apresente mensagens amigáveis e compreensíveis.

---

# 10. Comentários

Comentários devem explicar o motivo de uma decisão, e não repetir o que o código já demonstra.

Utilize comentários apenas quando realmente agregarem entendimento.

---

# 11. Booleanos

Variáveis booleanas devem representar perguntas.

Exemplos:

- `isLoading`
- `isActive`
- `hasPermission`
- `canEdit`
- `shouldRedirect`

---

# 12. Acessibilidade

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

# 13. Formatação

Antes de abrir um Pull Request, execute:

```bash
npm run format
npm run lint
npm run check
```

Todos os arquivos devem estar formatados e sem erros de lint.

---

# 14. Código Morto

Remova sempre que possível:

- imports não utilizados;
- variáveis não utilizadas;
- componentes abandonados;
- comentários antigos;
- `console.log` de depuração;
- código comentado sem justificativa.

---

# 15. Resumo

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
