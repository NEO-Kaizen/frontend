// Dispara o download de um `Blob` sem navegar para fora da página.
// Único ponto de criação do `<a download>`: fila (CSV) e exportação de PDF.
export function startDownload(blob: Blob, filename: string): void {
	const objectUrl = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = objectUrl;
	anchor.download = filename;
	anchor.hidden = true;
	document.body.append(anchor);
	anchor.click();
	anchor.remove();
	// Mantém a URL válida até o navegador efetivamente iniciar o download.
	setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
