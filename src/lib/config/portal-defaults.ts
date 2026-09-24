import type {
	PortalCategory,
	PortalConfig,
	PortalStatus,
	PortalTheme,
	PrioritizationWeights,
	StatusTone,
	StatusToneTokens
} from '$lib/types/portal-config';
import logoAsset from '$lib/assets/MAAT-logo.svg';
import avatarAsset from '$lib/assets/avatar-default.svg';
import faviconAsset from '$lib/assets/favicon.svg';
import loginImageAsset from '$lib/assets/login.png';
import loginImageDarkAsset from '$lib/assets/loginDark.png';

// Ordem de campos = contrato de serialização. Estes objetos espelham a ordem
// reconstruída pelas funções `sanitize*` de `portal-config.service.ts`. O
// `SectionState` compara defaults × draft com `JSON.stringify` (ver
// `$lib/states/section.svelte`); como a ordem das chaves faz parte da string,
// reordenar um campo aqui (ou lá) acusa diferença sem mudança real de valor.
// Defina os campos na mesma ordem nos dois arquivos.

// Categorias padrão do formulário de solicitação (Card 5). Espelham as antigas
// opções fixas (CATEGORY_OPTIONS) que passaram a ser configuráveis; servem
// também de fallback do service e de seed do mock. Dados fictícios.
export const DEFAULT_CATEGORIES: PortalCategory[] = [
	{
		id: 1,
		name: 'Automação',
		description: 'Automação de atividades manuais repetitivas',
		isActive: true
	},
	{
		id: 2,
		name: 'Melhoria de processo',
		description: 'Aprimoramento de fluxos e rotinas existentes',
		isActive: true
	},
	{
		id: 3,
		name: 'Indicador',
		description: 'Criação ou ajuste de indicadores e metas',
		isActive: true
	},
	{
		id: 4,
		name: 'Dashboard ou relatório',
		description: 'Painéis, relatórios e consultas gerenciais',
		isActive: true
	},
	{
		id: 5,
		name: 'Análise de dados',
		description: 'Estudos, cruzamentos e tratamento de dados',
		isActive: true
	},
	{
		id: 6,
		name: 'Padronização',
		description: 'Padronização de procedimentos, modelos e documentos',
		isActive: true
	},
	{
		id: 7,
		name: 'Revisão de processo',
		description: 'Revisão e redesenho de processos existentes',
		isActive: true
	},
	{
		id: 8,
		name: 'Apoio técnico',
		description: 'Suporte técnico especializado às áreas',
		isActive: true
	},
	{
		id: 9,
		name: 'Estudo de viabilidade',
		description: 'Avaliação de viabilidade técnica, operacional e de custo',
		isActive: true
	},
	{
		id: 10,
		name: 'Outros',
		description: 'Demandas que não se enquadram nas demais categorias',
		isActive: true
	}
];

