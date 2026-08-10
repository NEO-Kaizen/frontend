# Comandos do Harness

Os **comandos** do harness ficam em `.opencode/commands/` e são atalhos para fluxos
recorrentes do projeto. Cada comando é documentado em uma seção própria abaixo.

Para adicionar um novo comando, crie o arquivo em `.opencode/commands/` e inclua uma nova
seção neste documento no mesmo formato, ordenando as seções em ordem alfabética.

---

## /criar-pr

O comando **`/criar-pr`** gera o texto completo de uma Pull Request no padrão do projeto NEO,
pronto para cópia e colagem no GitHub.

### Quando utilizar

Utilize o **`/criar-pr`** quando tiver alterações prontas e quiser:

- montar o corpo de um PR no padrão do projeto (título, resumo, alterações, checklist);
- identificar automaticamente a área afetada para o `scope` do título;
- evitar esquecer seções obrigatórias (Issue relacionada, como validar, evidências).

### Como funciona

1. O comando investiga as alterações do repositório (status, diff, branch base).
2. Deriva o título no formato `type(scope): description` em inglês, a partir das mudanças.
3. Emite o corpo completo em português, com os cabeçalhos obrigatórios do padrão NEO.
4. Preenche o que for auto-detectável e deixa `<preencher>` (Issue, evidências) para o autor.

### Uso de argumentos

O comando aceita argumentos extras para contextualizar o PR, como o número da Issue:

```text
/criar-pr issue=7
```

### Regras principais

- **Não** usa `Closes #NNN` — o fechamento da Issue é manual.
- Título e código em inglês; **descrição em português**.
- Não inventa critérios, impactos ou evidências sem sustentação nas mudanças.
- Nada de dados sensíveis na saída — substitui por `[dado omitido]`.

---

## /revisar

O comando **`/revisar`** orquestra a revisão das alterações do repositório, unindo os dois
subagentes do harness: `git-controller` e `reviewer`.

### Quando utilizar

Utilize o **`/revisar`** quando quiser:

- uma revisão de conteúdo das alterações antes de abrir um Pull Request;
- avaliar qualidade, consistência com o repositório e risco de integração;
- um rascunho consolidado para revisão humana.

### Como funciona

1. **Contexto git (via git-controller):** o comando invoca o **git-controller** para produzir
   um relatório somente leitura (branch atual, log, arquivos alterados, diff, flags de
   preceitos observáveis, arquivos sensíveis no staging).
2. **Revisão de conteúdo (via reviewer):** o comando invoca o **reviewer** passando o
   relatório como contexto, para avaliar clareza, consistência com o repositório e risco de
   integração.
3. **Saída final:** o comando consolida o resultado — Verdict, comentários com prefixos
   `[BLOCKER]`/`[SUGGESTION]`/`[QUESTION]`/`[NIT]`/`[PRAISE]` e Checklist orientado à
   Definition of Done — em português.

### Uso de argumentos

O comando aceita alvos específicos para limitar o escopo da revisão:

```text
/revisar branch=feat/7-create-agents-and-pr-commands
```
