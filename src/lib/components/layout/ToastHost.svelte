<script lang="ts">
	import { toastState } from '$lib/states/toast.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
</script>

<div class="toast-host" aria-live="polite" aria-atomic="true">
	{#each toastState.toasts as toast (toast.id)}
		<Toast {toast} onClose={(id) => toastState.remove(id)} />
	{/each}
</div>

<style>
	.toast-host {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 50;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
		max-width: 24rem;
		width: 100%;
		padding: 0 1rem;
	}

	@media (min-width: 640px) {
		.toast-host {
			padding: 0;
		}
	}
</style>
