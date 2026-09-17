// Contexto entregue a cada handler de rota do mock: a requisição Web já
// convertida pelo plugin, a URL e os parâmetros capturados da rota.
export interface MockContext {
	request: Request;
	url: URL;
	params: string[];
}
