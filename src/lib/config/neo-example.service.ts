import avatarAsset from '$lib/assets/avatar-default.svg';
import faviconAsset from '$lib/assets/favicon.svg';
import loginImageDarkAsset from '$lib/assets/loginDark.png';
import logoNeoAsset from '$lib/assets/NEO.svg?no-inline';
import { DEFAULT_THEME } from '$lib/config/portal-defaults';
import { saveAssets, saveIdentity, saveTheme } from '$lib/config/portal-config.service';
import type { PortalAssets, PortalTheme } from '$lib/types/portal-config';

// Preset de exemplo da marca NEO usado pelo botão "Exemplo" das Configurações.
// Módulo dev-only: importado dinamicamente pela página e nunca no bundle principal.
// Os tons de status são os mesmos do DEFAULT_THEME atual.
export const NEO_THEME: PortalTheme = {
	light: {
		background: '#f5f5f5',
		surface: '#ffffff',
		border: '#e0e0e0',
		textPrimary: '#1a1a1a',
		textSecondary: '#58595b',
		heading: '#1a1a1a',
		richBlack: '#000000',
		primary: '#eb0a1e',
		secondary: '#c4091a',
		tint: '#fbe3e5',
		onPrimary: '#ffffff',
		onDark: '#ffffff',
		onGradient: '#ffffff',
		gradient: { from: '#eb0a1e', to: '#a3000f', angle: 143 },
		statuses: DEFAULT_THEME.light.statuses
	},
	dark: {
		background: '#0a0a0a',
		surface: '#171717',
		border: '#2e2e2e',
		textPrimary: '#f5f5f5',
		textSecondary: '#a3a3a3',
		heading: '#f5f5f5',
		richBlack: '#000000',
		primary: '#eb0a1e',
		secondary: '#ff6b7a',
		tint: '#2a1013',
		onPrimary: '#ffffff',
		onDark: '#ffffff',
		onGradient: '#ffffff',
		gradient: { from: '#8c0012', to: '#eb0a1e', angle: 143 },
		statuses: DEFAULT_THEME.dark.statuses
	}
};

// Assets de exemplo: logo NEO colorido pela primária, imagem de login escura
// em ambos os temas e os demais assets padrão. Favicon inalterado.
export const NEO_EXAMPLE_ASSETS: PortalAssets = {
	logoLightUrl: logoNeoAsset,
	logoDarkUrl: logoNeoAsset,
	logoUsePrimaryColor: true,
	avatarLightUrl: avatarAsset,
	avatarDarkUrl: avatarAsset,
	loginImageLightUrl: loginImageDarkAsset,
	loginImageDarkUrl: loginImageDarkAsset,
	faviconLightUrl: faviconAsset,
	faviconDarkUrl: faviconAsset
};

export async function applyNeoExample(): Promise<{ ok: boolean; message: string }> {
	const identity = await saveIdentity({ platformName: 'NEO' });
	if (!identity.ok) {
		return { ok: false, message: identity.error.message };
	}

	const theme = await saveTheme({ theme: structuredClone(NEO_THEME) });
	if (!theme.ok) {
		return { ok: false, message: theme.error.message };
	}

	const assets = await saveAssets(NEO_EXAMPLE_ASSETS, {});
	if (!assets.ok) {
		return { ok: false, message: assets.error.message };
	}

	return { ok: true, message: 'Exemplo aplicado e salvo.' };
}
