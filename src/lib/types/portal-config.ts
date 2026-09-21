// Contrato de configuração pública do portal. O contrato definitivo é definido
// pela issue #90; campos novos entram como incrementos neste mesmo tipo.

// Modo de acesso ao formulário de solicitação (issue #88): em `PUBLIC` anônimos
// acessam o formulário; em `AUTHENTICATED` anônimos são direcionados ao login e
// o solicitante autenticado vê identidade pré-preenchida/bloqueada.
export type SolicitationMode = 'PUBLIC' | 'AUTHENTICATED';

// Assets do portal — sempre URLs de imagem (relativa do próprio app ou http(s)).
// Cada imagem tem variante para os temas claro/escuro; `*DarkUrl` vazio cai para
// a variante clara (fallback). Valores vindos da API passam por validação de URL
// segura e qualquer valor inválido cai no default local por campo.
export interface PortalAssets {
	logoLightUrl: string;
	logoDarkUrl: string;
	// Quando true, o logo (SVG) é renderizado monocromático em `var(--primary-color)`
	// e a variante escura é ignorada. Sem efeito para assets que não sejam SVG.
	logoUsePrimaryColor: boolean;
	avatarLightUrl: string;
	avatarDarkUrl: string;
	loginImageLightUrl: string;
	loginImageDarkUrl: string;
	faviconLightUrl: string;
	faviconDarkUrl: string;
}

// Chaves de URL dos assets — allowlist usada pelo service (sanitize do PATCH),
// pelo mock (upload/validação) e pelo estado da tela de configurações
// (dirty/save). O flag `logoUsePrimaryColor` (booleano) fica fora desta lista.
export const ASSET_KEYS = [
	'logoLightUrl',
	'logoDarkUrl',
	'avatarLightUrl',
	'avatarDarkUrl',
	'loginImageLightUrl',
	'loginImageDarkUrl',
	'faviconLightUrl',
	'faviconDarkUrl'
] as const;

export type AssetKey = (typeof ASSET_KEYS)[number];

// Atualização parcial de assets via PATCH /portal-config — apenas as chaves
// alteradas são enviadas (mesmo princípio de minimum payload dos demais campos).
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
	logoUsePrimaryColor?: boolean;
};

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
export const STATUS_TONES = ['error', 'success', 'info', 'warning', 'neutral'] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

// Cores de um tom de status (modelo monocromático): acento (`color`) e fundo
// (`background`) do badge. O rótulo e o ponto usam o acento; a borda é derivada
// de `color` via `color-mix` e não é armazenada (decisão do plano de
// configurações). `backgroundLocked` trava o fundo em modo manual: enquanto
// `true`, mudar o acento não recalcula o fundo.
export interface StatusToneTokens {
	color: string;
	background: string;
	backgroundLocked: boolean;
}

// Chaves de papel de uma paleta — allowlist usada pelo service e pelo mock para
// sanitizar/validar. `statuses` e `gradient` ficam de fora (validados à parte).
export const THEME_TOKEN_KEYS = [
	'background',
	'surface',
	'border',
	'textPrimary',
	'textSecondary',
	'heading',
	'richBlack',
	'primary',
	'secondary',
	'tint',
	'onPrimary',
	'onDark',
	'onGradient'
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];

// Gradiente de superfícies de destaque (hero/banner), por paleta. Independente
// de `primary`/`secondary`: no dark o gradiente precisa seguir escuro para o
// texto branco manter contraste.
export interface ThemeGradient {
	from: string;
	to: string;
	angle?: number;
}

// Paleta de tema (uma por modo). O admin configura cada papel; a UI consome via
// custom properties CSS. `statuses` guarda as cores de cada tom do ciclo de
// vida; `gradient` compõe as superfícies de destaque.
export interface ThemeTokens extends Record<ThemeTokenKey, string> {
	statuses: Record<StatusTone, StatusToneTokens>;
	gradient: ThemeGradient;
}

// Paletas do portal — claro e escuro. O usuário escolhe qual usar (preferência
// local no cliente); o admin configura as cores das duas.
export interface PortalTheme {
	light: ThemeTokens;
	dark: ThemeTokens;
}

// Paleta de tema em edição/uso — chave de `PortalTheme`.
export type ThemePalette = keyof PortalTheme;

// Status do ciclo de vida da solicitação (Card 6) — lista gerenciada no
// PortalConfig. `id` é a chave estável (número inteiro positivo, gerado pelo
// cliente em novos status e aceito pela API); `closesRequest` indica se o
// status encerra a solicitação; `isTriageExit` marca as saídas elegíveis da
// triagem (distinto de `closesRequest`: "Pendente de informações" sai sem
// encerrar); `visibility` e `tone` são enums allowlist. `isActive` é a
// ativação/inativação (não há exclusão): status inativos permanecem no
// histórico, mas não entram em novos fluxos.
export interface PortalStatus {
	id: number;
	name: string;
	visibility: StatusVisibility;
	closesRequest: boolean;
	isTriageExit: boolean;
	tone: StatusTone;
	isActive: boolean;
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
// allowlist; cada peso é um número inteiro entre 1 e 10. O cálculo da
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
	theme: PortalTheme;
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

// ---- Seções editáveis (contrato portal-config-api.md) ----
//
// Cada card da tela de configurações edita uma seção independente, com seu
// próprio PATCH e Salvar/Cancelar. Os recortes abaixo tipam o corpo de cada
// requisição e a seção retornada pelo backend.

export type AccessSection = Pick<PortalConfig, 'solicitationMode'>;
export type IdentitySection = Pick<PortalConfig, 'platformName' | 'protocolMask'>;
export type ThemeSection = Pick<PortalConfig, 'theme'>;
export type AssetsSection = Pick<PortalConfig, 'assets'>;
export type CategoriesSection = Pick<PortalConfig, 'categories'>;
export type StatusesSection = Pick<PortalConfig, 'statuses'>;
export type PrioritizationWeightsSection = Pick<PortalConfig, 'prioritizationWeights'>;

// Falha autoritativa do GET /portal-config na tela de configurações. Estado de
// "falha ao carregar" precisa ser diferente de "configuração carregada": nunca
// é confundido com uma configuração válida (ver `portal-config-load.ts`).
export interface PortalConfigLoadError {
	status?: number;
	message: string;
}

// Chave de rota de cada seção — usada pela camada de dados e pelos cards.
export type PortalConfigSection =
	'access' | 'identity' | 'theme' | 'assets' | 'categories' | 'statuses' | 'prioritization-weights';

// Corpos das requisições de escrita (PATCH por seção). `theme`,
// `categories`, `statuses` e `prioritizationWeights` são atômicos (a seção
// inteira); `identity` é parcial (só os campos alterados); `assets` é um patch
// parcial de URLs por chave.
export interface UpdateAccessRequest {
	solicitationMode: SolicitationMode;
}

export interface UpdateIdentityRequest {
	platformName?: string;
	protocolMask?: string;
}

export interface UpdateThemeRequest {
	theme: PortalTheme;
}

export interface UpdateCategoriesRequest {
	categories: PortalCategory[];
}

export interface UpdateStatusesRequest {
	statuses: PortalStatus[];
}

export interface UpdatePrioritizationWeightsRequest {
	prioritizationWeights: PrioritizationWeights;
}
