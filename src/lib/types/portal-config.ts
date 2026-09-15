// Contrato de configuração pública do portal. O contrato definitivo é definido
// pela issue #90; campos novos entram como incrementos neste mesmo tipo.

// Modo de acesso ao formulário de solicitação (issue #88): em `PUBLIC` anônimos
// acessam o formulário; em `AUTHENTICATED` anônimos são direcionados ao login e
// o solicitante autenticado vê identidade pré-preenchida/bloqueada.
export type SolicitationMode = 'PUBLIC' | 'AUTHENTICATED';

// Tokens visuais permitidos — apenas chaves allowlist. A aplicação completa
// do tema (cores em páginas, flash minimizado) é escopo da issue #89.
export interface PortalThemeTokens {
	primaryColor: string;
	secondaryColor: string;
	backgroundColor: string;
}

// Assets do portal. Valores vindos da API passam por validação de URL segura
// (relativo do próprio app ou http/https); qualquer valor inválido cai no
// default local por campo (fallback).
export interface PortalAssets {
	logoUrl: string;
	avatarUrl: string;
	faviconUrl: string;
	loginImageUrl: string;
}

// Chaves dos assets — allowlist usada pelo service (sanitize do PATCH), pelo
// mock (upload/validação) e pelo estado da tela de configurações (dirty/save).
export type AssetKey = keyof PortalAssets;

export const ASSET_KEYS: readonly AssetKey[] = [
	'logoUrl',
	'avatarUrl',
	'faviconUrl',
	'loginImageUrl'
];

// Atualização parcial de assets via PATCH /portal-config — apenas as chaves
// alteradas são enviadas (mesmo princípio de minimum payload dos demais campos).
export type PortalAssetsPatch = Partial<Pick<PortalAssets, AssetKey>>;

// Categoria da demanda (Card 5) — alimenta o select do formulário de
// solicitação. `id` é a chave estável (número inteiro positivo, gerado pelo
// cliente em novas categorias e aceito pela API); a ordem de exibição é a
// ordem do array.
export interface PortalCategory {
	id: number;
	name: string;
	description: string;
	isActive: boolean;
}

// Visibilidade de um status do ciclo de vida: PUBLIC é exibido ao
// solicitante/cliente; INTERNAL fica restrito à equipe.
export type StatusVisibility = 'PUBLIC' | 'INTERNAL';

export const STATUS_VISIBILITIES: readonly StatusVisibility[] = ['PUBLIC', 'INTERNAL'];

// Tons visuais permitidos para um status — allowlist semântica (nome da cor,
// não da etapa) que a UI mapeia para os tokens de cor do tema.
export const STATUS_TONES = ['error', 'success', 'info', 'warning'] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

// Status do ciclo de vida da solicitação (Card 6) — lista gerenciada no
// PortalConfig. `id` é a chave estável (número inteiro positivo, gerado pelo
// cliente em novos status e aceito pela API); `closesRequest` indica se o
// status encerra a solicitação; `visibility` e `tone` são enums allowlist.
export interface PortalStatus {
	id: number;
	name: string;
	visibility: StatusVisibility;
	closesRequest: boolean;
	tone: StatusTone;
}

// Critérios fixos de priorização (Card 7) — allowlist das chaves aceitas.
// Diferente de categorias/status, os critérios não são gerenciáveis: apenas
// os pesos mudam, então o estado é um objeto com chaves estáveis.
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

// Pesos de priorização (Card 7) — objeto completo com todas as chaves da
// allowlist; cada peso é um número entre 1.0 e 5.0 (passo 0.5). O cálculo da
// prioridade em si é escopo do backend (os pesos são entrada da fórmula).
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;

export interface PortalConfig {
	platformName: string;
	// Consumo funcional na issue #88.
	solicitationMode: SolicitationMode;
	// Prefixo de exibição do protocolo — configura apenas o primeiro bloco
	// (ex.: "MAAT" de "MAAT-8K3P-9X2M"). A estrutura "XXXX-XXXX" é derivada;
	// somente o bloco inicial é configurável.
	protocolMask: string;
	theme: PortalThemeTokens;
	assets: PortalAssets;
	// Categorias que alimentam o select do formulário de solicitação (Card 5).
	// A API é a autoridade; o frontend espelha a lista completa no estado.
	categories: PortalCategory[];
	// Status do ciclo de vida das solicitações (Card 6). Mesma semântica das
	// categorias: lista atômica, ordem de exibição = ordem do array.
	statuses: PortalStatus[];
	// Pesos de priorização dos critérios (Card 7). Objeto completo, sempre com
	// todas as chaves da allowlist (PRIORITIZATION_CRITERIA).
	prioritizationWeights: PrioritizationWeights;
}

// Campos editáveis pela tela de configurações — allowlist que cresce conforme
// novos cards entram em escopo (ver CONTRATO-BACKEND.md). O serviço só aceita
// essas chaves no payload de atualização; o backend permanece a autoridade.
export type EditablePortalConfigFields =
	| 'solicitationMode'
	| 'platformName'
	| 'protocolMask'
	| 'assets'
	| 'categories'
	| 'statuses'
	| 'prioritizationWeights';

// Payload parcial de atualização (PATCH /portal-config) — apenas campos
// da allowlist acima, enviados somente quando alterados. `assets` aceita
// um objeto parcial (só as chaves de assets modificadas); `categories` e
// `statuses` são as listas completas (atômicas — a ordem dos itens importa
// e o backend retorna o estado consolidado); `prioritizationWeights` é o
// objeto completo de pesos (atômico — todas as chaves presentes).
export type UpdatePortalConfigPayload = Partial<
	Pick<
		PortalConfig,
		Exclude<
			EditablePortalConfigFields,
			'assets' | 'categories' | 'statuses' | 'prioritizationWeights'
		>
	>
> & {
	assets?: PortalAssetsPatch;
	categories?: PortalCategory[];
	statuses?: PortalStatus[];
	prioritizationWeights?: PrioritizationWeights;
};
