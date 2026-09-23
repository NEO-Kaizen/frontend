import { redirect } from '@sveltejs/kit';
import { listRequests } from '$lib/services/request.service';
import { parsePageParam, redirectToValidPage } from '$lib/utils/pagination';

import type { PageServerLoad } from './$types';

const PAGE_SIZE = 5;

// Server load (não universal): rerun automático ao mudar ?email/?page e o fetch
// sai do servidor sem o modelo CORS do browser aplicado a loads universais.
// Quando o solicitante está logado, lista automaticamente as próprias
// solicitações (sem exigir ?email); anônimo mantém busca por email.
// Solicitante nunca pode pesquisar e-mail de terceiros — query ?email é ignorada/limpa.
export const load: PageServerLoad = async ({ url, fetch, locals }) => {
	const page = parsePageParam(url.searchParams.get('page'));
	const user = locals.user;
	const isSolicitante = user?.role === 'Solicitante';

	// Autenticado como solicitante: usa e-mail da sessão
	if (isSolicitante && user.email) {
		const email = user.email.trim();
		const rawEmail = url.searchParams.get('email')?.trim();

		// Limpa tentativa de busca por outro e-mail (previne IDOR via query)
		if (rawEmail && rawEmail.toLowerCase() !== email.toLowerCase()) {
			const clean = new URL(url);
			clean.searchParams.delete('email');
			clean.searchParams.delete('page');
			if (page > 1) clean.searchParams.set('page', String(page));
			throw redirect(303, clean.pathname + (clean.search ? `?${clean.search}` : ''));
		}
		// Remove ?email mesmo quando igual ao próprio (URL canônica sem email para owner)
		if (rawEmail) {
			const clean = new URL(url);
			clean.searchParams.delete('email');
			throw redirect(303, clean.pathname + (clean.search ? `?${clean.search}` : ''));
		}

		const result = await listRequests({ email, page, pageSize: PAGE_SIZE }, fetch);

		if (result.ok) {
			redirectToValidPage(url, page, result.data.totalPages);
		}

		return { email, page, result, isOwnerView: true as const };
	}

	// Fluxo público/anônimo (ou perfil interno em /acompanhar): exige ?email
	const email = url.searchParams.get('email')?.trim() ?? '';

	if (!email) {
		return { email, page: 1, result: null, isOwnerView: false as const };
	}

	const result = await listRequests({ email, page, pageSize: PAGE_SIZE }, fetch);

	if (result.ok) {
		redirectToValidPage(url, page, result.data.totalPages);
	}

	return { email, page, result, isOwnerView: false as const };
};
