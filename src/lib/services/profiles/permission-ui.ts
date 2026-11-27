import type { PermissionKey } from '$lib/types/permission';

/**
 * Copy de produto do catálogo de permissões. O backend é a fonte da verdade da
 * estrutura (chave, custódia e dependências); rótulos e descrições vivem aqui
 * até o catálogo expor `description`.
 */
export interface PermissionUiEntry {
	label: string;
	description: string;
}

export const PERMISSION_UI: Record<PermissionKey, PermissionUiEntry> = {
	'request:create': {
		label: 'Abrir solicitações',
		description: 'Abrir novas solicitações.'
	},
	'request:track': {
		label: 'Acompanhar solicitações',
		description: 'Acompanhar o andamento das próprias solicitações.'
	},
	'request:read': {
		label: 'Consultar solicitações',
		description: 'Consultar solicitações dentro do escopo escolhido.'
	},
	'request:write': {
		label: 'Editar solicitações',
		description: 'Editar os dados internos das solicitações dentro do escopo.'
	},
	'request:assign': {
		label: 'Atribuir responsáveis',
		description: 'Atribuir analistas responsáveis pela triagem ou pelo mapeamento.'
	},
	'request:status_change': {
		label: 'Alterar status',
		description: 'Mover solicitações entre os status permitidos pelo fluxo.'
	},
	'request:status_override': {
		label: 'Alterar status fora do fluxo',
		description: 'Mudar o status ignorando as restrições do fluxo operacional.'
	},
	'queue:read': {
		label: 'Consultar a fila',
		description: 'Ver as solicitações disponíveis na fila de atendimento.'
	},
	'queue:export': {
		label: 'Exportar a fila',
		description: 'Baixar os dados da fila de atendimento.'
	},
	'reports:read': {
		label: 'Consultar relatórios',
		description: 'Ver os relatórios e indicadores do portal.'
	},
	'triage:read': {
		label: 'Consultar triagens',
		description: 'Ler as triagens registradas nas solicitações.'
	},
	'triage:write': {
		label: 'Registrar triagens',
		description: 'Preencher e alterar a triagem das solicitações.'
	},
	'mapping:read': {
		label: 'Consultar mapeamentos',
		description: 'Ler os mapeamentos registrados nas solicitações.'
	},
	'mapping:write': {
		label: 'Registrar mapeamentos',
		description: 'Preencher e alterar o mapeamento das solicitações.'
	},
	'prioritization:write': {
		label: 'Calcular prioridade',
		description: 'Aplicar a calculadora de prioridade às solicitações.'
	},
	'pending_item:read': {
		label: 'Consultar pendências',
		description: 'Ver as pendências abertas nas solicitações.'
	},
	'pending_item:write': {
		label: 'Criar pendências',
		description: 'Solicitar informações ou ajustes ao solicitante.'
	},
	'pending_item:review': {
		label: 'Revisar pendências',
		description: 'Aprovar ou recusar as respostas enviadas pelo solicitante.'
	},
	'pending_item:respond': {
		label: 'Responder pendências',
		description: 'Responder aos pedidos de informação das próprias solicitações.'
	},
	'internal_note:read': {
		label: 'Ler observações internas',
		description: 'Ler as observações internas e a linha do tempo da solicitação.'
	},
	'internal_note:write': {
		label: 'Adicionar observações internas',
		description: 'Adicionar novas observações internas.'
	},
	'audit:read': {
		label: 'Consultar auditoria',
		description: 'Ver o histórico de auditoria das operações.'
	},
	'assignee_directory:read': {
		label: 'Consultar diretório de responsáveis',
		description: 'Listar os analistas disponíveis para atribuição.'
	},
	'user:read': {
		label: 'Consultar usuários',
		description: 'Ver as contas de usuário do portal.'
	},
	'user:manage': {
		label: 'Gerenciar usuários',
		description: 'Criar, editar, ativar e redefinir a senha de usuários.'
	},
	'profile:read': {
		label: 'Consultar perfis',
		description: 'Ver os perfis de acesso e suas permissões.'
	},
	'profile:manage': {
		label: 'Gerenciar perfis',
		description: 'Criar, editar, duplicar e desativar perfis de acesso.'
	},
	'theme:read': {
		label: 'Consultar identidade visual',
		description: 'Ver as configurações visuais do portal.'
	},
	'theme:manage': {
		label: 'Gerenciar identidade visual',
		description: 'Alterar as configurações visuais do portal.'
	},
	'category:read': {
		label: 'Consultar categorias',
		description: 'Ver as categorias de solicitação.'
	},
	'category:manage': {
		label: 'Gerenciar categorias',
		description: 'Criar e editar categorias de solicitação.'
	},
	'status:read': {
		label: 'Consultar status',
		description: 'Ver os status do fluxo de solicitações.'
	},
	'status:manage': {
		label: 'Gerenciar status',
		description: 'Criar e editar os status do fluxo de solicitações.'
	},
	'portal_setting:read': {
		label: 'Consultar configurações do portal',
		description: 'Ver as configurações gerais do portal.'
	},
	'portal_setting:manage': {
		label: 'Gerenciar configurações do portal',
		description: 'Alterar as configurações gerais do portal.'
	},
	'prioritization_config:read': {
		label: 'Consultar configuração de priorização',
		description: 'Ver os critérios e pesos da priorização.'
	},
	'prioritization_config:manage': {
		label: 'Gerenciar configuração de priorização',
		description: 'Alterar critérios e pesos da priorização.'
	}
};

export const RESOURCE_LABELS: Readonly<Record<string, string>> = {
	request: 'Solicitação',
	queue: 'Fila',
	reports: 'Relatórios',
	triage: 'Triagem',
	mapping: 'Mapeamento',
	prioritization: 'Priorização',
	pending_item: 'Pendências',
	internal_note: 'Observações internas',
	audit: 'Auditoria',
	assignee_directory: 'Diretório de responsáveis',
	user: 'Usuários',
	profile: 'Perfis',
	theme: 'Identidade visual',
	category: 'Categorias',
	status: 'Status',
	portal_setting: 'Configurações do portal',
	prioritization_config: 'Configuração de priorização'
};

export function humanizePermission(value: string): string {
	return value
		.split(':')
		.map((part) => part.replace(/_/g, ' '))
		.join(' · ')
		.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}

export function permissionLabel(key: PermissionKey): string {
	return PERMISSION_UI[key]?.label ?? humanizePermission(key);
}

export function permissionDescription(key: PermissionKey): string {
	return PERMISSION_UI[key]?.description ?? '';
}

export function resourceLabel(resource: string): string {
	return RESOURCE_LABELS[resource] ?? humanizePermission(resource);
}
