// Contrato RF13 — tempo por Status (rf13-status-time-audit.md §1):
// GET /audit-logs/{protocol}/status-times. O backend devolve um snapshot
// fechado em `calculatedAt`: a UI não faz o intervalo atual "correr" nem
// soma intervalos por conta própria. Durações em milissegundos inteiros;
// datas em ISO 8601 UTC. Nenhum campo aqui representa SLA (RF10).

// Período contínuo em um Status. `exitedAt === null` indica o Status atual,
// cuja duração é medida até `calculatedAt` da resposta.
export interface StatusInterval {
	status: string;
	enteredAt: string;
	exitedAt: string | null;
	activeMilliseconds: number;
	pausedMilliseconds: number;
	// Status configurado como período de pausa (aguardando informação).
	isPaused: boolean;
}

// Soma consolidada por nome de Status — usar esta lista na visão agregada em
// vez de somar `intervals` (o mesmo Status pode aparecer mais de uma vez).
export interface StatusTotal {
	status: string;
	activeMilliseconds: number;
	pausedMilliseconds: number;
	isPaused: boolean;
}

export interface StatusTimesResponse {
	protocol: string;
	calculatedAt: string;
	intervals: StatusInterval[];
	totalsByStatus: StatusTotal[];
	totalActiveMilliseconds: number;
	totalPausedMilliseconds: number;
}
