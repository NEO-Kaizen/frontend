import { browser } from '$app/environment';
import type { RequesterIdentity } from '$lib/types/requester-tracking';

// Identidade pública do solicitante (contrato Pendências por campo v0.5,
// §2.1): após `POST /requests/:protocol/public/verify` com `canAccess: true`,
// o frontend guarda `{ protocol, name, email, verifiedAt }` em
// `sessionStorage` — SEM JWT, SEM cookie, SEM `expiresInMinutes`. Ela vive
// somente durante a permanência em `/acompanhar/[protocolo]` e é descartada
// ao sair/trocar de protocolo. Único ponto de leitura/escrita da identidade:
// nenhum componente deve acessar `sessionStorage` diretamente.
const STORAGE_KEY = 'maat:requester-identity';

function readStored(): RequesterIdentity | null {
	if (!browser) return null;
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<RequesterIdentity>;
		if (
			typeof parsed.protocol !== 'string' ||
			typeof parsed.name !== 'string' ||
			typeof parsed.email !== 'string' ||
			typeof parsed.verifiedAt !== 'string'
		) {
			return null;
		}
		return {
			protocol: parsed.protocol,
			name: parsed.name,
			email: parsed.email,
			verifiedAt: parsed.verifiedAt
		};
	} catch {
		return null;
	}
}

// Persiste a identidade após `canAccess: true`. Normaliza protocolo/nome/e-mail
// para a comparação com a URL e o header serem estáveis.
export function saveRequesterIdentity(input: {
	protocol: string;
	name: string;
	email: string;
}): RequesterIdentity {
	const identity: RequesterIdentity = {
		protocol: input.protocol.trim(),
		name: input.name.trim(),
		email: input.email.trim(),
		verifiedAt: new Date().toISOString()
	};
	if (browser) {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
	}
	return identity;
}

// Recupera a identidade SOMENTE quando ela pertence ao protocolo da URL —
// impede reutilizar a validação de um protocolo em outro (anti-IDOR).
export function loadRequesterIdentity(protocol: string): RequesterIdentity | null {
	const stored = readStored();
	if (!stored) return null;
	if (stored.protocol.trim().toLowerCase() !== protocol.trim().toLowerCase()) return null;
	return stored;
}

export function clearRequesterIdentity(): void {
	if (browser) {
		sessionStorage.removeItem(STORAGE_KEY);
	}
}
