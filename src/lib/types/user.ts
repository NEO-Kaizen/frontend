export type UserType = 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';

//interface incompleta, precisa ajustar quando tiver firmado o contrato de quem é o Usuário
export interface User {
		name: string;
		userType: UserType;
	}