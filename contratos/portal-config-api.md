# Contrato de API — Configuração do Portal (PortalConfig)

Contrato de comunicação Frontend ↔ Backend para a **configuração do portal**:
leitura pública dos parâmetros de runtime e edição administrativa por seção
(tela `/configuracoes`). Cada seção é um recurso independente com seu próprio
`PATCH` — o frontend salva/cancela card a card.

- Fonte de verdade: issue `#90` (configuração do portal).
- Referências no frontend: `src/lib/types/portal-config.ts`,
  `src/lib/config/portal-config.*`, `src/lib/utils/validations.ts`,
  `src/lib/mocks/portal-config.mock.ts`.
- Autenticação: `GET /portal-config` é **público** (consumido no SSR de todas as
  rotas). Os `PATCH` de seção exigem cookie `session_id` + perfil
  **Administrador**.
- Erros sempre no envelope:
  `{ "status": "error", "statusCode": number, "message": string }`.
- Convenções: chaves `camelCase` em inglês; valores de domínio em PT-BR; cores
  hex `#RRGGBB` ou `#RRGGBBAA`; ids de categoria/status inteiros positivos.
- A configuração é um **singleton**: existe uma única config do portal. Os
  `PATCH` atualizam **apenas a seção indicada**; nenhum `PATCH` de seção altera
  as demais.

---

## Tipos compartilhados

```ts
// Modo de acesso ao formulário de solicitação.
export type SolicitationMode = 'PUBLIC' | 'AUTHENTICATED';

// Assets do portal — sempre URLs (relativa do próprio app ou http(s)).
export interface PortalAssets {
	logoUrl: string;
	avatarUrl: string;
	faviconUrl: string;
	loginImageUrl: string;
}

export type AssetKey = keyof PortalAssets;

// Atualização parcial de assets do card: apenas as chaves alteradas.
export type PortalAssetsPatch = Partial<Pick<PortalAssets, AssetKey>>;

// Tom visual de um status — allowlist semântica (nome da cor, não da etapa).
export const STATUS_TONES = ['error', 'success', 'info', 'warning', 'neutral'] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

// Cores de um tom (modelo monocromático): acento (`color`) e fundo
// (`background`). O rótulo e o ponto usam o acento; a borda é derivada de
// `color` via color-mix e não é armazenada. `backgroundLocked` indica fundo
// manual/travado — enquanto `true`, mudar o acento não recalcula o fundo.
export interface StatusToneTokens {
	color: string;
	background: string;
	backgroundLocked: boolean;
}

// Papéis de uma paleta. `statuses` guarda as cores por tom; `gradient` é
// composto (from/to/angle) — ambos fora da record de tokens simples.
export const THEME_TOKEN_KEYS = [
	'background',
	'surface',
	'border',
	'textPrimary',
	'textSecondary',
	'richBlack',
	'primary',
	'secondary',
	'tint',
	'onPrimary',
	'onDark',
	'onGradient'
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

// Gradiente de superfícies de destaque (hero/banner). Modelado por paleta,
// independente de `primary`/`secondary` — no dark o gradiente precisa seguir
// escuro para o texto branco manter contraste (não derivar das cores de marca).
export interface ThemeGradient {
	from: string; // hex #RRGGBB / #RRGGBBAA
	to: string; // hex #RRGGBB / #RRGGBBAA
	angle?: number; // graus 0..360 (default 143 quando ausente)
}

export interface ThemeTokens extends Record<ThemeTokenKey, string> {
	statuses: Record<StatusTone, StatusToneTokens>;
	gradient: ThemeGradient;
}

// Paletas do portal — claro e escuro. O usuário escolhe qual usar (preferência
// local); o admin configura as duas.
export interface PortalTheme {
	light: ThemeTokens;
	dark: ThemeTokens;
}

// Categoria da demanda. `id` é a chave estável; em itens **novos** é gerado pelo
// cliente (maior id atual + 1) e aceito pelo backend. A ordem do array é a ordem
// de exibição.
export interface PortalCategory {
	id: number;
	name: string;
	description: string;
	isActive: boolean;
}

// Visibilidade de um status: PUBLIC aparece ao solicitante; INTERNAL fica
// restrito à equipe.
export type StatusVisibility = 'PUBLIC' | 'INTERNAL';

// Status do ciclo de vida. `closesRequest` encerra a solicitação; `visibility` e
// `tone` são enums allowlist.
export interface PortalStatus {
	id: number;
	name: string;
	visibility: StatusVisibility;
	closesRequest: boolean;
	tone: StatusTone;
}

// Critérios fixos de priorização (allowlist das chaves aceitas).
export const PRIORITIZATION_CRITERIA = [
	'operationalImpact',
	'operationalRisk',
	'urgency',
	'volumetry',
	'manualEffort',
	'clientImpact',
	'regulatoryDeadline',
	'affectedAreas',
	'strategicAlignment',
	'estimatedComplexity'
] as const;

export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];

// Pesos da priorização — objeto completo, sempre com todas as chaves, cada peso
// entre 1.0 e 5.0 (passo 0.5).
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;

// Config completa (GET) e recortes de cada seção editável.
export interface PortalConfig {
	platformName: string;
	solicitationMode: SolicitationMode;
	protocolMask: string;
	theme: PortalTheme;
	assets: PortalAssets;
	categories: PortalCategory[];
	statuses: PortalStatus[];
	prioritizationWeights: PrioritizationWeights;
}

export type AccessSection = Pick<PortalConfig, 'solicitationMode'>;
export type IdentitySection = Pick<PortalConfig, 'platformName' | 'protocolMask'>;
export type ThemeSection = Pick<PortalConfig, 'theme'>;
export type AssetsSection = Pick<PortalConfig, 'assets'>;
export type CategoriesSection = Pick<PortalConfig, 'categories'>;
export type StatusesSection = Pick<PortalConfig, 'statuses'>;
export type PrioritizationWeightsSection = Pick<PortalConfig, 'prioritizationWeights'>;
```

