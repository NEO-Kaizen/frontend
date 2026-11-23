import type { StatusInterval } from '$lib/types/status-time';

// Formatação de durações do RF13 — apenas exibição. Os valores vêm do backend
// em milissegundos (tempo cronológico); nenhuma regra de SLA ou de dia útil
// é aplicada aqui.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// "2 d 3 h 15 min", "45 min", "menos de 1 min" ou "0 min". Valor inválido
// (negativo, não finito) exibe `---`, como os demais campos sem valor.
export function formatDuration(milliseconds: number): string {
	if (!Number.isFinite(milliseconds) || milliseconds < 0) return '---';
	if (milliseconds === 0) return '0 min';
	if (milliseconds < MINUTE_MS) return 'menos de 1 min';

	const days = Math.floor(milliseconds / DAY_MS);
	const hours = Math.floor((milliseconds % DAY_MS) / HOUR_MS);
	const minutes = Math.floor((milliseconds % HOUR_MS) / MINUTE_MS);

	const parts: string[] = [];
	if (days > 0) parts.push(`${days} d`);
	if (hours > 0) parts.push(`${hours} h`);
	if (minutes > 0) parts.push(`${minutes} min`);

	return parts.join(' ');
}

// Duração cronológica do intervalo. O Status atual (`exitedAt === null`) é
// medido até `calculatedAt` do snapshot — nunca até "agora". Datas inválidas
// ou fora de ordem resultam em 0.
export function intervalDurationMilliseconds(
	interval: Pick<StatusInterval, 'enteredAt' | 'exitedAt'>,
	calculatedAt: string
): number {
	const start = Date.parse(interval.enteredAt);
	const end = Date.parse(interval.exitedAt ?? calculatedAt);

	if (Number.isNaN(start) || Number.isNaN(end)) return 0;

	return Math.max(0, end - start);
}