// Status padrão do ciclo de vida das solicitações (Card 6) — 17 linhas v4
// (amend Anexo A). `18 Fora do escopo, 19 Duplicada` removidos (eram saídas
// `isTriageExit` de `contract-triage_04.md`). `isCore` 6 vitais `1,3,4,7,16,17`,
// `isTerminal` só `16,17`, `isRestricted` só `11 Priorizado none/none`.
export const DEFAULT_STATUSES: PortalStatus[] = [
	{
		id: 1,
		name: 'Solicitação enviada',
		order: 1,
		isCore: true,
		isPublic: true,
		isTerminal: false,
		triageMode: 'none',
		mappingMode: 'none',
		isRestricted: false,
		tone: 'neutral',
		isActive: true
	},
	{
		id: 2,
		name: 'Aguardando triagem',
		order: 2,
		isCore: false,
		isPublic: true,
		isTerminal: false,
		triageMode: 'none',
		mappingMode: 'none',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 3,
		name: 'Em triagem',
		order: 3,
		isCore: true,
		isPublic: true,
		isTerminal: false,
		triageMode: 'free',
		mappingMode: 'none',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 4,
		name: 'Pendente de informações',
		order: 4,
		isCore: true,
		isPublic: true,
		isTerminal: false,
		triageMode: 'free',
		mappingMode: 'free',
		isRestricted: false,
		tone: 'warning',
		isActive: true
	},
	{
		id: 5,
		name: 'Aguardando mapeamento',
		order: 5,
		isCore: false,
		isPublic: true,
		isTerminal: false,
		triageMode: 'conclusion_only',
		mappingMode: 'none',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 6,
		name: 'Mapeamento agendado',
		order: 6,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'none',
		mappingMode: 'conclusion_only',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 7,
		name: 'Em mapeamento',
		order: 7,
		isCore: true,
		isPublic: true,
		isTerminal: false,
		triageMode: 'none',
		mappingMode: 'free',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 8,
		name: 'Em análise de viabilidade',
		order: 8,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'free',
		mappingMode: 'free',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 9,
		name: 'Elegível',
		order: 9,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'conclusion_only',
		mappingMode: 'conclusion_only',
		isRestricted: false,
		tone: 'success',
		isActive: true
	},
	{
		id: 10,
		name: 'Não elegível',
		order: 10,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'conclusion_only',
		mappingMode: 'conclusion_only',
		isRestricted: false,
		tone: 'error',
		isActive: true
	},
	{
		id: 11,
		name: 'Priorizado',
		order: 11,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'none',
		mappingMode: 'none',
		isRestricted: true,
		tone: 'warning',
		isActive: true
	},
	{
		id: 12,
		name: 'Backlog',
		order: 12,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'conclusion_only',
		mappingMode: 'conclusion_only',
		isRestricted: false,
		tone: 'neutral',
		isActive: true
	},
	{
		id: 13,
		name: 'Direcionado para outra área',
		order: 13,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'conclusion_only',
		mappingMode: 'conclusion_only',
		isRestricted: false,
		tone: 'neutral',
		isActive: true
	},
	{
		id: 14,
		name: 'Em desenvolvimento',
		order: 14,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'free',
		mappingMode: 'none',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 15,
		name: 'Em homologação',
		order: 15,
		isCore: false,
		isPublic: false,
		isTerminal: false,
		triageMode: 'free',
		mappingMode: 'none',
		isRestricted: false,
		tone: 'info',
		isActive: true
	},
	{
		id: 16,
		name: 'Concluído',
		order: 16,
		isCore: true,
		isPublic: true,
		isTerminal: true,
		triageMode: 'conclusion_only',
		mappingMode: 'conclusion_only',
		isRestricted: false,
		tone: 'success',
		isActive: true
	},
	{
		id: 17,
		name: 'Cancelado',
		order: 17,
		isCore: true,
		isPublic: true,
		isTerminal: true,
		triageMode: 'conclusion_only',
		mappingMode: 'conclusion_only',
		isRestricted: false,
		tone: 'error',
		isActive: true
	}
];

// Rótulos em português dos critérios de priorização (Card 7) — ordem fixa de
// exibição, espelhando o card do Figma.
export const PRIORITIZATION_CRITERIA_LABELS = {
	operationalImpact: 'Impacto Operacional',
	operationalRisk: 'Risco Operacional',
	urgency: 'Urgência',
	volumetry: 'Volumetria',
	manualEffort: 'Esforço Manual',
	clientImpact: 'Impacto no Cliente',
	regulatoryDeadline: 'Prazo Regulatório',
	affectedAreas: 'Áreas Impactadas',
	strategicAlignment: 'Alinhamento Estratégico',
	estimatedComplexity: 'Complexidade Estimada'
} satisfies Record<keyof PrioritizationWeights, string>;

// Pesos padrão de priorização (Card 7) — todos em 1.0 (neutro). Servem de
// fallback do service e de seed do mock. Dados fictícios.
export const DEFAULT_PRIORITIZATION_WEIGHTS: PrioritizationWeights = {
	operationalImpact: 1.0,
	operationalRisk: 1.0,
	urgency: 1.0,
	volumetry: 1.0,
	manualEffort: 1.0,
	clientImpact: 1.0,
	regulatoryDeadline: 1.0,
	affectedAreas: 1.0,
	strategicAlignment: 1.0,
	estimatedComplexity: 1.0
};

