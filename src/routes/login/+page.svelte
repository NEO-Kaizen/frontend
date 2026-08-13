<script lang="ts">
    import LoginForm from '$lib/components/forms/LoginForm.svelte';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/layout/Footer.svelte';
</script>

<div class="login-page">
    <Header />

    <main class="content-container">
        <LoginForm />
    </main>

    <Footer />
</div>

<style>
    .login-page {
		width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
		align-items: center;
    }

    .content-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>