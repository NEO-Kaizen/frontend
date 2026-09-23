import type { QueueFilterQuery } from '$lib/types/queue';
import type { QueueCsvDownload } from '$lib/types/report';

export function exportQueueCsvMock(filters: QueueFilterQuery): Promise<QueueCsvDownload> {
	void filters;
	const csv = [
		'Protocolo;Data de Abertura;Área;Processo;Categoria;Status;Prioridade;Responsável;Data de Mapeamento;Data da Última Atualização;Resultado da Triagem;Data de Conclusão',
		'MAAT-DEMO-0001;22/09/2026 09:00;Operações;Processo demonstrativo;Automação;Em triagem;Alta;Analista Exemplo;;22/09/2026 10:30;Elegível para avaliação;'
	].join('\r\n');

	return Promise.resolve({
		blob: new Blob([`\uFEFF${csv}\r\n`], { type: 'text/csv;charset=utf-8' }),
		filename: 'solicitacoes-demo.csv'
	});
}
