export interface LoginCredentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: {
		id: string;
		name: string;
		email: string;
		role: 'Solicitante' | 'Analista' | 'Administrador' | 'Gestor';
	};
}