---

## 1. GET /portal-config — Ler configuração

Público, sem autenticação. Retorna a config consolidada do portal. É chamado no
`hooks.server.ts` de **todas** as rotas (SSR); falha de rede cai nos defaults
locais do frontend — o backend não precisa tratar esse fallback.

**Response 200** — `PortalConfig`:

```json
{
	"platformName": "MAAT",
	"solicitationMode": "PUBLIC",
	"protocolMask": "MAAT",
	"theme": {
		"light": {
			"background": "#f0f4f8",
			"surface": "#fafafa",
			"border": "#e5e7eb",
			"textPrimary": "#3c3e47",
			"textSecondary": "#757682",
			"richBlack": "#0f1a2a",
			"primary": "#00236f",
			"secondary": "#0058be",
			"tint": "#d6e7fb",
			"onPrimary": "#ffffff",
			"onDark": "#ffffff",
			"onGradient": "#ffffff",
			"gradient": { "from": "#002068", "to": "#003399", "angle": 143 },
			"statuses": {
				"error": { "color": "#ef4444", "background": "#ef444410", "backgroundLocked": true },
				"success": { "color": "#10b981", "background": "#10b98110", "backgroundLocked": true },
				"info": { "color": "#0058be", "background": "#0058be10", "backgroundLocked": true },
				"warning": { "color": "#956006", "background": "#f59e0b10", "backgroundLocked": true },
				"neutral": { "color": "#4b5563", "background": "#e5e7eb", "backgroundLocked": true }
			}
		},
		"dark": {
			"background": "#0b0f1a",
			"surface": "#141b2e",
			"border": "#2a3346",
			"textPrimary": "#e5e7eb",
			"textSecondary": "#9aa3b2",
			"richBlack": "#0f1a2a",
			"primary": "#4c7dff",
			"secondary": "#5b9bff",
			"tint": "#1b2942",
			"onPrimary": "#0b0f1a",
			"onDark": "#ffffff",
			"onGradient": "#ffffff",
			"gradient": { "from": "#0b0f1a", "to": "#1b2942", "angle": 143 },
			"statuses": {
				"error": { "color": "#f87171", "background": "#4c0f0a", "backgroundLocked": true },
				"success": { "color": "#4ade80", "background": "#0f2e1d", "backgroundLocked": true },
				"info": { "color": "#5b9bff", "background": "#1b2942", "backgroundLocked": true },
				"warning": { "color": "#fbbf24", "background": "#4a2e0f", "backgroundLocked": true },
				"neutral": { "color": "#9aa3b2", "background": "#2a3346", "backgroundLocked": true }
			}
		}
	},
	"assets": {
		"logoUrl": "/assets/MAAT-logo.svg",
		"avatarUrl": "/assets/avatar-default.svg",
		"faviconUrl": "/assets/favicon.svg",
		"loginImageUrl": "/assets/login.png"
	},
	"categories": [
		{
			"id": 1,
			"name": "Automação",
			"description": "Automação de atividades manuais",
			"isActive": true
		}
	],
	"statuses": [
		{ "id": 1, "name": "Em aberto", "visibility": "PUBLIC", "closesRequest": false, "tone": "info" }
	],
	"prioritizationWeights": {
		"operationalImpact": 1.0,
		"operationalRisk": 1.0,
		"urgency": 1.0,
		"volumetry": 1.0,
		"manualEffort": 1.0,
		"clientImpact": 1.0,
		"regulatoryDeadline": 1.0,
		"affectedAreas": 1.0,
		"strategicAlignment": 1.0,
		"estimatedComplexity": 1.0
	}
}
```

