# Roteiro de apresentação e teste manual — RF04

**Público-alvo:** pessoa que vai apresentar a funcionalidade e a IA que estiver apoiando essa pessoa.  
**Branch:** `feat/rf04-search-states-permissions`  
**PR:** https://github.com/NEO-Kaizen/frontend/pull/241  
**Duração estimada:** 30 a 40 minutos.

Este documento é autocontido: siga exatamente as seções, na ordem indicada, sem precisar de conversa anterior.

---

## 1. O que este roteiro valida

Valida apenas o **frontend**, usando **mocks locais**, os seguintes pontos:

- busca pública por protocolo e por e-mail;
- validação pública de identidade antes de exibir dados;
- estados de carregamento, vazio e erro;
- busca na fila interna com debounce;
- paginação com clamp;
- observações internas;
- matriz de permissões por perfil;
- diferença de comportamento da busca global entre público, Solicitante e perfis internos.

Não valida neste roteiro:

- integração com backend real;
- busca ampliada por descrição, problema ou observação interna;
- correções pendentes do backend;
- RBAC da Rodada 01 que ainda não está na `main`.

Para o que ainda depende do backend, consulte `spec/contrato-pendencias-integracao-rf04.md` no diretório raiz do projeto.

---

## 2. Como usar este documento

### Para a pessoa

1. Execute a **Seção 3 — Preparação**.
2. Abra o navegador em `http://127.0.0.1:5173/`.
3. Execute os passos da **Seção 5 — Roteiro**, na ordem.
4. Para cada passo, registre `OK` ou `NOK` na **Seção 6 — Registro**.
5. Se algo divergir do esperado, pare e registre; não corrija o código durante a apresentação.

### Para a IA da pessoa

- Use **somente** este documento como fonte do roteiro.
- Não invente valores, fluxos ou expectativas.
- Não execute `git add`, `git commit`, `git push`, `merge`, `rebase`, `reset` ou `checkout`.
- Não altere código, exceto a habilitação local do toggle de mocks descrita na Seção 3, se ela ainda não estiver feita.
- Não use dados reais; todos os dados aqui são fictícios.
- Ao executar comandos, explique antes o que eles fazem.
- Se houver divergência, reporte no formato:

```text
PASSO X — NOK
Esperado: ...
Obtido: ...
Ação recomendada: parar e registrar
```

- Ao final, resuma apenas: passos executados, passos OK, passos NOK e arquivos alterados localmente.

---

## 3. Preparação

### 3.1. Verifique o repositório

Estamos no frontend:

```bash
cd /home/geana/Documentos/estudos/projeto/frontend
pwd
```

O retorno deve ser:

```text
/home/geana/Documentos/estudos/projeto/frontend
```

### 3.2. Verifique a versão do Node

O projeto exige Node `>=24 <25`. Se o Node atual for inferior, use o Node temporário já instalado:

```bash
PATH=/tmp/opencode/node24/node_modules/node/bin:$PATH node -v
```

Esperado: `v24.x.x`.

Se não existir esse caminho, instale:

```bash
npm install node@24 --prefix /tmp/opencode/node24 --no-save
```

Também é válido usar `nvm use 24`, se disponível.

### 3.3. Habilite os mocks

Abra `src/lib/mocks/index.ts` e confirme a linha 5:

```ts
export const MOCKS_ENABLED = true;
```

Se estiver `false`, altere para `true`.

Depois do commit desta alteração, ela passa a vir com a branch. Em produção, `dev` é constante `false` e as branches de mocks são eliminadas do bundle.

### 3.4. Suba o servidor

