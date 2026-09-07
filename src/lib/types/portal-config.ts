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
}
