import { browser } from '$app/environment';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
	id: string;
	message: string;
	type: ToastType;
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
		}, 4000);
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toastState = new ToastState();
