<script lang="ts">
	import ProtocolSearchCard from '$lib/components/forms/ProtocolSearchCard.svelte';
	import { mockSolicitations } from '$lib/mocks/solicitations';

	let searchedProtocol = $state('NEO-2026-08-9842');

	let solicitation = $derived(
		mockSolicitations.find((s) => s.protocol === searchedProtocol) || mockSolicitations[0]
	);

	function handleSearch(protocol: string) {
		if (protocol) {
			searchedProtocol = protocol;
		}
	}
</script>

<div class="page-viewport">
	<ProtocolSearchCard onSearch={handleSearch} />

	{#if solicitation}
		<div class="details-card">
			<div class="card-header-top">
				<div class="left-badges">
					<span class="badge-active">SOLICITAÇÃO ATIVA</span>
					<h2>{solicitation.serviceType || 'Upgrade de Infraestrutura de Nuvem - Data Center SP2'}</h2>
					<span class="protocol-code">{solicitation.protocol}</span>
				</div>
				<div class="right-status">
					<span class="status-pill">{solicitation.currentStatus || 'Em Análise Técnica'}</span>
				</div>
			</div>

			<hr class="divider" />

			<div class="metrics-grid">
				<div class="metric-item">
					<div class="icon-box">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002068" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
					</div>
					<div>
						<span class="label">RESPONSÁVEL TÉCNICO</span>
						<strong>{solicitation.applicantName || 'Eng. Ricardo Vasconcelos'}</strong>
					</div>
				</div>

				<div class="metric-item">
					<div class="icon-box">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002068" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
					</div>
					<div>
						<span class="label">DATA DE ABERTURA</span>
						<strong>12 de Outubro, 2026 - 09:45</strong>
					</div>
				</div>

				<div class="metric-item">
					<div class="icon-box">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002068" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
					</div>
					<div>
						<span class="label">PREVISÃO DE CONCLUSÃO</span>
						<strong>18 de Outubro</strong>
					</div>
				</div>

				<div class="metric-item">
					<div class="icon-box">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#002068" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
					</div>
					<div>
						<span class="label">ÚLTIMA ATUALIZAÇÃO</span>
						<strong>Hoje, 14:22</strong>
					</div>
				</div>
			</div>

			{#if solicitation.meeting}
				<div class="meeting-card-box">
					<div class="meeting-left">
						<div class="video-icon">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
						</div>
						<div>
							<span class="meeting-label">REUNIÃO DE ALINHAMENTO</span>
							<div class="meeting-time">{solicitation.meeting.date}</div>
						</div>
					</div>
					<a href={solicitation.meeting.link || '#'} target="_blank" class="btn-join">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
						Entrar na reunião
					</a>
				</div>
			{/if}

			<div class="message-section">
				<h3>Última mensagem do responsável técnico</h3>
				<div class="message-bubble">
					Sua solicitação está em análise. Assim que houver uma atualização, entraremos em contato.
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.page-viewport {
		max-width: 1100px;
		margin: 0 auto;
		padding: 40px 20px;
	}

	.details-card {
		background: #ffffff;
		border-radius: 16px;
		padding: 32px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
		border: 1px solid #f1f5f9;
	}

	.card-header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.badge-active {
		display: inline-block;
		background-color: #dbeafe;
		color: #1e40af;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 4px 10px;
		border-radius: 12px;
		margin-bottom: 8px;
	}

	.left-badges h2 {
		font-size: 1.35rem;
		color: #0f172a;
		margin: 0 0 4px 0;
	}

	.protocol-code {
		color: #64748b;
		font-size: 0.875rem;
	}

	.status-pill {
		background-color: #e2e8f0;
		color: #334155;
		font-size: 0.875rem;
		font-weight: 600;
		padding: 8px 16px;
		border-radius: 8px;
	}

	.divider {
		border: none;
		border-top: 1px solid #f1f5f9;
		margin: 24px 0;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20px;
		margin-bottom: 24px;
	}

	.metric-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.icon-box {
		padding: 8px;
		background-color: #f8fafc;
		border-radius: 8px;
	}

	.metric-item .label {
		display: block;
		font-size: 0.7rem;
		font-weight: 700;
		color: #64748b;
		margin-bottom: 2px;
	}

	.metric-item strong {
		font-size: 0.9rem;
		color: #0f172a;
	}

	.meeting-card-box {
		background-color: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 16px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 28px;
	}

	.meeting-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.video-icon {
		background-color: #0052cc;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.meeting-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: #64748b;
	}

	.meeting-time {
		font-size: 1rem;
		font-weight: 700;
		color: #0f172a;
	}

	.btn-join {
		background-color: #0052cc;
		color: #ffffff;
		padding: 10px 20px;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.message-section h3 {
		font-size: 0.9rem;
		font-weight: 700;
		color: #0f172a;
		margin: 0 0 12px 0;
	}

	.message-bubble {
		background-color: #fafafa;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 16px 20px;
		color: #334155;
		font-size: 0.95rem;
	}
</style>
