import type {
	PortalCategory,
	PortalConfig,
	PortalStatus,
	PortalTheme,
	PrioritizationWeights,
	StatusTone,
	StatusToneTokens
} from '$lib/types/portal-config';
import logoUrl from '$lib/assets/MAAT-logo.svg';
import avatarUrl from '$lib/assets/avatar-default.svg';
import faviconUrl from '$lib/assets/favicon.svg';
import loginImageUrl from '$lib/assets/login.png';

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

// Status padrão do ciclo de vida das solicitações (Card 6). Espelham os
// status exibidos no card de configuração; `closesRequest` indica encerramento
// e `tone`/`visibility` são enums allowlist do contrato. Servem de fallback do
// service e de seed do mock. Dados fictícios.
export const DEFAULT_STATUSES: PortalStatus[] = [
	{
		id: 1,
		name: 'Em aberto',
		visibility: 'PUBLIC',
		closesRequest: false,
		tone: 'info'
	},
	{
		id: 2,
		name: 'Em análise',
		visibility: 'PUBLIC',
		closesRequest: false,
		tone: 'warning'
	},
	{
		id: 3,
		name: 'Em andamento',
		visibility: 'PUBLIC',
		closesRequest: false,
		tone: 'info'
	},
	{
		id: 4,
		name: 'Aguardando cliente',
		visibility: 'PUBLIC',
		closesRequest: false,
		tone: 'warning'
	},
	{
		id: 5,
		name: 'Concluído',
		visibility: 'PUBLIC',
		closesRequest: true,
		tone: 'success'
	},
	{
		id: 6,
		name: 'Cancelado',
		visibility: 'INTERNAL',
		closesRequest: true,
		tone: 'error'
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
	error: { color: '#ef4444', background: '#ef444410' },
	success: { color: '#10b981', background: '#10b98110' },
	info: { color: '#0058be', background: '#0058be10' },
	warning: { color: '#956006', background: '#f59e0b10' }
};

// Tons de status da paleta escura — acentos vivos sobre containers escuros,
// conforme docs/Dark-Mode-NEO-Kaizen-Documentacao-1.md.
const DARK_STATUS_TONES: Record<StatusTone, StatusToneTokens> = {
	error: { color: '#f87171', background: '#4c0f0a' },
	success: { color: '#4ade80', background: '#0f2e1d' },
	info: { color: '#5b9bff', background: '#1b2942' },
	warning: { color: '#fbbf24', background: '#4a2e0f' }
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
		richBlack: '#0f1a2a',
		primary: '#00236f',
		secondary: '#0058be',
		tint: '#d6e7fb',
		statuses: LIGHT_STATUS_TONES
	},
	dark: {
		background: '#0b0f1a',
		surface: '#141b2e',
		border: '#2a3346',
		textPrimary: '#e5e7eb',
		textSecondary: '#9aa3b2',
		richBlack: '#0f1a2a',
		primary: '#4c7dff',
		secondary: '#5b9bff',
		tint: '#1b2942',
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
		logoUrl,
		avatarUrl,
		faviconUrl,
		loginImageUrl
	},
	categories: structuredClone(DEFAULT_CATEGORIES),
	statuses: structuredClone(DEFAULT_STATUSES),
	prioritizationWeights: { ...DEFAULT_PRIORITIZATION_WEIGHTS }
};
