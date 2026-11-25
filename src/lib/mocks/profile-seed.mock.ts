/**
 * Ids dos perfis base, compartilhados pelos mocks de sessão (`auth.mock`) e de
 * catálogo (`profiles.mock`). Fonte única: a sessão resolve o perfil pelo nome
 * do usuário e o catálogo usa os mesmos ids.
 */
export const BASE_PROFILE_IDS = {
	Solicitante: '1',
	Analista: '2',
	Visualizador: '3',
	Administrador: '4',
	'Admin Root': '5'
} as const;
