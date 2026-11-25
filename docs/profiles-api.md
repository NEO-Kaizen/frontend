# Contrato de Perfis (frontend)

Status: **premissa do frontend, pendente de confirmação do backend**.

Este documento registra o contrato consumido pela gestão de perfis (aba **Perfis** em `/usuarios`).
Tipos de referência: `src/lib/types/profile.ts`; cliente: `src/lib/api/profile.api.ts`;
serviço: `src/lib/services/profile.service.ts`.

## Tipos

### `ProfileReference`

```ts
{
	id: string;
	name: string;
}
```

`id` é a identidade estável; `name` é exibição e não autoriza no servidor. No
frontend ele também vira o rótulo `role` da sessão quando o payload não traz
`role`, e é por esse rótulo que a UI detecta o Root hoje — ver Pendências.

### `Permission`

```ts
{
	key: PermissionKey;
	custody: 'global' | 'own' | 'assigned' | 'all';
}
```

### `Profile`

```ts
{
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isRoot: boolean;
  isAssignableTriage: boolean;
  isAssignableMapping: boolean;
  userCount: number;
  permissions: Permission[];
}
```

### `ProfileKeyCatalog`

```ts
{
  permissions: Array<{
    key: PermissionKey;
    custodyType: 'global' | 'custodial';
    allowedCustodies: PermissionCustody[];
    dependencies: PermissionKey[];
  }>;
  assignabilityPredicates: {
    triage: PermissionKey[];
    mapping: PermissionKey[];
  };
}
```

## Endpoints

| Método | Rota                      | Resposta                      | Permissão        |
| ------ | ------------------------- | ----------------------------- | ---------------- |
| GET    | `/profiles`               | `Profile[]` (inclui inativos) | `profile:read`   |
| GET    | `/profiles/keys`          | `ProfileKeyCatalog`           | `profile:read`   |
| POST   | `/profiles`               | `Profile`                     | `profile:manage` |
| PATCH  | `/profiles/:id`           | `Profile` (completo)          | `profile:manage` |
| PATCH  | `/profiles/:id/status`    | `{ id, isActive }`            | `profile:manage` |
| POST   | `/profiles/:id/duplicate` | `Profile`                     | `profile:manage` |

### Payloads de escrita

`POST /profiles` (`ProfileCreateInput`):

```ts
{
  name: string;
  description?: string | null;
  isAssignableTriage?: boolean;
  isAssignableMapping?: boolean;
  permissions: Array<{ key: PermissionKey; custody: PermissionCustody }>;
}
```

`PATCH /profiles/:id` (`ProfileUpdateInput`): mesmos campos, todos opcionais.
O frontend envia apenas o que mudou; composição e flags vão juntas quando ambas mudam.

`PATCH /profiles/:id/status`:

```ts
{
	isActive: boolean;
}
```

`POST /profiles/:id/duplicate`:

```ts
{ name: string; description?: string | null }
```

## Regras assumidas

- Nome único entre perfis **ativos**, comparado sem diferenciar maiúsculas/minúsculas; nome até 60 caracteres e descrição até 255.
- Editar, duplicar e alterar status exigem que o alvo esteja **estritamente abaixo** da autoridade do ator. O Admin Root é exceção e gerencia qualquer perfil; o perfil Root só pode ser editado pelo Root.
- `own` e `global` são custódias fixas; chaves custodiais aceitam `assigned`/`all`.
- Dependências do catálogo precisam estar presentes na composição.
- Ator só concede chave/escopo que ele próprio possui.
- Perfil Root:
  - não pode ser desativado;
  - só pode ser editado por ator Root;
  - não pode ser atribuível à triagem/mapeamento;
  - não pode perder `profile:manage`.
- Desativação bloqueada quando `userCount > 0`.
- Guarda 6: remover chaves de um predicado de atribuição exige desligar a flag correspondente na mesma edição; o backend pode recusar quando houver solicitações a realocar.
- Teto de chaves da composição vem do catálogo (`catalog.permissions.length`), não de um valor fixo.

## Limitação do mock

No modo mock, as mutações de perfil acontecem no browser e não chegam ao `load` do SSR, que continua lendo o seed de `profiles.mock.ts`. A aba Perfis mostra a lista local atualizada enquanto permanece montada (sair da aba e voltar remonta o componente), mas filtro e atribuição de usuários nunca refletem a mudança e o reload completo restaura o seed. O `userCount` também é estático e não acompanha criação/edição de usuários. Essas são limitações do mock em memória, não do fluxo real de API.

## Pendências

- Confirmar no backend os nomes/códigos de erro de negócio para renderização fiel na UI.
- Confirmar se `GET /profiles` aceita `?profileId`/paginação/filtros além da lista completa.
- Confirmar se a sessão passará a expor `isRoot` e `role` (hoje a UI deriva o rótulo de `profile.name`, detecta o Root pelo texto “Admin Root” e bloqueia renomear esse perfil no editor).