> O tema representado acima é só exemplo; o backend pode iniciar sem tema e o
> frontend aplica os defaults locais por token.

**Erros:** `500` (erro interno, sem detalhes vazados).

---

## 2. PATCH /portal-config/access — Modo de acesso (Card 1)

Admin. Atualiza o modo de abertura do portal.

**Body:**

```ts
export interface UpdateAccessRequest {
	solicitationMode: SolicitationMode; // 'PUBLIC' | 'AUTHENTICATED'
}
```

**Validações:** `solicitationMode` obrigatório e na allowlist.

**Response 200** — `AccessSection`:

```json
{ "solicitationMode": "AUTHENTICATED" }
```

**Erros:** `400` (ausente/fora da allowlist), `401`, `403`, `500`.

---

## 3. PATCH /portal-config/identity — Identidade da plataforma (Card 2)

Admin. Atualiza nome exibido e máscara do protocolo. Campos parciais: envie só
os alterados.

**Body:**

```ts
export interface UpdateIdentityRequest {
	platformName?: string; // máx. 80, trim não-vazio
	protocolMask?: string; // máx. 10, apenas letras e números
}
```

**Validações:** ao menos um campo presente; `platformName`
(`validations.ts` → `isValidPlatformName`); `protocolMask`
(`isValidProtocolMask`, `^[A-Za-z0-9]+$`).

**Response 200** — `IdentitySection`:

```json
{ "platformName": "MAAT", "protocolMask": "MAAT" }
```

**Erros:** `400` (nenhum campo; valor inválido), `401`, `403`, `500`.

---

## 4. PATCH /portal-config/theme — Identidade visual (Card 3)

Admin. **Atômico**: envia as duas paletas completas. Substitui todo o tema;
não há merge parcial por token.

**Body:**

```ts
export interface UpdateThemeRequest {
	theme: PortalTheme; // light + dark completos
}
```

**Validações:**

- `light` e `dark` presentes; todos os `THEME_TOKEN_KEYS` em hex válido;
- `gradient` com `from`/`to` em hex (`#RRGGBB`/`#RRGGBBAA`) e `angle` inteiro
  0..360 (opcional; assume 143 quando ausente);
- `statuses` com os 5 `STATUS_TONES`; cada tom com `color`/`background` em hex
  (`#RRGGBB`/`#RRGGBBAA`) e `backgroundLocked` booleano.

