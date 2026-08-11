<script lang="ts">
    import logo from '$lib/assets/login.png';
    import Icon from '$lib/components/Icon.svelte';
    // TypeScript
    // variáveis
    // props
    // funções
    // eventos
</script>

<form>
    <div class="container-banner">
        <h2>Potencialize a gestão Inteligente</h2>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="2" viewBox="0 0 48 2" fill="none">
            <rect width="48" height="2" fill="#D8E2FF"/>
        </svg>
        <p>EXCELÊNCIA CORPORATIVA</p>
    </div>
    <div class="container-form">
        <div class="container-titulo">
            <h1>Bem-vindo ao NEO</h1>
            <p>Insira suas credenciais.</p>
        </div>
        <label for="email">E-mail</label>
        <input
            id="email"
            type="email"
            name="email"
        />
        <label for="password">Senha</label>
        <input
            id="password"
            type="password"
            name="password"
        />
        <button type="submit">
            Entrar
            <Icon
                iconName="login"
                iconSize="md"
            />
        </button>
    </div>
</form>

<style>
    form {
        display: flex;
        box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
        border-radius: var(--radius-xl);
        overflow: hidden;
    }
    h1{
        font: var(--h2);
    }
    h2{ 
        font: var(--h1);
    }

    .container-banner{
        width: 50%;
        background-image: url('$lib/assets/login.png');
        background-size: cover;
        background-position: center;
        padding: var(--spacing-xl);
    }
    .container-banner h2{
        color: var(--color-primary);
    }
    .container-form{
        width: 50%;
        gap: var(--spacing-md);
        display: flex;
        flex-direction: column;
        padding: 64px;
    }
    .container-titulo{
        gap: var(--spacing-sm);
        display: flex;
        flex-direction: column;
    }
</style>