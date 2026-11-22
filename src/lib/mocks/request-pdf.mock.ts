import type { FileDownload } from '$lib/types/report';

// Mock do PDF (RF08): documento mínimo e válido, para exercitar a UI antes da
// integração real. O texto muda por modo para deixar visível, na tela, qual
// variante o backend devolveria para aquela credencial.
export type RequestPdfMockMode = 'internal' | 'authenticated' | 'public';

interface RequestPdfMockInput {
	protocol: string;
	mode: RequestPdfMockMode;
}

// Texto em ASCII de propósito: a fonte Helvetica do PDF usa WinAnsi, então
// acentos em UTF-8 sairiam corrompidos no visualizador.
const MODE_LINES: Record<RequestPdfMockMode, string[]> = {
	internal: [
		'DOCUMENTO INTERNO - COMPLETO',
		'Inclui historico de logs, anexos e pendencias.',
		'Conteudo de exemplo gerado pelo mock do frontend.'
	],
	authenticated: [
		'SOLICITACAO - RECORTE DO SOLICITANTE',
		'Sem historico de logs internos.',
		'Conteudo de exemplo gerado pelo mock do frontend.'
	],
	public: [
		'SOLICITACAO - RECORTE PUBLICO',
		'Sem operacao e sem anexos.',
		'Conteudo de exemplo gerado pelo mock do frontend.'
	]
};

const FONT_SIZE = 11;
const FIRST_LINE_Y = 780;
const LINE_HEIGHT = 22;
const LEFT_MARGIN = 48;

function escapePdfText(value: string): string {
	return value.replace(/([\\()])/g, '\\$1');
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Monta um PDF de uma página com as linhas recebidas. Os offsets da tabela
// `xref` são contados em BYTES (TextEncoder), e não em caracteres — por isso o
// conteúdo pode ter qualquer caractere sem desalinhar o documento.
function buildPdf(lines: string[]): Blob {
	const encoder = new TextEncoder();
	const header = '%PDF-1.4\n';

	const content = lines
		.map(
			(line, index) =>
				`BT /F1 ${FONT_SIZE} Tf ${LEFT_MARGIN} ${FIRST_LINE_Y - index * LINE_HEIGHT} Td (${escapePdfText(line)}) Tj ET`
		)
		.join('\n');
	const stream = `${content}\n`;

	const objects = [
		'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
		'2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
		'3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
		'4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
		`5 0 obj\n<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream\nendobj\n`
	];

	const offsets: number[] = [];
	let body = header;

	for (const object of objects) {
		offsets.push(encoder.encode(body).length);
		body += object;
	}

	const xrefStart = encoder.encode(body).length;
	const xref = [
		'xref',
		`0 ${objects.length + 1}`,
		'0000000000 65535 f ',
		...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)
	].join('\n');

	const pdf = `${body}${xref}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

	return new Blob([pdf], { type: 'application/pdf' });
}

export async function requestPdfMock({
	protocol,
	mode
}: RequestPdfMockInput): Promise<FileDownload> {
	await delay(900);

	return {
		blob: buildPdf([
			`Protocolo: ${protocol}`,
			...MODE_LINES[mode],
			`Gerado em: ${new Date().toLocaleString('pt-BR')}`
		]),
		filename: `relatorio-solicitacao-${protocol}.pdf`
	};
}
