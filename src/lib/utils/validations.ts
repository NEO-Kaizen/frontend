export function isProtocol(value: string): boolean {
	return /^[A-Z]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(value);
}

export function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}