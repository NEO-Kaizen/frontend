import { hydrateRequestMock, mockInternalRequestDetails } from './requests.mock';
import { getMockSolicitationMode, getMockStatuses } from './portal-config.mock';
import { displayStatusName } from '$lib/utils/status';
import type {
	PublicRequestDetails,
	PublicVerifyPayload,
	PublicVerifyResult,
	RequesterRequestDetails,
	TrackingDetailsResponse
} from '$lib/types/requester-tracking';
import type {
	ListPendingItemsResponse,
	PendingItem,
	RespondPendingItemBody
} from '$lib/types/pendency';
import type { InternalAttachment, InternalRequestDetail, RequestStatus } from '$lib/types/request';
import type { PortalStatus } from '$lib/types/portal-config';
import type { MockAttachmentMeta } from './pendency.mock';
import { ApiError } from '$lib/types/result';

// Mocks da consulta do solicitante (`/acompanhar/[protocolo]`), sob o mesmo
// toggle `MOCK_DOMAINS.request` dos demais mocks de solicitação. Espelham o
// contrato Pendências por campo v0.5 e o comportamento do backend real:
// - `POST /requests/:protocol/public/verify` exige nome + e-mail + protocolo,
//   responde 400 (formato), 429 (rate-limit), 403 (modo AUTHENTICATED) ou 401
//   genérico (anti-enumeração) e responde `{ protocol, canAccess: true }` —
//   SEM JWT, SEM cookie, SEM `expiresInMinutes`, SEM `requester_access`. A
//   identidade pública vive em `sessionStorage` no frontend;
// - leituras públicas exigem a validação prévia (401 sem ela — nunca vazam
//   dados); o fluxo autenticado (sessão) lê direto, sem `verify`;
// - NÃO existe chat/mensagens neste domínio: a única via de resposta do
//   solicitante é o PATCH por item (`pendingItems`);
// - modo `public` NÃO retorna anexos; modo `authenticated` mantém;
// - pendências seguem o modelo v0.5 (`PendingItem`, `requested/responded/
//   validated`, um `PendencyCard` por `batchId`): a escrita é por item via
//   PATCH e o anexo via POST dedicado — o estado vive em `pendency.mock`
//   (único store), aqui só há a porta pública com gating;
// - item de outro protocolo → 404 genérico; já respondido/validado → 409.
//
// Cenários fictícios (nome + e-mail da validação pública):
// - `MAAT-8K3P-9X2M` — Maria Oliveira / maria.oliveira@maat.com.br:
//   pendências v0.5 no store de `pendency.mock`.
// - `MAAT-9R3D-7KWF` — João Santos / joao.santos@maat.com.br:
//   sem pendências.
// - `MAAT-3V8K-6JPN` — Pedro Rocha / pedro.rocha@maat.com.br:
//   1 anexo (só autenticado); sem pendências.
// Qualquer outro protocolo → 401 genérico no verify (indistinguível de
// dados incorretos, como no backend).

const MOCK_LATENCY_MS = 400;

/** TTL da autorização pública — interno ao mock. NÃO faz parte do contrato. */
const PUBLIC_ACCESS_TTL_MS = 30 * 60 * 1000;

/** Rate-limit do verify — espelha `requesterRateLimit` (10 tentativas/10min). */
const VERIFY_RATE_LIMIT_MAX = 10;
const VERIFY_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

/** Validações públicas ativas (o backend não usa cookie: a checagem real é o
 *  header `X-Requester-Identity`; aqui o gating é em memória). */
const authorizedProtocols = new Map<string, { expiresAt: number }>();

/** Contagem de tentativas de verify por protocolo (janela deslizante). */
const verifyAttempts = new Map<string, { count: number; resetAt: number }>();

function normalizeProtocol(protocol: string): string {
	return protocol.trim().toUpperCase();
}

