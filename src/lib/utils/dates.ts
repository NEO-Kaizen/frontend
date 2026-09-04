function parseIsoDate(isoString: string): Date {
	if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
		return new Date(`${isoString}T00:00:00`);
	}
	return new Date(isoString);
}

export function formatDate(isoString: string | null): string {
	if (!isoString) return 'N/A';
	const date = parseIsoDate(isoString);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric'
	});
}

export function formatDateTime(isoString: string | null): string {
	if (!isoString) return 'N/A';
	const date = parseIsoDate(isoString);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
