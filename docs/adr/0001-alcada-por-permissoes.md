# ADR 0001 — Alçada administrativa por dominância de permissões

- Status: aceita
- Data: 2026-11-24
- Escopo: tela `/usuarios` e autorização administrativa no frontend

## Contexto

A tela de usuários precisa responder a três perguntas distintas:

1. quais Perfis podem ser atribuídos em criação/edição;
2. quais usuários podem ser administrados (editar, ativar/desativar, redefinir senha);
3. se o Perfil de origem de uma nota ou registro deve ser exibido como snapshot histórico.

O frontend não recebia o `profile` do usuário da sessão (`SessionUser`); recebia apenas `role` e a lista efetiva de permissões. Naquele momento, a identificação de Admin Root dependia de um shim temporário pelo rótulo `role`; hoje `SessionUser` expõe `isRoot` e o shim foi removido (ver Consequências).

Também havia duas noções sendo tratadas como uma só: “Perfil que posso designar” e “Perfil cujos usuários posso administrar”. Isso fazia com que usuários de Perfis inativos perdessem ações de administração, inclusive a migração para um Perfil ativo.

## Decisão

A alçada administrativa será calculada por **dominância estrita de permissões**, não por nome de Perfil, rótulo de sessão ou `isActive`:

- `isAuthorityStrictlyBelow(target.permissions, actor.permissions)` continua sendo a regra central;
- a contenção de permissões não tem curto-circuito para alvo vazio, como no backend: um Perfil sem permissões é estritamente abaixo de qualquer ator com permissões;
- `canAssignProfile` exige Perfil ativo, não Root e dominância estrita;
- `canManageUserWithProfile` exige não Root e dominância estrita, independentemente do status do Perfil;
- `listAssignableProfiles` alimenta formulários;
- `listAdministrableProfiles` alimenta ações da tabela;
- Admin Root é tratado como exceção via `isRootActor`, que lê a marca estável `SessionUser.isRoot`;
- o dropdown de filtro exibe todos os Perfis conhecidos, marcando os inativos, e o `?profileId=` é validado apenas por formato no server; um id inexistente canonicaliza a URL via `redirect(303)`, e a existência/status fica com o backend.

## Alternativas rejeitadas

- **Comparar nomes como “Analista” ou “Administrador”**: quebra com Perfis customizados e renomes.
- **Usar `isActive` como critério de autorização**: impede a administração de usuários de Perfis inativos, inclusive a migração para Perfis ativos.
- **Derivar Root de permissões**: o Perfil “Administrador” e o Root possuem o mesmo conjunto de permissões no contrato atual; não há distinção confiável sem `SessionUser.profile`.
- **Ampliar `SessionUser` agora**: muda o contrato de autenticação de #229 e todas as suas fontes, fora do escopo da #230.

## Consequências

- A tela de usuários passa a separar explicitamente `assignableProfiles` de `administrableProfileIds`.
- A rota `/usuarios` passa a exigir `profile:read` além de `user:read`; sem a chave, o acesso é negado antes do carregamento, em vez de exibir uma lista vazia e ações bloqueadas.
- Usuários de Perfis inativos voltam a ter ações disponíveis quando o ator tiver alçada; a edição preserva o Perfil atual quando ele não está entre os designáveis e só envia `profileId` quando o Perfil muda.
- A própria conta não expõe ações administrativas na tabela, espelhando o `403 self_management_forbidden` do backend.
- O filtro por Perfil inativo envia `profileId` ao backend; a canonicalização via `redirect(303)` só ocorre com o catálogo carregado, e a aceitação de Perfis inativos em `GET /users` é premissa do contrato do backend.
- Ao migrar para um Perfil sem bloco profissional, o frontend omite `professional`; a extensão existente é preservada, coerente com o contrato de atualização sem reenvio de Perfil.
- O Perfil Admin Root permanece fora das rotas administrativas mesmo para o ator Root, como no backend (`is_root`); “Root vê tudo” significa todos os Perfis não-Root.
- `profile.name` permanece apenas como fallback do rótulo de exibição de `role` no `SessionUser`; ele não participa da autorização nem da identificação do Root.
- O shim de Root por `role` foi **removido**: `isRootActor(user)` usa `user.isRoot === true`, a sessão recebe `profile.isRoot` obrigatório e o nome do Perfil Root voltou a ser editável. Um Perfil customizado chamado “Admin Root” não recebe autoridade de Root.
- O mock de notas internas mantém um mapa de `role` para o snapshot histórico de exibição do autor. Ele não participa de autorização: a checagem de acesso usa as chaves `internal_note:*`.
- Mocks devem derivar comportamento de flags (`isAssignableTriage`, `isAssignableMapping`, `isRoot`) e permissões, não de rótulos. A matriz de permissões tem fonte única em `src/lib/mocks/profile-permissions.mock.ts`, e o catálogo inclui um Perfil inativo com permissões e usuários para exercitar a alçada.