function normalizeName(value: string): string {
	return value.trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function delay<T>(value: T): Promise<T> {
	return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function findFixture(protocol: string): InternalRequestDetail | undefined {
	const normalized = normalizeProtocol(protocol);
	return mockInternalRequestDetails.find((item) => normalizeProtocol(item.protocol) === normalized);
}

function findHydratedFixture(
	protocol: string,
	statuses: PortalStatus[]
): InternalRequestDetail | undefined {
	return hydrateRequestMock(protocol, statuses) ?? undefined;
}

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Validação de formato — espelha `publicVerifySchema` (zod) do backend. */
function validateVerifyShape(payload: PublicVerifyPayload): string | null {
	if (!payload.name || payload.name.trim().length < 3) return 'Informe seu nome completo.';
	if (payload.name.trim().length > 150) return 'Máximo de 150 caracteres.';
	if (!isValidEmail(payload.email)) return 'Informe um e-mail válido.';
	if (payload.email.trim().length > 254) return 'Máximo de 254 caracteres.';
	if (!payload.protocol || payload.protocol.trim().length < 1) return 'Informe o protocolo.';
	if (payload.protocol.trim().length > 25) return 'Protocolo inválido.';
	return null;
}

/** Rate-limit — espelha `publicVerifyRateLimit` (conta todas as tentativas). */
function checkVerifyRateLimit(normalizedProtocol: string): void {
	const now = Date.now();
	const bucket = verifyAttempts.get(normalizedProtocol);
	if (!bucket || bucket.resetAt <= now) {
		verifyAttempts.set(normalizedProtocol, {
			count: 1,
			resetAt: now + VERIFY_RATE_LIMIT_WINDOW_MS
		});
		return;
	}
	bucket.count += 1;
	if (bucket.count > VERIFY_RATE_LIMIT_MAX) {
		throw new ApiError(
			429,
			'Muitas tentativas de validação. Aguarde alguns minutos antes de tentar novamente.'
		);
	}
}

/**
 * Exige a validação pública do protocolo. Sem ela (ou expirada), 401 sem
 * expor nenhum dado da solicitação.
 */
function requirePublicAccess(protocol: string): void {
	const normalized = normalizeProtocol(protocol);
	const authorization = authorizedProtocols.get(normalized);
	if (!authorization) {
		throw new ApiError(401, 'Valide seus dados para acompanhar esta solicitação.');
	}
	if (authorization.expiresAt <= Date.now()) {
		authorizedProtocols.delete(normalized);
		throw new ApiError(401, 'Autorização expirada. Valide seus dados novamente.');
	}
}

function toPublicDetailsFromFixture(
	fixture: InternalRequestDetail,
	statuses: PortalStatus[]
): PublicRequestDetails {
	return {
		protocol: fixture.protocol,
		status: displayStatusName(fixture.status, statuses) as RequestStatus,
		openedAt: fixture.openedAt,
		lastUpdate: fixture.lastExternalUpdateAt ?? fixture.lastUpdate,
		meeting: fixture.meeting,
		lastTechnicalMessage: fixture.lastTechnicalMessage ?? null,
		requester: {
			fullName: fixture.requester.fullName,
			area: fixture.requester.area,
			department: fixture.requester.department,
			corporateEmail: fixture.requester.corporateEmail,
			manager: fixture.requester.manager,
			additionalContact: fixture.requester.additionalContact
		},
		demand: {
			title: fixture.demand.title,
			processName: fixture.demand.processName,
			requestType: fixture.demand.requestType,
			category: fixture.demand.category,
			description: fixture.demand.description,
			problem: fixture.demand.problem,
			justification: fixture.demand.justification,
			expectedResult: fixture.demand.expectedResult
		},
		impacts: {
			mainRisks: fixture.operational.mainRisks,
			clientImpact: fixture.operational.clientImpact,
			operationalImpact: fixture.operational.operationalImpact,
			perceivedCriticality: fixture.operational.perceivedCriticality,
			desiredDeadline: fixture.operational.desiredDeadline
		}
	};
}

function toPublicDetails(protocol: string, statuses: PortalStatus[]): PublicRequestDetails {
	const fixture = findHydratedFixture(protocol, statuses);
	if (!fixture) throw new ApiError(404, 'Solicitação não encontrada');

	return toPublicDetailsFromFixture(fixture, statuses);
}

function toAuthenticatedDetails(
	protocol: string,
	statuses: PortalStatus[]
): RequesterRequestDetails {
	const fixture = findHydratedFixture(protocol, statuses);
	if (!fixture) throw new ApiError(404, 'Solicitação não encontrada');
	const publicDetails = toPublicDetailsFromFixture(fixture, statuses);

	return {
		...publicDetails,
		operational: {
			mainRisks: fixture.operational.mainRisks,
			clientImpact: fixture.operational.clientImpact,
			operationalImpact: fixture.operational.operationalImpact,
			perceivedCriticality: fixture.operational.perceivedCriticality,
			desiredDeadline: fixture.operational.desiredDeadline,
			processDescription: fixture.operational.processDescription,
			processSteps: fixture.operational.processSteps,
			systemsUsed: fixture.operational.systemsUsed,
			executionFrequency: fixture.operational.executionFrequency,
			volumetry: fixture.operational.volumetry,
			peopleInvolved: fixture.operational.peopleInvolved,
			averageExecutionTime: fixture.operational.averageExecutionTime,
			monthlyEffortHours: fixture.operational.monthlyEffortHours,
			hasManualControls: fixture.operational.hasManualControls
		},
		complementary: fixture.complementary,
		schedulePreferences: fixture.schedulePreferences,
		mappingDate: fixture.mappingDate,
		attachments: fixture.attachments.map((attachment, index) => ({
			id: `mock-attachment-${index + 1}`,
			fileName: attachment.fileName,
			mimeType: attachment.mimeType,
			sizeBytes: attachment.sizeBytes,
			downloadUrl: attachment.downloadUrl ?? '#',
			canDownload: attachment.canDownload
		}))
	};
}

export function verifyPublicAccessMock(payload: PublicVerifyPayload): Promise<PublicVerifyResult> {
	const normalized = normalizeProtocol(payload.protocol);

	try {
		// Mesma ordem do backend: rate-limit → formato → modo → identidade.
		checkVerifyRateLimit(normalized);

		const shapeError = validateVerifyShape(payload);
		if (shapeError) throw new ApiError(400, shapeError);

		if (getMockSolicitationMode() !== 'PUBLIC') {
			throw new ApiError(403, 'A consulta pública não está habilitada neste portal.');
		}

		const fixture = findFixture(payload.protocol);
		const nameOk =
			fixture && normalizeName(payload.name) === normalizeName(fixture.requester.fullName);
		const emailOk =
			fixture &&
			payload.email.trim().toLowerCase() === fixture.requester.corporateEmail.toLowerCase();

		// Erro genérico como no backend — sem revelar se o protocolo existe.
		if (!fixture || !nameOk || !emailOk) {
			throw new ApiError(401, 'Dados de validação inválidos. Confira nome, e-mail e protocolo.');
		}

		authorizedProtocols.set(normalized, { expiresAt: Date.now() + PUBLIC_ACCESS_TTL_MS });
		// Sem JWT/cookie/`expiresInMinutes`: só `{ protocol, canAccess: true }`.
		return delay({ protocol: fixture.protocol, canAccess: true as const });
	} catch (error) {
		return Promise.reject(error);
	}
}

export function getPublicTrackingMock(protocol: string): Promise<TrackingDetailsResponse> {
	try {
		requirePublicAccess(protocol);
		const statuses = getMockStatuses();
		return delay({ mode: 'public', details: toPublicDetails(protocol, statuses) });
	} catch (error) {
		return Promise.reject(error);
	}
}

export function getSessionTrackingMock(protocol: string): Promise<TrackingDetailsResponse> {
	try {
		const statuses = getMockStatuses();
		return delay({ mode: 'authenticated', details: toAuthenticatedDetails(protocol, statuses) });
	} catch (error) {
		return Promise.reject(error);
	}
}

// ---- Pendências v0.5: porta pública (com gating) sobre o store único ----
// O estado das pendências vive em `pendency.mock.ts` (o mesmo store do fluxo
// do analista); aqui só se exige a validação pública antes de delegar. O
// fluxo autenticado usa `pendency.mock` direto (sem gating).

export async function listPendingItemsPublicMock(
	protocol: string
): Promise<ListPendingItemsResponse> {
	requirePublicAccess(protocol);
	if (!findFixture(protocol)) throw new ApiError(404, 'Solicitação não encontrada');
	const { listPendingItemsMock } = await import('./pendency.mock');
	return listPendingItemsMock(protocol);
}

export async function respondPendingItemPublicMock(
	protocol: string,
	pendingItemId: string,
	body: RespondPendingItemBody
): Promise<PendingItem> {
	requirePublicAccess(protocol);
	const { respondPendingItemMock } = await import('./pendency.mock');
	return respondPendingItemMock(protocol, pendingItemId, body);
}

export async function uploadPendingItemAttachmentPublicMock(
	protocol: string,
	pendingItemId: string,
	file: MockAttachmentMeta
): Promise<InternalAttachment> {
	requirePublicAccess(protocol);
	const { uploadPendingItemAttachmentMock } = await import('./pendency.mock');
	return uploadPendingItemAttachmentMock(protocol, pendingItemId, file);
}

/**
 * Expira a validação pública de um protocolo — simula o TTL de 30 min
 * (a próxima leitura retorna 401 e a tela volta para a validação).
 * Uso exclusivo em testes DEV.
 */
export function __expirePublicAccess(protocol: string): void {
	const normalized = normalizeProtocol(protocol);
	const authorization = authorizedProtocols.get(normalized);
	if (authorization) authorization.expiresAt = Date.now() - 1;
}

/**
 * Restaura o estado inicial dos mocks (validações e rate-limit do verify).
 * Uso exclusivo em testes DEV.
 */
export function __resetTrackingMocks(): void {
	authorizedProtocols.clear();
	verifyAttempts.clear();
}
