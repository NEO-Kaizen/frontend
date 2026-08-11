<script lang="ts">
	import LoginForm from '$lib/components/forms/LoginForm.svelte';
</script>

<main class="login-page">
	<section class="login-card" aria-labelledby="login-title">
		<h1 id="login-title">Login</h1>
		<p class="login-subtitle">Acesse o NEO com suas credenciais.</p>

		<LoginForm />
	</section>
</main>

<style>
	.login-page {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: var(--spacing-lg);
	}

	.login-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		width: 100%;
		max-width: 420px;
		padding: var(--spacing-xl);
		background-color: var(--white);
		border: var(--border-default);
		border-radius: var(--radius-xl);
		box-shadow: var(--regular-shadow);
	}

	.login-subtitle {
		color: var(--gray);
	}
</style>
