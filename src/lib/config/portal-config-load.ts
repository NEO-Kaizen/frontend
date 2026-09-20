import type { PortalConfigLoadError } from '$lib/types/portal-config';

// A flag `portalConfigLoadError` existe apenas nos dados da rota de
// configurações (retornada pelo `+page.server.ts` autoritativo) — não faz parte
// de `App.PageData`. Por isso estes helpers recebem `unknown` e fazem o narrow
// internamente: os cards que leem `page.data` (tipo global) não precisam de cast
// no call site nem de mudança em `app.d.ts`.
export function getPortalConfigLoadError(data: unknown): PortalConfigLoadError | null {
	if (typeof data !== 'object' || data === null) return null;
	const error = (data as { portalConfigLoadError?: PortalConfigLoadError | null })
		.portalConfigLoadError;
	return error ?? null;
}

// Enquanto a configuração não for carregada/revalidada com sucesso, edição e
// salvamento permanecem bloqueados para evitar sobrescrita acidental dos dados
// persistidos a partir dos defaults locais.
export function isPortalConfigLoadBlocked(data: unknown): boolean {
	return getPortalConfigLoadError(data) !== null;
}
