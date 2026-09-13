import { ApiError } from '$lib/types/result';
import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
import { isValidPlatformName, isValidProtocolMask } from '$lib/utils/validations';
import type {
	PortalConfig,
	SolicitationMode,
	UpdatePortalConfigPayload
} from '$lib/types/portal-config';

// Estado do mock em memória — inicia com os defaults locais e recebe os PATCHes
// durante a sessão de desenvolvimento. Espelha o contrato de CONTRATO-BACKEND.md.
let mockConfig: PortalConfig = structuredClone(DEFAULT_PORTAL_CONFIG);

const SOLICITATION_MODES: readonly SolicitationMode[] = ['PUBLIC', 'AUTHENTICATED'];

// Allowlist espelhada do contrato: o mock rejeita exatamente o que a API real
// rejeitaria (campo desconhecido ou valor fora dos aceitos).
const ALLOWED_UPDATE_FIELDS: readonly (keyof UpdatePortalConfigPayload)[] = [
	'solicitationMode',
	'platformName',
	'protocolMask'
];

const MOCK_LATENCY_MS = 500;

export function fetchPortalConfigMock(): Promise<PortalConfig> {
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(mockConfig));
}

export function updatePortalConfigMock(payload: UpdatePortalConfigPayload): Promise<PortalConfig> {
	validateUpdatePayload(payload);
	mockConfig = { ...mockConfig, ...payload };
	return delay(MOCK_LATENCY_MS).then(() => structuredClone(mockConfig));
}

function validateUpdatePayload(payload: UpdatePortalConfigPayload): void {
	for (const field of Object.keys(payload) as (keyof UpdatePortalConfigPayload)[]) {
		if (!ALLOWED_UPDATE_FIELDS.includes(field)) {
			throw new ApiError(400, `Campo não permitido: "${field}".`);
		}
	}

	if (
		payload.solicitationMode !== undefined &&
		!SOLICITATION_MODES.includes(payload.solicitationMode)
	) {
		throw new ApiError(400, 'Modo de solicitação inválido.');
	}

	if (payload.platformName !== undefined && !isValidPlatformName(payload.platformName)) {
		throw new ApiError(
			400,
			'Nome da plataforma deve ter entre 1 e 80 caracteres (após remover espaços).'
		);
	}

	if (payload.protocolMask !== undefined && !isValidProtocolMask(payload.protocolMask)) {
		throw new ApiError(
			400,
			'Máscara de protocolo deve ter entre 1 e 40 caracteres: letras, números ou hífen.'
		);
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
