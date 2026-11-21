import { redirect } from '@sveltejs/kit';

const DEFAULT_PAGE = 1;

// Normaliza o parâmetro de página da URL: inteiro positivo ou a página inicial.
export function parsePageParam(raw: string | null): number {
	const page = Number(raw ?? DEFAULT_PAGE);

	return Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
}

// Redireciona (303) para a última página válida quando a URL pede uma página
// fora do intervalo (ex.: ?page=99), preservando os demais parâmetros.
export function redirectToValidPage(url: URL, page: number, totalPages: number): void {
	const lastPage = Math.max(totalPages, 1);

	if (page <= lastPage) {
		return;
	}

	const params = new URLSearchParams(url.searchParams);

	if (lastPage > 1) {
		params.set('page', String(lastPage));
	} else {
		params.delete('page');
	}

	const query = params.toString();

	throw redirect(303, query ? `${url.pathname}?${query}` : url.pathname);
}
