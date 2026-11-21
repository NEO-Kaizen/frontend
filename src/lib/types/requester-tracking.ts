// Tipos da consulta do solicitante (`/acompanhar/[protocolo]`).
// Espelham `RequesterTracking.dto.ts` do backend — fonte da verdade do
// contrato. Reutilizam `RequestStatus`/`RequestPriority` de `request.ts`
// em vez de redefinir uniões.

import type { ComplementaryBlock, RequestPriority, RequestStatus } from './request';

export type SolicitationMode = 'PUBLIC' | 'AUTHENTICATED';

export type TrackingAccessState =
	'idle' | 'checking' | 'validation-required' | 'validating' | 'authorized' | 'invalid' | 'error';

export type DetailsState = 'loading' | 'loaded' | 'empty' | 'error';

export interface PublicVerifyPayload {
	name: string;
	email: string;
	protocol: string;
}

// Resposta de POST /requests/:protocol/public/verify (contrato Pendências por
// campo v0.5 §2.1): SOMENTE `{ protocol, canAccess: true }` — sem JWT, sem
// cookie, sem `expiresInMinutes`, sem `requester_access`.
export interface PublicVerifyResult {
	protocol: string;
	canAccess: true;
}

// Identidade pública do solicitante: guardada em `sessionStorage` após
// `canAccess: true`, válida só durante a permanência em
// `/acompanhar/[protocolo]`. Ver `requester-identity.service.ts` (único ponto
// de leitura/escrita — nunca acessar `sessionStorage` diretamente).
export interface RequesterIdentity {
	protocol: string;
	name: string;
	email: string;
	verifiedAt: string;
}

export interface RequesterIdentification {
	fullName: string;
	area: string;
	department?: string;
	corporateEmail: string;
	manager: string;
	additionalContact?: string;
}

export interface RequesterAttachment {
	id: string;
	fileName: string;
	mimeType: string;
	sizeBytes: number;
	downloadUrl: string;
	canDownload: boolean;
}

export interface PublicDemand {
	title: string;
	processName: string;
	requestType: string;
	category: string;
	description: string;
	problem: string;
	justification: string;
	expectedResult: string;
}

export interface PublicOperationalImpacts {
	mainRisks: string;
	clientImpact: string;
	operationalImpact: string;
	perceivedCriticality: RequestPriority;
	desiredDeadline: string;
}

export interface PublicRequestDetails {
	protocol: string;
	status: RequestStatus;
	openedAt: string;
	lastUpdate: string;
	meeting: { scheduledFor: string; link: string | null } | null;
	// Retorno público da equipe (visível ao solicitante); `null` = sem retorno.
	lastTechnicalMessage: string | null;
	requester: RequesterIdentification;
	demand: PublicDemand;
	impacts: PublicOperationalImpacts;
}

export interface RequesterOperational extends PublicOperationalImpacts {
	processDescription: string;
	processSteps: string;
	systemsUsed: string;
	executionFrequency: string;
	volumetry: string;
	peopleInvolved: number;
	averageExecutionTime: string;
	monthlyEffortHours: number;
	hasManualControls: false | string;
}

export interface RequesterRequestDetails extends Omit<PublicRequestDetails, 'impacts'> {
	operational: RequesterOperational;
	complementary?: ComplementaryBlock;
	schedulePreferences: string[] | null;
	mappingDate: string | null;
	attachments: RequesterAttachment[];
}

export type TrackingDetailsResponse =
	| { mode: 'public'; details: PublicRequestDetails }
	| { mode: 'authenticated'; details: RequesterRequestDetails };
