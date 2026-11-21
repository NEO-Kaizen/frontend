// Erro HTTP da camada de comunicação — compartilhado por api/ e mocks/.
export class ApiError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

// Retorno padrão dos services — exceções nunca estouram para a UI.
export type Result<T> =
	{ ok: true; data: T } | { ok: false; error: { status?: number; message: string } };
