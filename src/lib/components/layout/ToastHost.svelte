<script lang="ts">
	import { toastState } from '$lib/states/toast.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
</script>

<div
	class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
	aria-live="polite"
	aria-atomic="true"
>
	{#each toastState.toasts as toast (toast.id)}
		<Toast {toast} onClose={(id) => toastState.remove(id)} />
	{/each}
</div>
