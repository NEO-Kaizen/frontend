import type { PortalConfig } from '../../../types/portal-config';

// Configuração fictícia do portal servida por HTTP em dev. Os assets ficam
// vazios de propósito: o service valida por campo e cai nos defaults locais
// (assets empacotados), exercitando exatamente o fallback do contrato.
export const mockPortalConfig: PortalConfig = {
	platformName: 'MAAT',
	solicitationMode: 'PUBLIC',
	protocolMask: 'MAAT',
	theme: {
		primaryColor: '#00236f',
		secondaryColor: '#0058be',
		backgroundColor: '#f0f4f8'
	},
	assets: {
		logoUrl: '',
		avatarUrl: '',
		faviconUrl: '',
		loginImageUrl: ''
	}
};
