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

`id` é a identidade estável; `name` é apenas exibição e não autoriza.

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
| PATCH  | `/profiles/:id`           | `Profile` (parcial)           | `profile:manage` |
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

No modo mock, criar/editar/ativar/desativar perfis atualiza a lista local da aba Perfis, mas não o `load` do SSR. Um reload completo da página volta ao seed de `profiles.mock.ts`, e o filtro/atribuição de usuários não enxerga o perfil criado na mesma sessão. O `userCount` também é estático e não acompanha criação/edição de usuários. Essas são limitações do mock em memória, não do fluxo real de API.

## Pendências

- Confirmar no backend os nomes/códigos de erro de negócio para renderização fiel na UI.
- Confirmar se `GET /profiles` aceita `?profileId`/paginação/filtros além da lista completa.
- Confirmar se a sessão passará a expor `isRoot` (hoje a UI usa o rótulo “Admin Root” como fallback).
