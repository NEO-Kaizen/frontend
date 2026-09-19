// Helpers de listas com `id` inteiro — usados pelos cards de categorias e de
// status, que operam sobre arrays atômicos no draft.

export function nextId(items: { id: number }[]): number {
	return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

export function replaceById<T extends { id: number }>(
	items: T[],
	id: number,
	patch: Partial<T>
): T[] {
	return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function removeById<T extends { id: number }>(items: T[], id: number): T[] {
	return items.filter((item) => item.id !== id);
}
