# Git e Contribuição

## 1. Objetivo

Este documento define o fluxo de contribuição do frontend do Projeto NEO.

---

## 2. Regra principal

Não realizar `push` diretamente para a branch principal.

Toda alteração deve passar por:

1. branch;
2. commit;
3. push;
4. Pull Request;
5. revisão;
6. merge.

---

## 3. Atualizar o repositório

```bash
git switch main
git pull origin main
```

Antes de iniciar uma tarefa, garantir que a branch principal local esteja atualizada.

---

## 4. Criar uma branch

```bash
git switch -c feat/header
```

Padrões:

| Prefixo     | Uso                                  |
| ----------- | ------------------------------------ |
| `feat/`     | Nova funcionalidade                  |
| `fix/`      | Correção                             |
| `docs/`     | Documentação                         |
| `refactor/` | Refatoração                          |
| `test/`     | Testes                               |
| `chore/`    | Configuração ou manutenção           |
| `style/`    | Alteração visual sem regra funcional |

Exemplos:

```text
feat/icon-component
feat/role-based-header
fix/login-validation
docs/frontend-architecture
refactor/user-service
```

---

## 5. Trazer uma branch remota

Listar branches:

```bash
git branch -r
```

---

## 6. Commits

Padrão recomendado:

```text
tipo(escopo): descrição
```

Exemplos:

```text
feat(header): adiciona navegação por perfil
fix(auth): corrige validação do formulário de login
docs(architecture): documenta fluxo de repositories
refactor(users): separa regras de desativação
test(button): adiciona teste de estado desabilitado
```

---

## 7. Antes do commit

Executar:

```bash
npm run format
```

Formata automaticamente o código seguindo o padrão definido pelo Prettier.

```bash
npm run lint
```

Analisa o código em busca de problemas de qualidade, erros e violações das regras do ESLint.

```bash
npm run check
```

Realiza a verificação do projeto, incluindo checagem de tipos do TypeScript e validações do Svelte, identificando possíveis erros antes da compilação.

---

## 8. Push

```bash
git push -u origin feat/role-based-header
```

O `-u` associa a branch local à remota.

Nos próximos pushes:

```bash
git push
```

---

## 9. Pull Request

O PR deve possuir:

### Título

```text
feat(header): adiciona navegação por perfil
```

### Descrição

```md
## O que foi feito

- Criação do Header
- Navegação baseada no perfil
- Inclusão da ação de logout

## Como testar

1. Entrar como Admin
2. Verificar o menu de usuários
3. Entrar como Solicitante
4. Confirmar que o menu de usuários não aparece

## Evidências

Adicionar prints ou vídeo quando houver mudança visual.

## Checklist

- [ ] Código formatado
- [ ] Lint executado
- [ ] Tipagem verificada
- [ ] Testes executados
- [ ] Responsividade verificada
- [ ] Acessibilidade básica verificada
```

---

## 10. Revisão

A revisão deve verificar:

- critérios de aceitação;
- legibilidade;
- tipagem;
- arquitetura;
- segurança;
- acessibilidade;
- estados de erro;
- responsividade;
- consistência visual;

Comentários devem ser respeitosos e objetivos.

---

## 11. Merge

Quem realiza o merge deve seguir a regra definida pela equipe.

Recomendação:

- o autor não deve aprovar o próprio PR;
- exigir ao menos uma revisão;
- resolver conflitos antes do merge;
- apagar a branch após o merge, quando não for mais necessária.

Não realizar merge sem revisão.

---

## 12. Atualizar após um merge

```bash
git switch main
git pull origin main
```

Em seguida, atualizar sua branch:

```bash
git switch feat/minha-tarefa
git merge main
```

---

## 13. Conflitos

Ao encontrar conflito:

1. identificar os arquivos;
2. conversar com quem alterou a mesma área;
3. entender qual versão deve permanecer;
4. remover marcadores;
5. testar;
6. criar commit de resolução.

Nunca escolher uma versão sem entender a alteração.

---

## 14. Proteção da branch principal

Configuração recomendada no GitHub:

- exigir Pull Request;
- exigir uma aprovação;
- impedir push direto;
- impedir merge com conversas não resolvidas;

---

## 15. Segurança

Nunca versionar:

- `.env`;
- tokens;
- senhas;
- chaves;
- cookies;
- dados reais do cliente;
- arquivos pessoais;
- logs sensíveis.

Adicionar arquivos apropriados ao `.gitignore`.

---

