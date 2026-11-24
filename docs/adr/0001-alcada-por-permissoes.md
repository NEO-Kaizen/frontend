# ADR 0001 — Alçada administrativa por dominância de permissões

- Status: aceita
- Data: 2026-11-24
- Escopo: tela `/usuarios` e autorização administrativa no frontend

## Contexto

A tela de usuários precisa responder a três perguntas distintas:

1. quais Perfis podem ser atribuídos em criação/edição;
2. quais usuários podem ser administrados (editar, ativar/desativar, redefinir senha);
3. se o Perfil de origem de uma nota ou registro deve ser exibido como snapshot histórico.

O frontend não recebe o `profile` do usuário da sessão (`SessionUser`); recebe apenas `role` e a lista efetiva de permissões. Enquanto `SessionUser` não expõe `profile` (evolução futura), a identificação de Admin Root depende de um shim temporário pelo rótulo `role`.

Também havia duas noções sendo tratadas como uma só: “Perfil que posso designar” e “Perfil cujos usuários posso administrar”. Isso fazia com que usuários de Perfis inativos perdessem ações de administração, inclusive a migração para um Perfil ativo.

## Decisão

A alçada administrativa será calculada por **dominância estrita de permissões**, não por nome de Perfil, rótulo de sessão ou `isActive`:

- `isAuthorityStrictlyBelow(target.permissions, actor.permissions)` continua sendo a regra central;
- `canAssignProfile` exige Perfil ativo, não Root e dominância estrita;
- `canManageUserWithProfile` exige não Root e dominância estrita, independentemente do status do Perfil;
- `listAssignableProfiles` alimenta formulários;
- `listAdministrableProfiles` alimenta ações da tabela;
- Admin Root é tratado como exceção via `isRootActor`, com o shim `role === 'Admin Root'` mantido até que `SessionUser` exponha `profile`;
- o dropdown de filtro continua exibindo apenas Perfis ativos e “Todos”, conforme critério da #230.

## Alternativas rejeitadas

- **Comparar nomes como “Analista” ou “Administrador”**: quebra com Perfis customizados e renomes.
- **Usar `isActive` como critério de autorização**: impede a administração de usuários de Perfis inativos, inclusive a migração para Perfis ativos.
- **Derivar Root de permissões**: o Perfil “Administrador” e o Root possuem o mesmo conjunto de permissões no contrato atual; não há distinção confiável sem `SessionUser.profile`.
- **Ampliar `SessionUser` agora**: muda o contrato de autenticação de #229 e todas as suas fontes, fora do escopo da #230.

## Consequências

- A tela de usuários passa a separar explicitamente `assignableProfiles` de `administrableProfileIds`.
- A rota `/usuarios` passa a exigir `profile:read` além de `user:read`; sem a chave, o acesso é negado antes do carregamento, em vez de exibir uma lista vazia e ações bloqueadas.
- Usuários de Perfis inativos voltam a ter ações disponíveis quando o ator tiver alçada, mas o formulário de edição exige um Perfil ativo para salvar.
- O shim de Root fica documentado como dívida técnica; quando `SessionUser` expuser `profile`, `isRootActor` passa a usar `actor.profile.isRoot` e o `role` deixa de ser usado para autorização.
- Mocks devem derivar comportamento de flags (`isAssignableTriage`, `isAssignableMapping`, `isRoot`) e permissões, não de rótulos.