// Tons de status da paleta clara — acento e fundo (~10%) do badge; o rótulo
// usa o próprio acento (modelo monocromático). Espelham os tokens atuais do
// design system (global.css). Dados fictícios.
const LIGHT_STATUS_TONES: Record<StatusTone, StatusToneTokens> = {
	error: { color: '#ef4444', background: '#ef444410', backgroundLocked: true },
	success: { color: '#10b981', background: '#10b98110', backgroundLocked: true },
	info: { color: '#0058be', background: '#0058be10', backgroundLocked: true },
	warning: { color: '#956006', background: '#f59e0b10', backgroundLocked: true },
	neutral: { color: '#4b5563', background: '#e5e7eb', backgroundLocked: true }
};

// Tons de status da paleta escura — acentos vivos sobre containers escuros,
// conforme docs/Dark-Mode-NEO-Kaizen-Documentacao-1.md.
const DARK_STATUS_TONES: Record<StatusTone, StatusToneTokens> = {
	error: { color: '#f87171', background: '#4c0f0a', backgroundLocked: true },
	success: { color: '#4ade80', background: '#0f2e1d', backgroundLocked: true },
	info: { color: '#5b9bff', background: '#1b2942', backgroundLocked: true },
	warning: { color: '#fbbf24', background: '#4a2e0f', backgroundLocked: true },
	neutral: { color: '#9aa3b2', background: '#2a3346', backgroundLocked: true }
};

// Paletas padrão do portal — light preserva os valores atuais do design system;
// dark segue a documentação oficial de Dark Mode. Único dono dos defaults das
// paletas; consumido pelo service (fallback) e pelo estado de cliente.
export const DEFAULT_THEME: PortalTheme = {
	light: {
		background: '#f0f4f8',
		surface: '#fafafa',
		border: '#e5e7eb',
		textPrimary: '#3c3e47',
		textSecondary: '#757682',
		heading: '#00236f',
		richBlack: '#0f1a2a',
		primary: '#00236f',
		secondary: '#0058be',
		tint: '#d6e7fb',
		onPrimary: '#ffffff',
		onDark: '#ffffff',
		onGradient: '#ffffff',
		gradient: { from: '#002068', to: '#003399', angle: 143 },
		statuses: LIGHT_STATUS_TONES
	},
	dark: {
		background: '#0b0f1a',
		surface: '#141b2e',
		border: '#2a3346',
		textPrimary: '#e5e7eb',
		textSecondary: '#9aa3b2',
		heading: '#4c7dff',
		richBlack: '#0f1a2a',
		primary: '#4c7dff',
		secondary: '#5b9bff',
		tint: '#1b2942',
		onPrimary: '#0b0f1a',
		onDark: '#ffffff',
		onGradient: '#ffffff',
		gradient: { from: '#002068', to: '#003399', angle: 143 },
		statuses: DARK_STATUS_TONES
	}
};

// Defaults locais do portal — espelham os valores atuais do design system
// (global.css `:root`) e os assets estáticos existentes. Único dono dos
// defaults; consumido pelo service (fallback) e pelo estado de cliente.
export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
	platformName: 'MAAT',
	solicitationMode: 'PUBLIC',
	protocolMask: 'MAAT',
	theme: structuredClone(DEFAULT_THEME),
	assets: {
		logoLightUrl: logoAsset,
		logoDarkUrl: logoAsset,
		logoUsePrimaryColor: true,
		avatarLightUrl: avatarAsset,
		avatarDarkUrl: avatarAsset,
		loginImageLightUrl: loginImageAsset,
		loginImageDarkUrl: loginImageDarkAsset,
		faviconLightUrl: faviconAsset,
		faviconDarkUrl: faviconAsset
	},
	categories: structuredClone(DEFAULT_CATEGORIES),
	statuses: structuredClone(DEFAULT_STATUSES),
	prioritizationWeights: { ...DEFAULT_PRIORITIZATION_WEIGHTS }
};
