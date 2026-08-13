<script lang="ts">
    import LoginForm from '$lib/components/forms/LoginForm.svelte';
    import Header from '$lib/components/Header.svelte';
</script>

<div class="login-page">
    <Header />

    <main class="content-container">
        <LoginForm />
    </main>
</div>

<style>
    .login-page {
		width: 100%;
        height: 100vh;
        max-height: calc(100vh - 40px);
        display: flex;
        flex-direction: column;
		align-items: center;
        overflow: hidden;
    }

    .content-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
