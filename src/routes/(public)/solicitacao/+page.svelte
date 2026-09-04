<script lang="ts">
	import SolicitationForm from './components/solicitation-form/SolicitationForm.svelte';
</script>

<main class="content-container">
	<SolicitationForm />
</main>

<style>
	.placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-xl) 0;
	}
</style>
