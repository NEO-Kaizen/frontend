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
		role: 'root' | 'admin' | 'analyst' | 'manager' | 'requester';
	};
}
