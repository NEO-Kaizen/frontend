# Visão Geral do Frontend

## 1. Objetivo

Este documento apresenta a visão geral do frontend do **Projeto NEO**.

O NEO é uma aplicação web interna destinada ao recebimento, organização, triagem, priorização, delegação e acompanhamento de solicitações.

A documentação desta pasta define como o frontend deve ser organizado, desenvolvido, revisado e mantido pela equipe.

---

## 2. Tecnologias principais

| Tecnologia   | Finalidade                                                               |
| ------------ | ------------------------------------------------------------------------ |
| Svelte 5     | Construção dos componentes e da interface                                |
| SvelteKit    | Rotas, layouts, carregamento de dados e estrutura da aplicação           |
| TypeScript   | Tipagem estática e maior segurança no desenvolvimento                    |
| Vite         | Servidor de desenvolvimento, build e pré-visualização da aplicação       |
| CSS          | Estilização da aplicação e implementação do Design System                |
| Svelte Check | Verificação de tipos, props, bindings e validação dos componentes Svelte |
| ESLint       | Análise estática e identificação de problemas no código                  |
| Prettier     | Formatação automática e padronização do código                           |

---

## 3. Perfis de usuário

O sistema possui diferentes perfis, com permissões distintas.

| Perfil      | Responsabilidades principais                                           |
| ----------- | ---------------------------------------------------------------------- |
| Root | Gerencia administradores e possui permissões administrativas especiais |
| Admin       | Gerencia usuários, visualiza solicitações e delega solicitações        |
| Analista    | Visualiza solicitações atribuídas e realiza atendimentos               |
| Gestor      | Visualiza e acompanha solicitações                                     |
| Solicitante | Cria e acompanha suas próprias solicitações                            |

### Regras preliminares

- O sistema terá um usuário Root configurado previamente no banco de dados.
- O usuário Root será responsável por cadastrar os demais usuários do sistema.
- Um Admin pode criar outros administradores, conforme a regra definida pelo backend.
- Um Admin comum não pode excluir ou desativar a si mesmo.
- Somente o root pode desativar outros administradores.
- Usuários e registros não devem ser apagados definitivamente.
- A remoção funcional deve ocorrer por meio de desativação.
- O Solicitante não pode alterar o próprio perfil.
- Analistas e Gestores também podem criar solicitações.
- O Admin pode delegar solicitações, mas não deve alterar indevidamente o conteúdo criado por outros usuários.
- Uma solicitação deverá possuir três sugestões de horários obrigatórias, conforme regra de negócio.

> As regras definitivas devem ser confirmadas com Produto e Backend.

---

## 4. Objetivos técnicos

O frontend deve:

- Ser fácil de entender por novos integrantes;
- Utilizar TypeScript de forma segura;
- Separar apresentação, regra de negócio e acesso a dados;
- Evitar chamadas diretas à API dentro de componentes visuais;
- Permitir a troca de mocks por uma API real sem grandes alterações;
- Centralizar padrões visuais;
- Respeitar permissões por perfil;
- Fornecer mensagens claras de carregamento, sucesso e erro;

---

## 5. Princípios do projeto

### 5.1 Simplicidade

- Não adicionar uma abstração sem necessidade real.
- Evite criar estruturas antecipadamente apenas para necessidades que ainda não existem no projeto.
- A arquitetura deve priorizar soluções simples e adequadas às necessidades atuais do projeto.

### 5.2 Separação de responsabilidades

- Cada arquivo deve ter uma única responsabilidade principal.
- Evitar concentrar múltiplas funções ou lógicas não relacionadas no mesmo lugar.
- Facilitar manutenção, testes e evolução do código

### 5.3 Código explícito

- Usar nomes claros e descritivos.
- Garantir comportamentos previsíveis.
- Evitar abstrações excessivas ou “magia” que esconda a lógica real.
---

## 6. Organização da documentação

| Documento                       | Conteúdo                                    |
| ------------------------------- | ------------------------------------------- |
| `01-Visao-Geral.md`             | Objetivo, tecnologias, perfis e princípios  |
| `02-Arquitetura-Frontend.md`    | Camadas e fluxo da aplicação                |
| `03-Padrões-de-Desenvolvimento.md`       | Regras de TypeScript, Svelte e nomenclatura |

---

## 7. Escopo inicial do MVP

O MVP deve priorizar os fluxos mínimos necessários para demonstrar a aplicação.

Possíveis itens iniciais:

1. página login;
2. sessão do usuário;
3. página inicial;
4. componentes globais

> A priorização final deve ser validada com Produto.

---

## 8. Definição de pronto

Uma tarefa de frontend é considerada concluída quando:

- Atende aos critérios de aceitação.
- Possui tipagem correta.
- Não utilizar any. Todo o código deve possuir tipagem.
- Segue o Design System.
- Trata loading, erro, vazio e sucesso.
- Respeita permissões.
- Passa no svelte-check.
- Passa no lint.
- Realiza o build sem erros.
- Passou por revisão.
- Os fluxos afetados foram validados após a alteração.
