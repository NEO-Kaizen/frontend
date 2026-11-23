import { browser } from '$app/environment';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
	id: string;
	message: string;
	type: ToastType;
}

/** Lê o token visual, mantendo o fallback quando CSS ainda não estiver disponível. */
function toastDisplayDurationMs(): number {
	if (!browser) return 4000;
	const raw = getComputedStyle(document.documentElement)
		.getPropertyValue('--toast-display-duration')
		.trim();
	const value = Number.parseFloat(raw);
	if (!Number.isFinite(value) || value <= 0) return 4000;
	return raw.endsWith('ms') ? value : raw.endsWith('s') ? value * 1000 : 4000;
}

class ToastState {
	toasts = $state<ToastMessage[]>([]);

	add(message: string, type: ToastType = 'success') {
		if (!browser) return;

		const id = Math.random().toString(36).substring(2, 9);
		const newToast: ToastMessage = { id, message, type };

		this.toasts.push(newToast);

		setTimeout(() => {
			this.remove(id);
		}, toastDisplayDurationMs());
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toastState = new ToastState();
