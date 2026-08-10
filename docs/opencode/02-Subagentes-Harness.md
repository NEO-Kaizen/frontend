# Subagentes do Harness

Os **subagentes** do harness do projeto ficam em `.opencode/agents/` e apoiam o fluxo de
trabalho git e de revisão. Cada subagente é documentado em uma seção própria abaixo.

Para adicionar um novo subagente, crie o arquivo em `.opencode/agents/` e inclua uma nova
seção neste documento no mesmo formato, ordenando as seções em ordem alfabética.

---

## git-controller

O **git-controller** é o agente responsável por gerenciar operações git: branch, commit,
push, pull, status, diff e log, sempre seguindo os preceitos do projeto.

Ele compartilha um contexto comum com o **reviewer** — o fluxo de revisão — mas **também
pode ser usado de forma independente** para qualquer operação git.

### Quando utilizar

Utilize o **git-controller** quando quiser:

- criar uma branch no padrão `type/issue-number-short-description`;
- inspecionar o estado do repositório (status, diff, log);
- preparar ou executar um commit seguindo a convenção `type(scope): description`;
- validar o branch, a Issue relacionada e a ausência de dados sensíveis antes de commitar;
- sincronizar com a branch base (`pull`) ou enviar a branch (`push`).

### Uso independente

O **git-controller** pode ser invocado sozinho para qualquer operação git, sem depender do
fluxo de revisão. Exemplos:

- `git switch -c feat/7-create-agents-and-pr-commands` seguido de `git pull origin main`;
- consultar `git status`, `git diff` ou `git log --oneline -10` para entender o estado atual;
- preparar o staging e propor a mensagem de commit para os arquivos do harness.

### Uso em conjunto (fluxo de revisão)

No fluxo de revisão, o **git-controller** primeiro coleta o contexto git (branch, log,
arquivos alterados, diff, flags de preceitos) e entrega esse relatório ao **reviewer**, que
revisa o conteúdo com base nele.

---

## reviewer

O **reviewer** revisa a qualidade do conteúdo das alterações — código, documentação e
configuração — avaliando:

- clareza e separação de responsabilidades;
- consistência com o repositório (padrões de nomenclatura, estrutura e convenções locais);
- risco de integração com outros fluxos, contratos ou repositórios;
- validações executadas e evidências registradas;
- ausência de dados sensíveis (`.env`, tokens, credenciais) nas alterações.

### Quando utilizar

Utilize o **reviewer** quando quiser:

- uma revisão de conteúdo das alterações de uma branch;
- validar se uma mudança está consistente com os padrões do repositório;
- avaliar o risco de integração antes de abrir um Pull Request.

### Como funciona

- O **reviewer nunca aprova** — entrega um rascunho consolidado para confirmação humana.
- Ele recebe o relatório de contexto git do **git-controller** e não re-litiga os preceitos
  observáveis por git (formato de branch, convenção de commit, escopo).
- A revisão segue uma estrutura de Verdict, Comentários (com prefixos `[BLOCKER]`,
  `[SUGGESTION]`, `[QUESTION]`, `[NIT]`, `[PRAISE]`) e Checklist orientado à Definition
  of Done.

---

# Dicas

- Para operações git pontuais, chame o **git-controller** diretamente — ele não depende do
  fluxo de revisão.
- Para revisar uma mudança, use o comando `/revisar`, que orquestra os dois subagentes na
  ordem correta.
- Para gerar o texto de um Pull Request no padrão do projeto, use o comando `/criar-pr`.
- Em ambos os casos, informe o contexto necessário (branch, arquivos ou Issue) para respostas
  mais precisas.
