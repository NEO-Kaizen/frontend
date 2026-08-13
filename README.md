# NEO

O **NEO** é uma aplicação voltada para a **gestão de solicitações**, permitindo a abertura, acompanhamento e gerenciamento de demandas de forma centralizada.

A aplicação possui diferentes níveis de acesso, permitindo que **solicitantes, analistas, gestores e administradores** tenham acesso às funcionalidades de acordo com suas responsabilidades.

> 🚧 **Projeto em desenvolvimento.** Novas funcionalidades serão adicionadas ao longo das próximas Sprints.

## Sumário

* [Tecnologias](#tecnologias)
* [Instalação](#instalação)
* [Funcionalidades](#funcionalidades)
* [Considerações Técnicas](#considerações-técnicas)

  * [Arquitetura do Projeto](#1-arquitetura-do-projeto)
  * [SvelteKit e Organização de Rotas](#2-sveltekit-e-organização-de-rotas)
  * [TypeScript para Segurança de Tipos](#3-typescript-para-segurança-de-tipos)
  * [Componentes Reutilizáveis](#4-componentes-reutilizáveis)
  * [Autenticação e Controle de Acesso](#5-autenticação-e-controle-de-acesso)
* [Equipe](#equipe)

## Tecnologias

![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=for-the-badge\&logo=svelte\&logoColor=white)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge\&logo=svelte\&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-663399?style=for-the-badge\&logo=css\&logoColor=white)

## Instalação

Para rodar o projeto localmente, siga os passos abaixo:

1. Clone o repositório:

```bash
git clone https://github.com/NEO-Kaizen/frontend.git
```

2. Navegue até o diretório do projeto:

```bash
cd frontend
```

3. Instale as dependências:

```bash
npm install
```

4. Configure as variáveis de ambiente utilizando o arquivo `.env.example` como referência.

5. Inicie a aplicação:

```bash
npm run dev
```

Para iniciar e abrir automaticamente no navegador:

```bash
npm run dev -- --open
```

## Funcionalidades

* **Página inicial:** apresenta o portal e permite o acesso às principais funcionalidades da aplicação.
* **Autenticação:** permite o acesso de usuários às áreas restritas do sistema.
* **Abertura de solicitações:** permite registrar novas demandas.
* **Acompanhamento de solicitações:** possibilita consultar o andamento e os detalhes das solicitações.
* **Fila de solicitações:** permite que analistas visualizem e gerenciem demandas.
* **Dashboard:** disponibiliza informações para acompanhamento das solicitações.
* **Histórico:** permite acompanhar registros e atividades realizadas no sistema.
* **Gerenciamento de usuários:** permite que administradores realizem o gerenciamento dos usuários da aplicação.
* **Controle de acesso:** disponibiliza funcionalidades de acordo com o perfil e as permissões do usuário.

> Algumas funcionalidades ainda estão em desenvolvimento e serão disponibilizadas progressivamente.

## Considerações Técnicas

### 1. Arquitetura do Projeto

* **Separação de Responsabilidades:**
  O Front-end é organizado de forma que componentes, comunicação com API, regras da aplicação, estados compartilhados e tipos possuam responsabilidades bem definidas.

### 2. SvelteKit e Organização de Rotas

* **File-based Routing:**
  O projeto utiliza o sistema de rotas baseado em arquivos do SvelteKit.

As páginas são organizadas dentro de `src/routes`, utilizando grupos de rotas para separar diferentes contextos da aplicação.

```text
src/routes/
├── (public)/
└── (app)/
```

* **Grupos de Rotas:**
  Os grupos entre parênteses permitem organizar páginas e layouts sem alterar diretamente a URL exibida ao usuário.

Essa estrutura também prepara a aplicação para a implementação de diferentes layouts e regras de acesso.

### 3. TypeScript para Segurança de Tipos

* **Segurança do Código:**
  O TypeScript é utilizado para garantir maior segurança durante o desenvolvimento, reduzindo erros relacionados a tipos e tornando contratos entre componentes, services e APIs mais explícitos.

* **Padronização:**
  Interfaces e tipos são utilizados para representar informações importantes da aplicação, como usuários, autenticação, permissões e dados das solicitações.

O projeto prioriza tipagem explícita e evita o uso de `any`.

### 4. Componentes Reutilizáveis

* **Design System:**
  A aplicação utiliza componentes reutilizáveis para manter consistência visual e reduzir duplicação de código.

* **Tokens de Design:**
  Cores, tipografia, espaçamentos e outros valores visuais são centralizados em tokens CSS, facilitando a manutenção e garantindo maior consistência entre as páginas.

### 5. Autenticação e Controle de Acesso

* **Autenticação:**
  A aplicação está sendo preparada para integração com a API de autenticação do Backend.

A comunicação com o Backend é centralizada nas camadas de `api` e `services`, evitando que componentes realizem diretamente a lógica de comunicação HTTP.

* **Sessão:**
  A autenticação será baseada em sessão através de **cookies**, permitindo que o Backend seja responsável pela validação da sessão do usuário.

* **Perfis de Acesso:**
  O sistema prevê diferentes níveis de acesso:

| Perfil        | Principais acessos                         |
| ------------- | ------------------------------------------ |
| Solicitante   | Abrir e acompanhar solicitações            |
| Analista      | Gerenciar solicitações e acessar a fila    |
| Gestor        | Acompanhar solicitações e histórico        |
| Administrador | Gerenciar usuários e áreas administrativas |

As regras de acesso serão implementadas e refinadas conforme a evolução do projeto.

## Equipe

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/SabrinaZ8">
        <img src="https://avatars.githubusercontent.com/SabrinaZ8" width="80px;" alt="Sabrina Souza"/><br>
        <sub><b>Sabrina Souza</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/lucas3984">
        <img src="https://avatars.githubusercontent.com/lucas3984" width="80px;" alt="Lucas Gomes"/><br>
        <sub><b>Lucas Gomes</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/roliveirapereira">
        <img src="https://avatars.githubusercontent.com/roliveirapereira" width="80px;" alt="Rodrigo Oliveira"/><br>
        <sub><b>Rodrigo Oliveira</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/AlexandreGomes08">
        <img src="https://avatars.githubusercontent.com/AlexandreGomes08" width="80px;" alt="Alexandre Gomes"/><br>
        <sub><b>Alexandre Gomes</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/kayo-alves">
        <img src="https://avatars.githubusercontent.com/kayo-alves" width="80px;" alt="Kayo Alves"/><br>
        <sub><b>Kayo Alves</b></sub>
      </a>
    </td>
  </tr>

  <tr>
    <td align="center">
      <a href="https://github.com/Geana-Almeida">
        <img src="https://avatars.githubusercontent.com/Geana-Almeida" width="80px;" alt="Geana Almeida"/><br>
        <sub><b>Geana Almeida</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/AlexDeveloperOne">
        <img src="https://avatars.githubusercontent.com/AlexDeveloperOne" width="80px;" alt="Alexandre Silva"/><br>
        <sub><b>Alexandre Silva</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Sant117">
        <img src="https://avatars.githubusercontent.com/Sant117" width="80px;" alt="Wanuta"/><br>
        <sub><b>Wanuta Santos</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/gabriels548-source">
        <img src="https://avatars.githubusercontent.com/gabriels548-source" width="80px;" alt="Gabriel Soares"/><br>
        <sub><b>Gabriel Soares</b></sub>
      </a>
    </td>
  </tr>
</table>