```bash
PATH=/tmp/opencode/node24/node_modules/node/bin:$PATH npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Esperado no terminal:

```text
VITE v8.2.0  ready
➜  Local:   http://127.0.0.1:5173/
```

Em outro terminal, confirme:

```bash
curl -s -o /dev/null -w '/: %{http_code}\n' http://127.0.0.1:5173/
curl -s -o /dev/null -w '/acompanhar: %{http_code}\n' http://127.0.0.1:5173/acompanhar
curl -s -o /dev/null -w '/fila: %{http_code}\n' http://127.0.0.1:5173/fila
```

Esperado:

```text
/: 200
/acompanhar: 200
/fila: 303
```

`/fila` retorna `303` porque redireciona para login quando não há sessão. Isso é correto.

### 3.5. Validações opcionais antes da apresentação

```bash
PATH=/tmp/opencode/node24/node_modules/node/bin:$PATH npm run check
PATH=/tmp/opencode/node24/node_modules/node/bin:$PATH npm run lint
PATH=/tmp/opencode/node24/node_modules/node/bin:$PATH npm test
```

Estado conhecido: `check` com 0 erros e 3 warnings antigos em `AssignAction.svelte`, `lint` OK e `test` com 30 testes aprovados.

### 3.6. Regras de navegação

- Use uma **aba anônima** para o Bloco A.
- Use a aba normal para os blocos B, C e D.
- Para trocar de perfil, clique em **Sair** no menu e entre novamente.
- Ao sair da página pública de acompanhamento, a identidade salva no `sessionStorage` é descartada; refaça a validação quando voltar.
- Pendências e observações são stores em memória: ao reiniciar o Vite, alterações feitas durante o teste são perdidas. Isso é esperado.

---

## 4. Dados de teste

### 4.1. Usuários

| Perfil        | E-mail                    | Senha     | id  | Uso principal                           |
| ------------- | ------------------------- | --------- | --- | --------------------------------------- |
| Analista      | `analista@maat.com.br`    | `admin`   | `1` | Testar custódia em `MAAT-4P7K-2LQX`     |
| Gestor        | `gestor@maat.com.br`      | `admin`   | `2` | Testar leitura sem edição               |
| Administrador | `admin@maat.com.br`       | `admin`   | `3` | Testar edição, observações e exportação |
| Solicitante   | `solicitante@maat.com.br` | `temp123` | `4` | Testar guard e busca global pública     |

`Solicitante` é Carlos Mendes e não é o solicitante dos protocolos de Maria Oliveira. Use esse perfil apenas para os testes de bloqueio de área interna e redirecionamento da busca.

### 4.2. Solicitações

| Protocolo        | Solicitante    | E-mail                       | Situação                                                                     | Uso no roteiro                                 |
| ---------------- | -------------- | ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| `MAAT-8K3P-9X2M` | Maria Oliveira | `maria.oliveira@maat.com.br` | Sem responsável; tem pendências; título “Automatizar conferência de diárias” | Validação pública, pendências, detalhe interno |
| `MAAT-6N2W-8VBM` | Maria Oliveira | `maria.oliveira@maat.com.br` | Concluído; responsável Fernando Alves                                        | Lista por e-mail                               |
| `MAAT-4P7K-2LQX` | Maria Oliveira | `maria.oliveira@maat.com.br` | Em desenvolvimento; responsável Ana Souza (`id=1`)                           | Custódia do Analista                           |
| `MAAT-9R3D-7KWF` | João Santos    | `joao.santos@maat.com.br`    | Sem pendências; responsável Lucas Gomes                                      | Validação pública com outro solicitante        |
| `MAAT-3V8K-6JPN` | Pedro Rocha    | `pedro.rocha@maat.com.br`    | Com anexo; responsável Ana Souza                                             | Referência de fixture com anexo                |
| `MAAT-INVALIDO`  | —              | —                            | Não existe                                                                   | Estado vazio na fila interna                   |

### 4.3. Modo do portal

O modo padrão nos mocks é `PUBLIC` (`src/lib/config/portal-defaults.ts:396`). Por isso, a tela de validação pública aparece para visitantes não autenticados.

---

## 5. Roteiro

### Bloco A — Acompanhamento público, sem login

**A1.** Abra `http://127.0.0.1:5173/acompanhar` na aba anônima.

- **Esperado:** título “Acompanhar Solicitações”, campos **Número do Protocolo**, **E-mail Corporativo** e botão **Consultar Protocolo**.
- **Valida:** acesso público e layout da busca.

**A2.** Deixe o protocolo vazio. No campo **E-mail Corporativo**, digite `ninguem@exemplo.invalid` e clique em **Consultar Protocolo**.

- **Esperado:** “Nenhuma solicitação encontrada” e “Confira o e-mail informado e tente novamente.”
- **Valida:** estado vazio da tabela pública.

**A3.** Limpe o e-mail e digite `maria.oliveira@maat.com.br`. Clique em **Consultar Protocolo**.

- **Esperado:** 3 linhas: `MAAT-8K3P-9X2M`, `MAAT-6N2W-8VBM`, `MAAT-4P7K-2LQX`.
- **Valida:** listagem por e-mail.

