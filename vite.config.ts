import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

function getBasePath(value: string | undefined): '' | `/${string}` {
	const normalized = value?.trim();

	if (!normalized) {
		return '';
	}

	if (!normalized.startsWith('/') || normalized === '/' || normalized.endsWith('/')) {
		throw new Error('BASE_PATH deve começar com "/" e não terminar com "/". Exemplo: /server03');
	}

	return normalized as `/${string}`;
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const base = getBasePath(process.env.BASE_PATH ?? env.BASE_PATH);
	const apiOrigin = process.env.PUBLIC_API_URL || env.PUBLIC_API_URL || 'http://localhost:3000';
	const uploadsProxy = { target: apiOrigin, changeOrigin: true };

	return {
		plugins: [
			sveltekit({
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},

				// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
				// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
				// See https://svelte.dev/docs/kit/adapters for more information about adapters.
				adapter: adapter(),

				paths: {
					base,
					// O app é publicado em um subcaminho fixo. Mantém redirects, links e assets
					// root-relative dentro do base, inclusive nas navegações client-side.
					relative: false
				}
			})
		],
		server: {
			proxy: { '/uploads': uploadsProxy }
		},
		preview: {
			proxy: { '/uploads': uploadsProxy }
		}
	};
});
