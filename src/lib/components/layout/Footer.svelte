<script lang="ts">
	import { page } from '$app/state';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';

	// Marca do produto de base (não configuravel) — copyright e atribuição.
	const PRODUCT_NAME = 'MAAT Flow';

	const platformName = $derived(page.data.portalConfig.platformName);
	const isRebranded = $derived(platformName !== DEFAULT_PORTAL_CONFIG.platformName);
</script>

<footer class="footer">
	<div class="footer__content">
		<p class="footer__brand">{platformName}</p>

		{#if isRebranded}
			<p class="footer__powered">Powered by {PRODUCT_NAME}</p>
		{/if}

		<p class="footer__copyright">© 2026 {PRODUCT_NAME}. Todos os direitos reservados.</p>

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
		display: flex;
		align-items: center;
		justify-content: space-between;
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
		color: var(--primary-color);
		font-weight: 700;
		text-align: left;
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
		color: var(--black);
		text-align: right;
	}

	@media (max-width: 768px) {
		.footer__content {
			flex-direction: column;
			gap: var(--spacing-sm);
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
