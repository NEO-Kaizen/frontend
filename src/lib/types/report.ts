// Resultado padrão de exportação: o arquivo pronto para download + o nome
// sugerido pelo servidor (`Content-Disposition`, quando exposto).
export interface FileDownload {
	blob: Blob;
	filename: string;
}

export type QueueCsvDownload = FileDownload;
