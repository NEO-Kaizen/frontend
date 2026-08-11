<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';
    import Button from '$lib/components/Button.svelte';
    import Input from '$lib/components/Input.svelte';


    let email = $state('');
	let password = $state('');
	let showPassword = $state(false);

	let errors = $state({
		email: '',
		password: ''
	});

</script>

<form>
    <div class="container-banner">
        <h2>Potencializando a Gestão Inteligente.</h2>
        <span style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="2" viewBox="0 0 48 2" fill="none">
                <rect width="48" height="2" fill="#D8E2FF"/>
            </svg>
            <p>EXCELÊNCIA CORPORATIVA</p>
        </span>
    </div>
    <div class="container-form">
        <div class="container-titulo">
            <h1>Bem-vindo ao NEO</h1>
            <p>Insira suas credenciais.</p>
        </div>

        <div class="container-input">
            <Input
                type="email"
                name="email"
                label="E-mail"
                placeholder="voce@empresa.com"
                icon="email"
                autocomplete="email"
                required
                bind:value={email}
                error={errors.email}
            />
    
            <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Senha"
                icon="lock"
                placeholder="Digite sua senha"
                actionIcon={showPassword ? 'visibilityOff' : 'visibility'}
                actionLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onAction={() => (showPassword = !showPassword)}
                autocomplete={showPassword ? 'off' : 'current-password'}
                required
                bind:value={password}
                error={errors.password}
            />
        </div>

        <Button variant="primary" type="submit" size="full" loading={false}>
            Entrar
            <Icon
                iconName="login"
                iconSize="md"
            />
        </Button>
    </div>
</form>

<style>
    form {
        width: 100%;
        display: flex;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border-radius: var(--radius-xl);
        overflow: hidden;
        background-color: var(--white);
    }

    h1{
        font: var(--h2);
    }

    h2{ 
        font: var(--h1);
    }

    .container-banner{
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        width: 50%;
        gap: var(--spacing-xl);
        background-image: url('$lib/assets/login.png');
        background-size: cover;
        background-position: center;
        padding: var(--spacing-xl) ;
    }
    .container-banner h2, .container-banner p{
        color: var(--white);
    }
    .container-form{
        width: 50%;
        gap: var(--spacing-xl);
        display: flex;
        flex-direction: column;
        padding: 100px 64px;
    }
    .container-input {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }
    .container-titulo{
        gap: var(--spacing-sm);
        display: flex;
        flex-direction: column;
    }
</style>