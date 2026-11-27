// Erro HTTP da camada de comunicação — compartilhado por api/ e mocks/.
// `code` é o código de negócio do envelope de erro do backend (`body.code`,
// ex.: `core_status_locked`), quando enviado — permite tratar o erro sem
// inferir pelo texto da mensagem.
export class ApiError extends Error {
	status: number;
	code?: string;

	constructor(status: number, message: string, code?: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
	}
}

// Retorno padrão dos services — exceções nunca estouram para a UI.
export type Result<T> =
	{ ok: true; data: T } | { ok: false; error: { status?: number; code?: string; message: string } };
