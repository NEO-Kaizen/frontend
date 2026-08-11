export interface LoginCredentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	user: {
		id: string;
		name: string;
		email: string;
		role: 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';
	};
}
