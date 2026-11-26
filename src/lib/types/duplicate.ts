import type { DemandBlock } from './request';

// Faixa de confiança do Alerta de duplicidade (RF16) — espelha
// `DuplicateConfidence` do backend.
export type DuplicateConfidence = 'high' | 'medium' | 'none';

// Item público do Alerta de duplicidade: allowlist exata de seis chaves.
// Nunca inclui Protocolo, score, total, contagem, Notas internas, Triagem,
// Prioridade, Responsável, Anexos ou PII de terceiros.
export interface DuplicateAlertItem {
	publicId: string;
	title: string;
	summary: string;
	category: string;
	status: string;
	// Formato do contrato: `YYYY-Qn` (pattern `^\d{4}-Q[1-4]$`).
	period: string;
}

// Corpo de POST /requests/duplicates/check — reutiliza o bloco de Demanda.
export interface DuplicateCheckRequest {
	demand: DemandBlock;
}

// Resposta do alerta (POST) e da seção do Acompanhamento (GET): mesmo DTO.
export interface DuplicateCheckResponse {
	confidence: DuplicateConfidence;
	items: DuplicateAlertItem[];
}
