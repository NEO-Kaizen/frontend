// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SessionUser } from '$lib/types/auth';
import type { PortalConfig } from '$lib/types/portal-config';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: SessionUser | null;
			portalConfig: PortalConfig;
		}
		interface PageData {
			user?: SessionUser | null;
			portalConfig: PortalConfig;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
