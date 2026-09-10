import { getAdminRequestByProtocolMock } from '$lib/mocks/requests.mock';
import type { PageLoad } from './$types';

// TODO (fora de escopo): trocar por `import { getAdminRequestByProtocol } from '$lib/services/request.service'`
// Futuro service: getAdminRequestByProtocol(protocol: string): Promise<Result<AdminRequestDetail>>

export const load: PageLoad = async ({ params }) => {
	const protocol = params.protocolo;

	try {
		const data = await getAdminRequestByProtocolMock(protocol);
		return {
			protocol,
			solicitation: data,
			error: null
		};
	} catch (e) {
		const error = e as { status?: number; message: string };
		return {
			protocol,
			solicitation: null,
			error
		};
	}
};
