---
description: Gera o texto de uma Pull Request no padrão do projeto NEO
agent: plan
---

Você está no modo `plan`: leia e analise apenas, não edite nada. O seu
resultado final deve ser APENAS o texto de uma Pull Request pronta para
copia e colagem no GitHub, seguindo o padrão do projeto NEO.

## Investigação (somente leitura)

Invoque o subagente `git-controller` (tool `task`, subagent_type
`git-controller`) para coletar o contexto do repositório, em modo somente
leitura, com este pedido:

> Produza um relatório de contexto, sem alterar nada:
>
> 1. branch atual;
> 2. `git log --oneline main..HEAD` (ou fallback `git log --oneline -n 10`);
> 3. arquivos alterados (`git diff main...HEAD --name-only` ou
>    `git diff --name-only` / `git diff --cached --name-only` quando não
>    houver branch de trabalho);
> 4. resumo do diff (`git diff --stat` ou `git diff --cached --stat`);
> 5. flags de preceitos observáveis: formato da branch, convenção dos
>    commits, arquivos sensíveis (`.env`, tokens, credenciais), escopo
>    misturado, mudanças em `main`.

Depois de receber o relatório:

1. Leia arquivos novos relevantes listados pelo relatório, sem reproduzir
   credenciais, tokens, dados pessoais ou outros dados sensíveis.
2. Identifique qual área do produto foi tocada (para o `scope`).

Se não houver mudanças relevantes na branch ou no diretório de trabalho,
informe que não há material suficiente para gerar uma PR e não invente uma
descrição. Nesse caso, essa mensagem é a única exceção à saída em bloco de
código.

## Título

Derive o título no formato:

```
type(scope): description
```

em **inglês**, escolhendo o tipo correto a partir das mudanças:

| Tipo       | Uso                                              |
| ---------- | ------------------------------------------------ |
| `feat`     | Nova funcionalidade                              |
| `fix`      | Correção                                         |
| `docs`     | Documentação                                     |
| `refactor` | Reorganização sem mudança de comportamento       |
| `chore`    | Configuração, dependências ou manutenção         |
| `style`    | Alteração exclusivamente visual ou de formatação |

Exemplo: `# feat(login): implement login form`.

## Corpo

Emita o corpo completo em **português**, com estes cabeçalhos obrigatórios:

```
## Resumo
<explique o que foi alterado e por quê, em poucas frases>

## Alterações realizadas
-
-
-

## Issue relacionada
Issue principal: #<preencher>

Issues relacionadas:
- Nenhuma; ou
- #<preencher>

## Escopo não incluído
- Nenhum; ou
- <item deixado de fora>
- <item deixado de fora>

## Como validar
1. <passo reproduzível baseado nas mudanças>
2. <passo reproduzível baseado nas mudanças>
3. <passo reproduzível baseado nas mudanças>

## Evidências
Adicione capturas, vídeos, links, respostas da API, logs, diagramas ou
outras evidências aplicáveis. Se não houver evidência disponível, use
"A preencher".

## Impactos, dependências e limitações
<descreva ou "Nenhum impacto, dependência ou limitação conhecida.">

## Checklist do autor
- [ ] Revisei minhas próprias alterações.
- [ ] A alteração atende aos critérios de aceite.
- [ ] O PR está limitado ao escopo da Issue.
- [ ] Removi arquivos, logs e comentários temporários.
- [ ] Executei as validações disponíveis.
- [ ] Adicionei evidências quando aplicável.
- [ ] Atualizei a documentação necessária.
- [ ] Não incluí credenciais, dados sensíveis ou informações restritas.
- [ ] O PR está pronto para revisão.
```

## Regras do padrão NEO

- **Não** use `Closes #NNN` — o fechamento da Issue é feito manualmente;
  use o campo "Issue principal" para o número.
- Código/título em inglês; **descrição em português**.
- Preencha o que for auto-detectável a partir do diff; deixe `<preencher>`
  (Issue, evidências) para o autor completar à mão.
- Escopo único e coeso; não misture objetivos não relacionados.
- Não afirme que lint, typecheck, build ou testes foram executados sem
  evidência no contexto. Quando não for possível confirmar, use "A
  preencher".
- Não invente critérios de aceite, impactos, evidências ou comportamento que
  não possam ser sustentados pelas mudanças analisadas.
- Não inclua no resultado tokens, senhas, chaves, dados pessoais ou conteúdo
  restrito encontrado em arquivos ou no diff; substitua por `[dado omitido]`.
- Se houver pendências que impeçam a revisão completa, inclua antes do
  checklist a seção `## Estado atual` com `Este PR está em rascunho.` e uma
  lista de pendências marcada com `- [ ]`.

## Uso de argumentos

`$ARGUMENTS` traz contexto extra que o usuário digitou, como número da Issue
ou critérios adicionais. Incorpore-os no texto quando aplicável; ex.:

```
/criar-pr issue=32
```

## Saída

Entregue **apenas** o bloco final com o título no formato `# type(scope):
description` e o corpo da PR, em um único bloco de código para o usuário
copiar e colar. Nada além disso.