**A4.** Clique no protocolo `MAAT-8K3P-9X2M`.

- **Esperado:** tela “Acompanhar solicitação” com **Nome completo**, **E-mail corporativo**, **Protocolo** travado e botão **Validar e acompanhar**.
- **Valida:** bloqueio de acesso antes da verificação de identidade.

**A5.** No formulário de validação, digite de propósito:

- Nome: `Maria Errada`
- E-mail: `errado@exemplo.com`

Clique em **Validar e acompanhar**.

- **Esperado:** erro “Dados de validação inválidos. Confira nome, e-mail e protocolo.” e nenhum dado da solicitação aparece.
- **Valida:** erro genérico anti-enumeração.

**A6.** Corrija para:

- Nome: `Maria Oliveira`
- E-mail: `maria.oliveira@maat.com.br`

Clique em **Validar e acompanhar**.

- **Esperado:** “Carregando solicitação…” e depois o detalhe `Automatizar conferência de diárias`.
- **Valida:** verificação pública seguida de tracking autorizado.

**A7.** Clique na aba **Pendências**.

- **Esperado:** “Carregando pendências…”, depois cards com status “Pendente de resposta”, “Aguardando validação” ou “Validada”.
- **Valida:** carregamento e agrupamento das pendências.

**A8.** Em um item pendente, preencha o campo solicitado e clique em **Confirmar**.

- **Esperado:** botão mostra “Enviando…”, depois o item muda de status e o badge da aba atualiza.
- **Valida:** resposta individual via PATCH e atualização sem recarregar a página.

**A9.** Volte para `http://127.0.0.1:5173/acompanhar`. No campo **Número do Protocolo**, digite `MAAT-9R3D-7KWF` e clique em **Consultar Protocolo**.

- **Esperado:** abre `/acompanhar/MAAT-9R3D-7KWF` com a tela **Acompanhar solicitação**, texto “Para proteger seus dados, confirme sua identidade com os mesmos dados usados na abertura da solicitação MAAT-9R3D-7KWF” e campos **Nome completo** e **E-mail corporativo** obrigatórios.
- Preencha `João Santos` / `joao.santos@maat.com.br` e clique em **Validar e acompanhar**.
- **Valida:** bloqueio de identidade antes de exibir os dados de outro protocolo.

**A10.** No campo **Buscar solicitação** do cabeçalho, digite `joao.santos@maat.com.br` e pressione Enter.

- **Esperado:** abre `/acompanhar?email=joao.santos@maat.com.br` com as solicitações dele.
- **Valida:** a busca global pública reconhece e-mail.

**A11.** No mesmo campo, digite `abc` e pressione Enter.

- **Esperado:** alerta “Informe um protocolo ou e-mail válido.” com botão **Tentar novamente**.
- **Valida:** erro de formato e retry da busca global.

---

### Bloco B — Fila interna com Administrador

**B12.** Feche a aba anônima. Na aba normal, abra `http://127.0.0.1:5173/login` e entre com:

- E-mail: `admin@maat.com.br`
- Senha: `admin`

Clique em **Entrar**.

- **Esperado:** vai para `/home`.
- **Valida:** login com perfil interno.

**B13.** Clique em **Fila** no menu lateral — ou abra `http://127.0.0.1:5173/fila`.

- **Esperado:** campos **Buscar**, **Status**, **Prioridade**, **Responsável**, botão **Limpar** e tabela com solicitações.
- **Valida:** carregamento inicial da fila.

**B14.** No campo **Buscar**, digite `diárias` e **não aperte Enter**. Espere cerca de 300 ms.

- **Esperado:** URL vira `?search=di%C3%A1rias`; aparece `Automatizar conferência de diárias`; “Atualizando…” aparece e o campo fica desabilitado enquanto carrega.
- **Valida:** debounce de 300 ms e estado de carregamento.

**B15.** Troque o termo para `NAOEXISTE` e pressione Enter.

- **Esperado:** “Nenhuma solicitação encontrada” e “Ajuste a busca ou os filtros e tente novamente.”
- **Valida:** estado vazio aplicado à fila.

**B16.** Clique em **Limpar**.

- **Esperado:** volta a listar todas as solicitações.
- **Valida:** limpeza de busca e filtros.

**B17.** Abra `http://127.0.0.1:5173/fila?page=999`.

