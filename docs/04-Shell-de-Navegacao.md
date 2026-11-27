# Shell de Navegação (Sidebar + Top Bar)

## 1. Objetivo

Este documento registra a substituição do antigo `Header` por uma barra lateral fixa
(`AppSidebar`) e uma barra superior (`AppTopBar`), conforme a referência de UX/UI do
portal (protótipo `prototipo uiux.png`).

A mudança vale para **todas as rotas**, com uma única exceção: a tela de login não
exibe a barra lateral.

---

## 2. O que mudou

| Antes                                                | Depois                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| Um `Header` horizontal com logo, busca, ações e menu | `AppShell` compondo `AppSidebar` + `AppTopBar` + conteúdo     |
| Navegação em barra horizontal abaixo do topo         | Navegação vertical na barra lateral                           |
| `Header` renderizado em cada grupo de rotas          | `AppShell` renderizado uma vez no layout raiz                 |
| `src/lib/components/Header.svelte`                   | Removido (sem uso após a migração)                            |
| Layout centralizado com padding no `.app-root`       | Layout full-bleed; centralização fica no `.content-container` |

A tela de login (`/login`) mantém o top bar, mas **sem a barra lateral**.

---

## 3. Arquitetura da solução

```text
src/routes/+layout.svelte
└── AppShell
    ├── AppSidebar   (oculto em /login)
    ├── AppTopBar
    └── conteúdo da rota (children)
        ├── (public)/+layout.svelte → página + Footer
        ├── (app)/+layout.svelte    → página
        └── (admin)/+layout.svelte  → página + Footer
```

### Componentes

| Componente   | Arquivo                                       | Responsabilidade                                                          |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| `AppShell`   | `src/lib/components/layout/AppShell.svelte`   | Compõe a estrutura, controla o menu mobile e a exceção do login           |
| `AppSidebar` | `src/lib/components/layout/AppSidebar.svelte` | Logo, navegação por perfil, item ativo, logout e comportamento off-canvas |
| `AppTopBar`  | `src/lib/components/layout/AppTopBar.svelte`  | Busca, ações, toggle de tema, perfil/“Acessar”                            |

O shell fica no layout raiz para garantir a mesma estrutura em todas as rotas e
evitar duplicação nos grupos `(public)`, `(app)` e `(admin)`.

---

## 4. Comportamento

### 4.1 Barra lateral

Itens exibidos conforme o perfil (resolvido por `isInternalProfile` e pelo papel):

| Item                | Rotas com acesso                | Destino                  |
| ------------------- | ------------------------------- | ------------------------ |
| Portal              | Todos                           | `/` ou `/home` (interno) |
| Nova Solicitação    | Todos                           | `/solicitacao`           |
| Acompanhamento      | Todos                           | `/acompanhar`            |
| Fila Centralizada   | Analista, Gestor, Administrador | `/fila`                  |
| Dashboard Gerencial | Gestor, Administrador           | `/dashboard`             |
| Histórico de Logs   | Gestor, Administrador           | `/historico-de-logs`     |
| Gerenciar Usuários  | Administrador                   | `/usuarios`              |
| Configurações       | Administrador                   | `/configuracoes`         |
| Sair                | Usuários autenticados           | Encerra a sessão         |

Observações:

- Os itens `Dashboard Gerencial`, `Gerenciar Usuários` e `Configurações` não aparecem
  no protótipo, mas foram mantidos para não remover acesso existente.
- O item ativo usa `aria-current="page"` e destaque visual; o `Portal` só é ativo na
  home correspondente ao contexto (público ou interno).
- O logout limpa o rascunho de solicitação, encerra a sessão e redireciona para `/login`.

### 4.2 Barra superior

- Busca:
  - usuário interno → navega para `/fila?search=...`;
  - demais perfis → consulta a API e abre o protocolo ou a tela de acompanhamento.
- Toggle de tema claro/escuro (oculto na tela de configurações, como antes).
- Bloco do usuário (nome, perfil e avatar) com link para `/perfil`.
- Usuário não autenticado vê o botão “Acessar”.
- Notificações e ajuda existem como **placeholders desabilitados** (“em breve”), pois
  ainda não há funcionalidade associada.

### 4.3 Exceção: login

`AppShell` compara `page.url.pathname` com `/login` e, nessa rota:

- não renderiza `AppSidebar`;
- não renderiza o botão de menu no top bar (`showMenu={false}`);
- o conteúdo ocupa toda a largura disponível.

---

## 5. Responsividade e acessibilidade

- A barra lateral tem largura fixa de 248px e usa `position: sticky` no desktop.
- Até 1024px, a barra lateral vira off-canvas:
  - abre pelo botão de menu no top bar;
  - fecha ao clicar em um item, no backdrop ou pressionar `Esc`;
  - fica com `visibility: hidden` quando fechada, removendo os links da ordem de foco.
- Navegação usa `aside` + `nav` com rótulos acessíveis; o backdrop é um `<button>`.
- Estados de foco visível foram preservados nos itens e ações.
- `prefers-reduced-motion` desativa a transição da sidebar.

---

## 6. Ajustes de layout

- `src/lib/styles/global.css`:
  - `.app-root` deixou de centralizar e de aplicar padding/gap; agora é apenas o
    wrapper de altura total com o fundo do tema;
  - `.content-container` passou a centralizar com `margin-inline: auto` e a aplicar
    `padding: var(--spacing-lg) var(--spacing-md)`.
- `src/routes/(public)/login/+page.svelte`: o wrapper do login passou a usar `flex: 1`
  para ocupar a área de conteúdo do shell.
- `src/lib/types/icons.ts`: adicionados `menu`, `notifications` e `help`.

---

## 7. Arquivos alterados

Criados:

- `src/lib/components/layout/AppShell.svelte`
- `src/lib/components/layout/AppSidebar.svelte`
- `src/lib/components/layout/AppTopBar.svelte`

Alterados:

- `src/routes/+layout.svelte`
- `src/routes/(public)/+layout.svelte`
- `src/routes/(app)/+layout.svelte`
- `src/routes/(admin)/+layout.svelte`
- `src/routes/(public)/login/+page.svelte`
- `src/lib/styles/global.css`
- `src/lib/types/icons.ts`

Removido:

- `src/lib/components/Header.svelte`

---

## 8. Validação

Executado com Node 24 (exigência do projeto):

```bash
npm run lint
npm run check
npm run build
```

Resultado: lint sem erros, build concluído e `svelte-check` com 0 erros
(permanecem 3 warnings pré-existentes de CSS não utilizado em `AssignAction.svelte`).

Nenhuma alteração foi commitada ou enviada ao repositório.

---

## 9. Como evoluir

- Novos itens de navegação devem ser adicionados em `AppSidebar.svelte`, seguindo o
  mesmo padrão de `NavItem` (`name`, `icon`, `href` via `resolve()` e regra de perfil).
- Ações globais (busca, notificações, ajuda, perfil) pertencem ao `AppTopBar`.
- Se uma nova rota não deve exibir a barra lateral, estenda a condição `showSidebar`
  no `AppShell` (mantendo a regra em um único lugar).
