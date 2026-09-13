<script lang="ts">
	import SolicitationForm from './components/solicitation-form/SolicitationForm.svelte';

	let { data } = $props();
</script>

<main class="content-container">
	<SolicitationForm user={data.user} />
</main>

