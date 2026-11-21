<script lang="ts">
	import { page } from '$app/state';

	// Marca do produto de base (não configurável) — atribuição "powered by".
	const PRODUCT_NAME = 'MAAT Flow';

	// Plataforma da marca base: quando o portal usa este nome, não é um rebrand
	// e a atribuição não é exibida.
	const BASE_PLATFORM_NAME = 'MAAT';

	const platformName = $derived(page.data.portalConfig.platformName);
	const isRebranded = $derived(platformName !== BASE_PLATFORM_NAME);
</script>

<footer class="footer">
	<div class="footer__content">
		<p class="footer__brand">{platformName}</p>

		<div class="footer__center">
			<p class="footer__copyright">© 2026 {platformName}. Todos os direitos reservados.</p>

			{#if isRebranded}
				<p class="footer__powered">Powered by {PRODUCT_NAME}</p>
			{/if}
		</div>

		<p class="footer__credits">Desenvolvido pela Turma 8 Kaizen — Alpha EdTech</p>
	</div>
</footer>

<style>
	.footer {
		width: 100%;
		margin-top: auto;
		background-color: var(--white);
	}

	.footer__content {
		width: 100%;
		padding: var(--spacing-md) var(--spacing-xl);
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: var(--spacing-lg);
	}

	.footer__brand,
	.footer__powered,
	.footer__copyright,
	.footer__credits {
		margin: 0;
		font-size: 14px;
		white-space: nowrap;
	}

	.footer__brand {
		justify-self: start;
		color: var(--primary-color);
		font-weight: 700;
		text-align: left;
	}

	.footer__center {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
	}

	.footer__powered {
		color: var(--gray);
		text-align: center;
	}

	.footer__copyright {
		color: var(--black);
		text-align: center;
	}

	.footer__credits {
		justify-self: end;
		color: var(--black);
		text-align: right;
	}

	@media (max-width: 768px) {
		.footer__content {
			grid-template-columns: 1fr;
			gap: var(--spacing-sm);
		}

		.footer__brand,
		.footer__credits {
			justify-self: center;
		}

		.footer__center {
			flex-wrap: wrap;
		}

		.footer__brand,
		.footer__powered,
		.footer__copyright,
		.footer__credits {
			text-align: center;
			white-space: normal;
		}
	}
</style>
