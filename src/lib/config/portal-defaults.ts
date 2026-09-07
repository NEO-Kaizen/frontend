import type { PortalConfig } from '$lib/types/portal-config';
import logoUrl from '$lib/assets/MAAT-logo.svg';
import avatarUrl from '$lib/assets/avatar-default.svg';
import faviconUrl from '$lib/assets/favicon.svg';
import loginImageUrl from '$lib/assets/login.png';

// Defaults locais do portal — espelham os valores atuais do design system
// (global.css `:root`) e os assets estáticos existentes. Único dono dos
// defaults; consumido pelo service (fallback) e pelo estado de cliente.
export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
	platformName: 'MAAT',
	solicitationMode: 'PUBLIC',
	protocolMask: 'MAAT',
	theme: {
		primaryColor: '#00236f',
		secondaryColor: '#0058be',
		backgroundColor: '#f0f4f8'
	},
	assets: {
		logoUrl,
		avatarUrl,
		faviconUrl,
		loginImageUrl
	}
};
