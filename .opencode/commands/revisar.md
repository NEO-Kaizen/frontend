---
description: Revisa as alterações do repositório (código, docs, config) quanto à qualidade de conteúdo, consistência com o repositório e risco de integração.
agent: plan
---

Você vai orquestrar uma revisão das alterações deste repositório seguindo o
fluxo do projeto NEO. **Não edite nenhum arquivo.**

## Passo 1 — Contexto git (via git-controller)

Invoque o subagente `git-controller` (tool `task`, subagent_type
`git-controller`) com este pedido:

> Produza um relatório de contexto de revisão, em modo somente leitura, sem
> alterar nada:
>
> 1. branch atual;
> 2. `git log --oneline main..HEAD` (ou fallback `git log --oneline -n 10`);
> 3. arquivos alterados (`git diff main...HEAD --name-only` ou
>    `git diff --name-only` / `git diff --cached --name-only` quando não
>    houver branch de trabalho);
> 4. resumo do diff (`git diff --stat` ou `git diff --cached --stat`);
> 5. flags de preceitos observáveis: formato da branch, convenção dos commits,
>    arquivos sensíveis (`.env`, tokens, credenciais) no staging, escopo
>    misturado, mudanças em `main`.

## Passo 2 — Revisão de conteúdo (via reviewer)

Invoque o subagente `reviewer` (tool `task`, subagent_type `reviewer`)
passando o relatório produzido no Passo 1 como contexto. Reforce que a
revisão deve focar em qualidade de conteúdo, consistência com o repositório
(lendo `AGENTS.md`, `README.md`, `docs/` e `package.json` do próprio repo) e
risco de integração — sem re-litigar os preceitos observáveis por git.

## Passo 3 — Saída final

Entregue o resultado consolidado da revisão (verdict, comentários com prefixos
`[BLOCKER]`/`[SUGGESTION]`/`[QUESTION]`/`[NIT]`/`[PRAISE]`, e checklist
orientado à Definition of Done), em português, diretamente na sua resposta.
Lembre de registrar que a revisão é um rascunho e que a aprovação final é
humana.

## Uso de argumentos

`$ARGUMENTS` pode trazer alvos específicos (branch, arquivos ou caminhos).
Quando presente, informe-os aos subagentes para limitar o escopo da revisão;
quando ausente, revise a mudança da branch atual.
