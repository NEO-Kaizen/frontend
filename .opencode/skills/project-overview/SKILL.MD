---
name: project-overview
description: Visão geral do Projeto NEO, mais especificamente o frontend. Use esta skill para acessar contexto específico do projeto.
metadata: 
  version: "1.0" 
  tags: [visão geral do projeto, regras projeto, contexto do projeto, review] 
---

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
| Super Admin | Gerencia administradores e possui permissões administrativas especiais |
| Admin       | Gerencia usuários, visualiza solicitações e delega solicitações        |
| Analista    | Visualiza solicitações atribuídas e realiza atendimentos               |
| Gestor      | Visualiza e acompanha solicitações                                     |
| Solicitante | Cria e acompanha suas próprias solicitações                            |

### Regras já identificadas

- O primeiro usuário administrativo será configurado como usuário root ou Super Admin.
- Um Admin pode criar outros administradores, conforme a regra definida pelo backend.
- Um Admin comum não pode excluir ou desativar a si mesmo.
- Somente o Super Admin pode desativar outros administradores.
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

- ser fácil de entender por novos integrantes;
- utilizar TypeScript de forma segura;
- separar apresentação, regra de negócio e acesso a dados;
- evitar chamadas diretas à API dentro de componentes visuais;
- permitir a troca de mocks por uma API real sem grandes alterações;
- centralizar padrões visuais;
- respeitar permissões por perfil;
- fornecer mensagens claras de carregamento, sucesso e erro;

## 5. Organização da documentação

| Documento                       | Conteúdo                                    |
| ------------------------------- | ------------------------------------------- |
| `01-Visao-Geral.md`             | Objetivo, tecnologias, perfis e princípios  |
| `02-Arquitetura-Frontend.md`    | Camadas e fluxo da aplicação                |
| `03-Padrões-de-Desenvolvimento.md`       | Regras de TypeScript, Svelte e nomenclatura |

---

## 6. Escopo inicial do MVP

O MVP deve priorizar os fluxos mínimos necessários para demonstrar a aplicação.

Possíveis itens iniciais:

1. página login;
2. sessão do usuário;
3. página inicial;
4. componentes globais

> A priorização final deve ser validada com Produto.

---

## 7. Definição de pronto

Uma tarefa de frontend é considerada concluída quando:

- atende aos critérios de aceitação;
- possui tipagem correta;
- não utiliza `any` sem justificativa;
- segue o Design System;
- trata loading, erro, vazio e sucesso;
- respeita permissões;
- passou por revisão;
- não quebra funcionalidades existentes;