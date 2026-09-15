<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type { ToastMessage } from '$lib/states/toast.svelte';
	import type { IconName } from '$lib/types/icons';

	interface Props {
		toast: ToastMessage;
		onClose: (id: string) => void;
	}

	let { toast, onClose }: Props = $props();

	let isSuccess = $derived(toast.type === 'success');
	let bgColor = $derived(isSuccess ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white');
	let iconName: IconName = $derived(isSuccess ? 'home' : 'block'); // Usando ícones válidos do dicionário padrão (ex: 'home' para sucesso ou outro ícone genérico, ou podemos usar os disponíveis)
</script>

<div
	class="flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto transition-all duration-300 {bgColor}"
	role="alert"
	aria-live="polite"
>
	<div class="flex items-center gap-2">
		<Icon {iconName} iconSize="sm" />
		<span class="text-sm font-medium">{toast.message}</span>
	</div>

	<button
		type="button"
		class="p-1 rounded hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
		onclick={() => onClose(toast.id)}
		aria-label="Close toast"
	>
		<Icon iconName="close" iconSize="sm" />
	</button>
</div>
