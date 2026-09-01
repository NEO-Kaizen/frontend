export function formatDate(isoString: string | null): string {
	if (!isoString) return 'N/A';
	const date = new Date(isoString);
	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});
}

export function formatDateTime(isoString: string | null): string {
	if (!isoString) return 'N/A';
	const date = new Date(isoString);
	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
