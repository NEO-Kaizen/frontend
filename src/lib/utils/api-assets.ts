import { env } from '$env/dynamic/public';

/** Resolve URLs relativas de arquivos servidos pelo backend. */
export function resolveApiAssetUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url;

	const apiUrl = env.PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
	if (!apiUrl) return url;

	return url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`;
}