- **Esperado:** última página válida com registros, não uma tabela vazia.
- **Valida:** clamp de paginação no front/mock.

**B18.** Clique em `#MAAT-8K3P-9X2M` na tabela.

- **Esperado:** abas **Informações**, **Triagem**, **Mapeamento**, **Histórico de Pendências**, **Observações Internas**.
- **Valida:** detalhe interno e tabs liberadas para Administrador.

**B19.** Clique em **Observações Internas**.

- **Esperado:** lista de notas e campo para nova observação.
- **Valida:** leitura/escrita de observação interna para Administrador.

**B20.** Volte para `http://127.0.0.1:5173/fila`.

- **Esperado:** botão **Exportar CSV** no cabeçalho, ao lado de “Fila Centralizada”.
- **Valida:** exportação liberada para Administrador.
- **Atenção:** não existe botão de exportação no detalhe `/fila/[protocolo]`. As regras ficam em `src/routes/(admin)/fila/+page.svelte:26-27` e a renderização em `src/routes/(admin)/fila/+page.svelte:242-253`.

---

### Bloco C — Matriz por perfil

**C21.** Clique em **Sair**. Entre com:

- E-mail: `gestor@maat.com.br`
- Senha: `admin`

Abra `/fila/MAAT-8K3P-9X2M`.

- **Esperado:** observações e triagem visíveis, mas sem botão **Editar**.
- **Valida:** Gestor em somente leitura.

**C22.** Clique em **Sair**. Entre com:

- E-mail: `analista@maat.com.br`
- Senha: `admin`

Abra `/fila/MAAT-4P7K-2LQX`.

- **Esperado:** botão **Editar** disponível, pois a solicitação está atribuída a Ana Souza (`id=1`).
- **Valida:** Analista com custódia.

**C23.** Ainda como Analista, abra `/fila/MAAT-8K3P-9X2M`.

- **Esperado:** sem custódia; **Editar** indisponível e aba **Triagem** oculta.
- **Valida:** restrição por responsável.

**C24.** Clique em **Sair**. Entre com:

- E-mail: `solicitante@maat.com.br`
- Senha: `temp123`

Abra `/fila`.

- **Esperado:** redirecionamento para `/sem-autorizacao`.
- **Valida:** guard de área interna.

**C25.** Ainda como Solicitante, use o campo **Buscar solicitação** com `MAAT-8K3P-9X2M`.

- **Esperado:** vai para `/acompanhar/MAAT-8K3P-9X2M`, não para `/fila`.
- **Valida:** a busca global muda de destino conforme o perfil.

---

### Bloco D — Erros

**D26.** Em `/login`, tente `admin@maat.com.br` / `senha-errada`.

- **Esperado:** “Credenciais inválidas.”
- **Valida:** erro de autenticação.

**D27.** Como Administrador, use **Buscar solicitação** com `MAAT-INVALIDO`.

- **Esperado:** abre `/fila?search=MAAT-INVALIDO` com estado vazio, sem erro de formato — perfis internos buscam na fila.
- **Valida:** diferença de comportamento entre busca interna e pública.

---

## 6. Registro de execução

Copie esta tabela e preencha durante a apresentação.

| Passo | Resultado  | Obtido / evidência |
| ----- | ---------- | ------------------ |
| A1    | ☐ OK ☐ NOK |                    |
| A2    | ☐ OK ☐ NOK |                    |
| A3    | ☐ OK ☐ NOK |                    |
| A4    | ☐ OK ☐ NOK |                    |
| A5    | ☐ OK ☐ NOK |                    |
| A6    | ☐ OK ☐ NOK |                    |
| A7    | ☐ OK ☐ NOK |                    |
| A8    | ☐ OK ☐ NOK |                    |
| A9    | ☐ OK ☐ NOK |                    |
| A10   | ☐ OK ☐ NOK |                    |
| A11   | ☐ OK ☐ NOK |                    |
| B12   | ☐ OK ☐ NOK |                    |
| B13   | ☐ OK ☐ NOK |                    |
| B14   | ☐ OK ☐ NOK |                    |
| B15   | ☐ OK ☐ NOK |                    |
| B16   | ☐ OK ☐ NOK |                    |
| B17   | ☐ OK ☐ NOK |                    |
| B18   | ☐ OK ☐ NOK |                    |
| B19   | ☐ OK ☐ NOK |                    |
| B20   | ☐ OK ☐ NOK |                    |
| C21   | ☐ OK ☐ NOK |                    |
| C22   | ☐ OK ☐ NOK |                    |
| C23   | ☐ OK ☐ NOK |                    |
| C24   | ☐ OK ☐ NOK |                    |
| C25   | ☐ OK ☐ NOK |                    |
| D26   | ☐ OK ☐ NOK |                    |
| D27   | ☐ OK ☐ NOK |                    |

