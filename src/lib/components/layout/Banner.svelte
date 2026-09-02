<script lang="ts">
	interface Props {
		titulo?: string;
		descricao?: string;
	}

	let {
		titulo = 'Bem-vindo ao portal de solicitações do NEO',
		descricao = 'Sua central unificada para gestão de chamados, suporte técnico e fluxos administrativos. Comece uma nova demanda ou acompanhe o progresso das existentes abaixo.'
	}: Props = $props();
</script>

<!--
	Banner da página inicial.

	Escopo atendido:
	- estrutura visual do Banner;
	- título;
	- texto de apoio;
	- elemento visual/asset do Banner;
	- comportamento responsivo.

	Ação principal não incluída porque não é aplicável
	ao protótipo atual.
-->

<section class="banner">
	<!--
	Conteúdo principal do Banner:
	título e texto de apoio definidos no protótipo.
-->
	<div class="content">
		<h1>{titulo}</h1>

		<p>{descricao}</p>
	</div>
	<!--
	Elemento visual decorativo do Banner,
	conforme identidade definida no protótipo.
-->
	<div class="background-logo" aria-hidden="true">
		<span>NEO</span>
		<span>NEO</span>
		<span>NEO</span>
	</div>
</section>

<style>
	.banner {
		position: relative;

		display: flex;
		align-items: center;

		width: 100%;
		min-height: 170px;

		padding: var(--spacing-xl);

		border-radius: var(--radius-xl);

		background: var(--gradient);

		overflow: hidden;
	}

	.content {
		position: relative;
		max-width: 1000px;
	}

	h1 {
		margin: 0 0 var(--spacing-md);

		color: var(--white);

		font: var(--h1);
	}

	p {
		margin: 0;

		max-width: 510px;
		color: var(--white);

		font: var(--paragrafo);
	}

	.background-logo {
		position: absolute;

		top: 50%;
		right: var(--spacing-xl);

		display: flex;
		flex-direction: column;

		transform: translateY(-50%);

		pointer-events: none;
	}

	.background-logo span {
		color: var(--white);

		font-family: var(--font-montserrat);
		font-size: 6.2rem;
		font-weight: 700;
		line-height: 1.2;

		opacity: 0.15;
	}
	/*
 * Comportamento responsivo do Banner.
 * Ajusta espaçamento, tipografia e elemento visual
 * para telas menores.
 */
	@media (max-width: 640px) {
		.banner {
			border-radius: var(--radius-md);
		}
		h1 {
			font: var(--h3);
		}

		.background-logo {
			right: var(--spacing-md);
		}

		.background-logo span {
			font-size: 4.5rem;
			font-weight: 700;
			line-height: 1.2;
		}
	}
</style>
