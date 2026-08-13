<footer class="footer">
	<div class="footer__content">
		<p class="footer__brand">Portal NEO</p>

		<p class="footer__copyright">© 2026 Portal NEO. Todos os direitos reservados.</p>

		<p class="footer__credits">Desenvolvido pela Turma 8 Kaizen — Alpha EdTech</p>
	</div>
</footer>

<style>
	:global(body) {
		min-height: 100dvh;
	}
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
		.footer__copyright,
		.footer__credits {
			text-align: center;
			white-space: normal;
		}
	}
</style>