**Response 200** — `ThemeSection`:

```json
{ "theme": { "light": { "...": "..." }, "dark": { "...": "..." } } }
```

**Erros:** `400` (paleta ausente, cor inválida, tom inválido), `401`, `403`,
`500`.

---

## 5. PATCH /portal-config/assets — Assets (Card 4)

Admin. **`multipart/form-data`** e **atômico**: o backend grava os binários
enviados e atualiza as URLs no config numa única operação. Nada é persistido até
esta chamada (o frontend só faz preview local antes de salvar).

**Partes do multipart:**

| Parte           | Tipo               | Descrição                                                                  |
| --------------- | ------------------ | -------------------------------------------------------------------------- |
| `assets`        | `application/json` | `PortalAssetsPatch` com as chaves definidas por URL (reset/URL existente). |
| `logoUrl`       | binário (arquivo)  | Novo arquivo do logo (opcional).                                           |
| `avatarUrl`     | binário (arquivo)  | Novo arquivo do avatar (opcional).                                         |
| `faviconUrl`    | binário (arquivo)  | Novo arquivo do favicon (opcional).                                        |
| `loginImageUrl` | binário (arquivo)  | Novo arquivo da imagem de login (opcional).                                |

Regra de merge: cada parte binária nomeada por chave define a URL daquela chave
(após o storage); cada chave presente no JSON `assets` define a URL diretamente
(útil para restaurar um asset padrão estático). Chaves ausentes permanecem como
estão. Enviar ao menos uma parte (JSON com chaves ou arquivo).

**Tipos/tamanho por asset** (espelho de `ASSET_FILE_RULES`):

| Chave           | MIME aceitos                                 | Extensões                        | Máx. |
| --------------- | -------------------------------------------- | -------------------------------- | ---- |
| `logoUrl`       | `image/png`, `image/svg+xml`                 | `.png`, `.svg`                   | 2 MB |
| `avatarUrl`     | `image/jpeg`, `image/png`                    | `.jpg`, `.jpeg`, `.png`          | 2 MB |
| `faviconUrl`    | `image/x-icon`, `image/svg+xml`, `image/png` | `.ico`, `.svg`, `.png`           | 1 MB |
| `loginImageUrl` | `image/jpeg`, `image/png`, `image/webp`      | `.jpg`, `.jpeg`, `.png`, `.webp` | 5 MB |

**Response 200** — `AssetsSection` (URLs consolidadas, todas as 4 chaves):

```json
{
	"assets": {
		"logoUrl": "/uploads/portal/logo-8f3a.png",
		"avatarUrl": "/uploads/portal/avatar-default.svg",
		"faviconUrl": "/uploads/portal/favicon.ico",
		"loginImageUrl": "https://cdn.exemplo.com/portal/login.webp"
	}
}
```

**Erros:** `400` (nenhuma parte; JSON inválido; chave fora da allowlist; URL
inválida), `413` (excede o tamanho), `415` (tipo não permitido), `401`, `403`,
`500`.

---

## 6. PATCH /portal-config/categories — Categorias (Card 5)

Admin. **Lista atômica**: envia a lista completa; a ordem é a de exibição.

**Body:**

```ts
export interface UpdateCategoriesRequest {
	categories: PortalCategory[];
}
```

**Validações:**

- 1 a 50 itens; `id` inteiro positivo (aceito gerado pelo cliente em itens
  novos); `name` trim 1..40; `description` ≤ 200; `isActive` booleano;
- nomes únicos (trim, case-insensitive); ao menos uma categoria ativa.

**Response 200** — `CategoriesSection` (lista consolidada, com ids finais).

**Erros:** `400` (vazia, > 50, item inválido, nome repetido, nenhuma ativa),
`401`, `403`, `500`.

---

## 7. PATCH /portal-config/statuses — Status (Card 6)

Admin. **Lista atômica**: envia a lista completa; a ordem é a de exibição.

**Body:**

```ts
export interface UpdateStatusesRequest {
	statuses: PortalStatus[];
}
```

