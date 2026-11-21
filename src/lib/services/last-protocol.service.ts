import { browser } from '$app/environment';

// Último protocolo enviado com sucesso pelo solicitante (issue #147). Vive
// apenas na sessão (sessionStorage) para sobreviver ao reload da tela de
// sucesso. Único ponto de leitura/escrita do valor — nenhum componente deve
// acessar `sessionStorage` diretamente.
const STORAGE_KEY = 'maat:last-protocol';

export function saveProtocol(protocol: string): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(STORAGE_KEY, protocol);
	} catch {
		// sessionStorage indisponível — degrada para sem persistência.
	}
}

export function loadProtocol(): string {
	if (!browser) return '';
	try {
		return sessionStorage.getItem(STORAGE_KEY) ?? '';
	} catch {
		return '';
	}
}

export function clearProtocol(): void {
	if (!browser) return;
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// sessionStorage indisponível — nada a limpar.
	}
}