---

## 7. Problemas comuns

| Sintoma                                                    | Causa provável                           | Ação                                                                                                        |
| ---------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED 127.0.0.1:3000` no log do Vite               | `MOCKS_ENABLED = false`                  | Mudar para `true` em `src/lib/mocks/index.ts:5` e reiniciar o Vite                                          |
| `node -v` menor que 24                                     | Node do sistema incompatível             | Usar `PATH=/tmp/opencode/node24/node_modules/node/bin:$PATH`                                                |
| Porta `5173` já ocupada                                    | Processo órfão do Vite                   | `lsof -ti :5173 \| xargs -r kill` e subir novamente com `--strictPort`                                      |
| `/fila` responde `303`                                     | Usuário não autenticado                  | Correto; faça login                                                                                         |
| Tela “Acompanhar solicitação” apareceu ao buscar protocolo | Exigência de validação pública           | Correto; use nome/e-mail da tabela de fixtures                                                              |
| Dados de validação inválidos                               | Nome/e-mail divergentes do fixture       | Use exatamente `Maria Oliveira` / `maria.oliveira@maat.com.br` ou `João Santos` / `joao.santos@maat.com.br` |
| Não aparece botão **Exportar CSV** no detalhe              | Exportação fica na lista, não no detalhe | Volte para `/fila`; veja B20                                                                                |
| Pendências não aparecem                                    | Protocolo errado ou store reiniciado     | Use `MAAT-8K3P-9X2M`; alterações em memória são perdidas ao reiniciar o Vite                                |
| Busca por descrição/problema/nota não retorna              | Mocks não implementam essa busca         | Limitação conhecida; use backend real para validar                                                          |

---

## 8. Limitações conhecidas

- A busca nos mocks cobre somente protocolo, título da demanda, nome do solicitante e e-mail (`src/lib/mocks/requests.mock.ts:676-690`).
- A busca ampliada por descrição, problema e nota interna depende do backend real.
- O botão **Exportar CSV** existe apenas em `/fila`, para `Gestor` e `Administrador`, e somente quando há linhas exportáveis.
- O RBAC da Rodada 01 não está na `main` do backend; não testar aqui.
- `MOCKS_ENABLED = true` passa a vir com a branch após o commit; antes disso era somente local.

---

## 9. Prompt pronto para a IA da pessoa

Copie o bloco abaixo para a IA que for apoiar a apresentação:

```text
Você vai apoiar uma apresentação manual do frontend RF04.

Leia o arquivo docs/roteiro-teste-manual-rf04.md e siga EXATAMENTE o roteiro dele, na ordem.

Regras:
1. Não use conhecimento externo nem invente valores: use somente os dados do documento.
2. Não execute git add, commit, push, merge, rebase, reset ou checkout.
3. Não altere código.
4. Use Node 24: PATH=/tmp/opencode/node24/node_modules/node/bin:$PATH
5. Antes de executar qualquer comando, explique o que ele faz.
6. Para cada passo, diga ao humano: AÇÃO, ESPERADO e VALIDA.
7. Se o resultado divergir, marque NOK, mostre esperado/obtido e pare. Não corrija automaticamente.
8. Não use dados reais; todos os dados são fictícios.
9. Ao final, informe: passos executados, OK, NOK e arquivos alterados localmente.

Comece pela Seção 3 — Preparação e aguarde a confirmação de que o servidor está no ar antes de iniciar o Bloco A.
```

---

## 10. Critérios de encerramento

A apresentação pode ser encerrada quando:

- todos os 27 passos tiverem registro `OK` ou `NOK`;
- os passos `NOK`, se houver, estiverem descritos com esperado e obtido;
- a limitação da busca ampliada tiver sido explicitada;
- nenhuma operação de Git tiver sido executada sem autorização;
- nenhum dado real tiver sido usado;
- a IA tiver entregue o resumo final no formato da Seção 9.