**Validações:** 1 a 50 itens; `id` inteiro positivo; `name` trim 1..40; nomes
únicos (case-insensitive); `visibility` em `PUBLIC|INTERNAL`; `closesRequest`
booleano; `tone` nos 5 `STATUS_TONES`.

**Response 200** — `StatusesSection` (lista consolidada, com ids finais).

**Erros:** `400` (vazia, > 50, item inválido, nome repetido), `401`, `403`,
`500`.

---

## 8. PATCH /portal-config/prioritization-weights — Pesos (Card 7)

Admin. **Objeto atômico**: envia todos os critérios com seus pesos.

**Body:**

```ts
export interface UpdatePrioritizationWeightsRequest {
	prioritizationWeights: PrioritizationWeights;
}
```

**Validações:** todas as `PRIORITIZATION_CRITERIA` presentes; nenhuma chave
desconhecida; cada peso entre **1.0 e 5.0** (passo 0.5).

**Response 200** — `PrioritizationWeightsSection`:

```json
{ "prioritizationWeights": { "operationalImpact": 1.5, "operationalRisk": 1.0 } }
```

**Erros:** `400` (chave faltando/desconhecida, peso fora de 1.0–5.0), `401`,
`403`, `500`.

---

## Observações / divergências

- **Status como fonte única.** `PortalConfig.statuses` é a fonte do ciclo de
  vida configurável. O `RequestStatus` de 17 valores fixos de
  `solicitations-api-requests-0_4.md` passa a ser **dinâmico** (nome validado
  contra este cadastro) — alinhamento pendente com aquele contrato.
- **Categorias por nome.** As solicitações referenciam a categoria pelo **nome**
  (string validada contra o cadastro); o `id` serve ao CRUD administrativo. O
  `id` de itens novos é gerado no cliente (maior id + 1) e aceito pelo backend.
  Referência por `id` fica como evolução futura.
- **Pesos x priorização.** `PATCH /portal-config/prioritization-weights`
  atualiza os mesmos pesos usados pelo módulo de priorização
  (`prioritization-api.md`, `criteria.weight`). O backend mapeia a escala
  1.0–5.0 deste contrato para sua representação interna (a seed de priorização
  usa peso 10). A divergência com a decisão **D-O3** daquele contrato (“o
  backend nunca lê peso vindo do frontend”) fica registrada: aqui a tela de
  configurações passa a ser o caminho administrativo de escrita.
- **Tema monocromático.** `StatusToneTokens` não possui `text`: o rótulo usa o
  próprio `color`. São 5 tons. `backgroundLocked` é persistido (intenção de
  edição do admin).
- **Tokens de "sobre" e gradiente.** `onPrimary` (texto sobre
  `primary`/`secondary`), `onDark` (texto sobre superfícies sempre escuras) e
  `onGradient` (texto sobre o gradiente) são configuráveis por paleta, assim
  como `gradient` (`from`/`to`/`angle`). Eles substituem os antigos
  `--on-primary`/`--on-dark`/`--gradient` estáticos do CSS. A **aplicação**
  (mapeamento das custom properties e consumo em Banner/hero/tooltip) é tratada
  na branch `fix/dark-mode-tokenizacao`; o advisor de contraste cobre
  `onGradient × gradient`.
- **Assets multipart.** Diferente das demais seções (JSON), o `PATCH` de assets
  é `multipart/form-data` para permitir commit atômico de binário + config, sem
  endpoint de upload separado e sem arquivo órfão em cancelamento.
- **Sem `POST` de config.** O config é singleton; a escrita é sempre `PATCH` por
  seção. Não há criação.

## Pendências de alinhamento

- Backend confirmar status dinâmico x matriz de 17 valores do contrato de
  solicitações.
- Backend confirmar a reconciliação de pesos (escala 1.0–5.0 x `criteria.weight`).
- Backend definir storage/CDN dos assets e o formato das URLs retornadas.
- Evolução: referência de categoria por `id` (hoje por nome).
