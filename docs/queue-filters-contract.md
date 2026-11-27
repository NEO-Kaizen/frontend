# Contrato — Filtros da fila (proposta frontend-first)

> Proposta **frontend-first**: o backend deve implementar exatamente estes nomes e a semântica abaixo.

## Query params

Aplicam-se a `GET /queue` e a `GET /reports/requests.csv`.

<!-- prettier-ignore -->
| Param         | Tipo                                     | Default     | Semântica                                                                 |
| ------------- | ---------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `search`      | string (máx. 254)                        | —           | Busca textual em: protocolo, título da demanda, nome do processo, descrição, problema, resultado esperado, observações internas, nome e e-mail do solicitante. |
| `status`      | string                                   | —           | Status da solicitação. Mantém a semântica atual.                          |
| `priority`    | string                                   | —           | Prioridade. Mantém a semântica atual, incluindo `nenhum`.                 |
| `assigneeId`  | string                                   | —           | Responsável. Mantém a semântica atual, incluindo `unassigned`.            |
| `createdFrom` | `YYYY-MM-DD`                             | —           | Data inicial inclusiva; compara com `created_at` em **UTC**.              |
| `createdTo`   | `YYYY-MM-DD`                             | —           | Data final inclusiva; compara com `created_at` em **UTC**.                |
| `department`  | string (trim, máx. 200)                  | —           | Departamento do solicitante; comparação sem diferenciar maiúsculas.       |
| `sortBy`      | `createdAt` \| `priority` \| `status` \| `protocol` | `createdAt` | Campo de ordenação.                                                       |
| `sortOrder`   | `asc` \| `desc`                          | `desc`      | Direção da ordenação.                                                     |

## Envelope de `GET /queue`

Além de `data`, `page`, `pageSize`, `total`, `totalPages` e `assignees`, a resposta inclui:

- `departments: string[]` — departamentos distintos **globais** (não dependem dos filtros nem da paginação), já ordenados.

`departments` é **obrigatório** no contrato. Durante a transição, enquanto o backend não retornar o campo, o frontend tolera a ausência e renderiza apenas a opção "Todos" no filtro de departamento.

## Regras

- Todos os filtros combinam com **AND**.
- Datas comparam `created_at` em UTC e são **inclusivas** nas duas pontas.
- A ordenação é aplicada **após** os filtros; a paginação é aplicada **após** a ordenação.
- Empates são sempre resolvidos por `protocol` **ascendente**.
- Em `sortBy=priority`, solicitações sem prioridade (`null`) ficam **sempre ao final**, em `asc` e em `desc`.
- Em `sortBy=status`, a ordenação usa `statuses.order_number` (ordem configurada no portal).
- Em `sortBy=protocol`, a comparação é **case-insensitive**.
- O frontend normaliza `createdFrom`/`createdTo` (trim e formato `YYYY-MM-DD`) e **troca** os valores quando o intervalo vem invertido antes de enviar, portanto **nunca envia intervalo invertido**. Ainda assim, o backend deve **rejeitar intervalo invertido com `400`** como defesa para outros consumidores.

## Exemplo

```text
GET /queue?search=di%C3%A1rias&status=Em%20triagem&department=Departamento%20Pessoal&createdFrom=2026-08-01&createdTo=2026-08-31&sortBy=priority&sortOrder=desc&page=1&pageSize=5
```

A exportação CSV reutiliza os mesmos nomes:

```text
GET /reports/requests.csv?search=di%C3%A1rias&department=Departamento%20Pessoal&createdFrom=2026-08-01&createdTo=2026-08-31&sortBy=priority&sortOrder=desc
```

## Observação sobre `search`

O filtro `search` aceita no máximo 254 caracteres (o frontend ignora termos maiores em vez de truncá-los) e deve cobrir protocolo, título da demanda, nome do processo, descrição, problema, resultado esperado, observações internas, nome e e-mail do solicitante.
