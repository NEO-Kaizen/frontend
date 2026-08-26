<script lang="ts">
	import { page } from '$app/state';
	import Container from '$lib/components/layout/Container.svelte';
	import Card from '$lib/components/layout/Card.svelte';
	import ProtocolSearchCard from '$lib/components/forms/ProtocolSearchCard.svelte';
	import IconBadge from '$lib/components/layout/IconBadge.svelte';
	import Button from '$lib/components/layout/Button.svelte';
	import { mockSolicitations } from '$lib/mocks/solicitations';

	let protocolParam = $derived(page.params.protocolo);
	let solicitation = $derived(
		mockSolicitations.find((item) => item.protocol === protocolParam)
	);
</script>

<Container>
	<div class="page-layout">
		<section class="search-section">
			<ProtocolSearchCard />
		</section>

		{#if solicitation}
			<section class="details-section">
				<Card padding="lg">
					<div class="header-card">
						<div>
							<p class="protocol-number">Protocolo #{solicitation.protocol}</p>
							<h1 class="title">{solicitation.title}</h1>
						</div>
						<div class="status-badge">
							{solicitation.statusLabel}
						</div>
					</div>

					<div class="grid-info">
						<div class="info-item">
							<span class="label">Responsável Técnico</span>
							<span class="value">{solicitation.technicalResponsible}</span>
						</div>
						<div class="info-item">
							<span class="label">Data de Abertura</span>
							<span class="value">{solicitation.openingDate}</span>
						</div>
						<div class="info-item">
							<span class="label">Previsão de Conclusão</span>
							<span class="value">{solicitation.completionForecast}</span>
						</div>
						<div class="info-item">
							<span class="label">Última Atualização</span>
							<span class="value">{solicitation.lastUpdate}</span>
						</div>
					</div>

					{#if solicitation.meeting}
						<div class="meeting-box">
							<IconBadge icon="video" size="md" />
							<div class="meeting-info">
								<strong>REUNIÃO DE ALINHAMENTO</strong>
								<p>{solicitation.meeting.date}</p>
							</div>
							{#if solicitation.meeting.link}
								<Button href={solicitation.meeting.link} variant="secondary" size="sm">
									Acessar Reunião
								</Button>
							{/if}
						</div>
					{/if}

					{#if solicitation.lastMessage}
						<div class="message-box">
							<strong>Última Observação da Equipe:</strong>
							<p>{solicitation.lastMessage}</p>
						</div>
					{/if}
				</Card>
			</section>
		{:else}
			<section class="not-found-section">
				<Card padding="lg">
					<div class="not-found">
						<h2>Protocolo não encontrado</h2>
						<p>
							Não localizamos nenhuma solicitação com o número <strong>{protocolParam}</strong>.
						</p>
						<p>Verifique o código digitado e tente novamente.</p>
					</div>
				</Card>
			</section>
		{/if}
	</div>
</Container>

<style>
	.page-layout {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		padding: var(--spacing-lg) 0;
	}

	.header-card {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 1px solid var(--gray-light, #e5e7eb);
		padding-bottom: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.protocol-number {
		font: var(--paragrafo-sm);
		color: var(--gray);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.title {
		font: var(--h2);
		color: var(--primary-color);
		margin-top: var(--spacing-2xs);
	}

	.status-badge {
		background-color: var(--primary-color-light, #e0f2fe);
		color: var(--primary-color);
		font: var(--paragrafo-sm);
		font-weight: 600;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-full, 9999px);
	}

	.grid-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3xs);
	}

	.info-item .label {
		font: var(--paragrafo-sm);
		color: var(--gray);
	}

	.info-item .value {
		font: var(--paragrafo);
		font-weight: 600;
		color: var(--text-color, #1f2937);
	}

	.meeting-box {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		background-color: var(--background-secondary, #f8fafc);
		padding: var(--spacing-md);
		border-radius: var(--radius-md, 8px);
		margin-bottom: var(--spacing-md);
	}

	.meeting-info {
		flex: 1;
	}

	.meeting-info strong {
		display: block;
		font: var(--paragrafo-sm);
		color: var(--primary-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.meeting-info p {
		font: var(--paragrafo);
		font-weight: 600;
		color: var(--text-color, #1f2937);
	}

	.message-box {
		background-color: var(--background-secondary, #f8fafc);
		border-left: 4px solid var(--primary-color);
		padding: var(--spacing-md);
		border-radius: 0 var(--radius-md, 8px) var(--radius-md, 8px) 0;
	}

	.message-box strong {
		display: block;
		font: var(--paragrafo-sm);
		color: var(--gray);
		margin-bottom: var(--spacing-3xs);
	}

	.message-box p {
		font: var(--paragrafo);
		color: var(--text-color, #1f2937);
	}

	.not-found {
		text-align: center;
		padding: var(--spacing-xl) 0;
	}

	.not-found h2 {
		font: var(--h3);
		color: var(--primary-color);
		margin-bottom: var(--spacing-xs);
	}

	.not-found p {
		font: var(--paragrafo);
		color: var(--gray);
	}

	@media (max-width: 600px) {
		.header-card {
			flex-direction: column;
			gap: var(--spacing-xs);
		}

		.meeting-box {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>