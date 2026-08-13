<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import Card from '$lib/components/Card.svelte';
	import Banner from '$lib/components/layout/Banner.svelte';

	function openChamados() {
		goto(resolve('/(public)/chamado'));
	}
</script>

<main class="content-container solicitation-home">
	<Banner />

	<section class="cards" aria-label="Opções de solicitações">
		<Card
			title="Abrir Solicitação"
			description="Inicie um novo chamado ou requerimento administrativo.
Nosso fluxo guiado ajudará você a fornecer os detalhes necessários."
			buttonText="Iniciar formulário"
			iconName="addCircle"
			buttonIconName="arrowForward"
			variant="primary"
			href={resolve('/(public)/solicitacao')}
		/>

		<Card
			title="Acesso Administrativo"
			description="Ferramentas exclusivas para gestores e administradores de sistema. Gerenciamento de filas, relatórios e permissões."
			buttonText="Realizar Login"
			iconName="adminPanel"
			buttonIconName="arrowForward"
			variant="secondary"
			badgeVariant="cyan"
			href={resolve('/(public)/login')}
		/>

		<Card
			title="Consultar Solicitação"
			description="Verifique o status, prazos e atualizações das solicitações presentes no sistema."
			buttonText="Ver solicitações"
			iconName="search"
			buttonIconName="history"
			variant="secondary"
			badgeVariant="green"
			buttonVariant="outline"
			onAction={openChamados}
		/>
	</section>
</main>

<style>
	.solicitation-home {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--spacing-lg);
		width: 100%;
	}

	@media (max-width: 900px) {
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
