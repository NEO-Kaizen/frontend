export function isProtocol(value: string): boolean {
	// Aceita formatos como MAAT-8K3P-9X2M ou NEO-2026-000123
	return /^[A-Z0-9]+(-[A-Z0-9]+)+$/i.test(value.trim());
}

export function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
