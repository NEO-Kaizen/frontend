import type { PortalCategory, PortalConfig, PortalStatus } from '$lib/types/portal-config';
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
		tone: 'open'
	},
	{
		id: 2,
		name: 'Em análise',
		visibility: 'PUBLIC',
		closesRequest: false,
		tone: 'analysis'
	},
	{
		id: 3,
		name: 'Em andamento',
		visibility: 'PUBLIC',
		closesRequest: false,
		tone: 'in-progress'
	},
	{
		id: 4,
		name: 'Aguardando cliente',
		visibility: 'PUBLIC',
		closesRequest: false,
		tone: 'awaiting'
	},
	{
		id: 5,
		name: 'Concluído',
		visibility: 'PUBLIC',
		closesRequest: true,
		tone: 'done'
	},
	{
		id: 6,
		name: 'Cancelado',
		visibility: 'INTERNAL',
		closesRequest: true,
		tone: 'cancelled'
	}
];

// Defaults locais do portal — espelham os valores atuais do design system
// (global.css `:root`) e os assets estáticos existentes. Único dono dos
// defaults; consumido pelo service (fallback) e pelo estado de cliente.
export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
	platformName: 'MAAT',
	solicitationMode: 'PUBLIC',
	protocolMask: 'MAAT',
	theme: {
		primaryColor: '#00236f',
		secondaryColor: '#0058be',
		backgroundColor: '#f0f4f8'
	},
	assets: {
		logoUrl,
		avatarUrl,
		faviconUrl,
		loginImageUrl
	},
	categories: structuredClone(DEFAULT_CATEGORIES),
	statuses: structuredClone(DEFAULT_STATUSES)
};
