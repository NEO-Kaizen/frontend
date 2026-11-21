<script lang="ts">
	import LoginForm from '$lib/components/forms/LoginForm.svelte';
</script>

<div class="login-page">
	<main class="content-container">
		<LoginForm />
	</main>
</div>

<style>
	.login-page {
		width: 100%;
		max-height: calc(100vh - 40px);
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: hidden;
		margin: auto 0;
	}

	.content-container {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
