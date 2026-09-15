<script lang="ts">
	import type { SolicitationMode } from '$lib/types/portal-config';
	import SettingsCard from './SettingsCard.svelte';

	interface Props {
		mode: SolicitationMode;
		onchange: (mode: SolicitationMode) => void;
	}

	let { mode, onchange }: Props = $props();
</script>

<SettingsCard
	iconName="security"
	title="1. Acesso"
	description="Defina como o portal será aberto para os usuários."
>
	<fieldset class="access-group">
		<legend class="access-legend">
			<span class="access-legend-text">Modo de abertura do portal</span>
			<span class="info-tip-container">
				<button
					class="info-tip"
					type="button"
					aria-label="Ver informação sobre o modo de abertura do portal"
				>
					<span aria-hidden="true">i</span>
				</button>
				<span class="info-tip-tooltip" role="tooltip">
					Define se o portal pode ser acessado sem login (Público) ou exige autenticação
					(Autenticado).
				</span>
			</span>
		</legend>

		<label class="access-option">
			<input
				class="sr-only access-radio"
				type="radio"
				name="accessMode"
				value="PUBLIC"
				checked={mode === 'PUBLIC'}
				onchange={() => onchange('PUBLIC')}
			/>
			<span class="radio-control" aria-hidden="true"></span>
			<span class="access-option-text">
				<span class="access-option-title">Público</span>
				<span class="access-option-description">
					Qualquer pessoa anônima pode enviar uma solicitação.
				</span>
			</span>
		</label>

		<label class="access-option">
			<input
				class="sr-only access-radio"
				type="radio"
				name="accessMode"
				value="AUTHENTICATED"
				checked={mode === 'AUTHENTICATED'}
				onchange={() => onchange('AUTHENTICATED')}
			/>
			<span class="radio-control" aria-hidden="true"></span>
			<span class="access-option-text">
				<span class="access-option-title">Autenticado</span>
				<span class="access-option-description">
					O usuário anônimo é direcionado ao login (Acessar) e as solicitações ficam vinculadas à
					conta.
				</span>
			</span>
		</label>
	</fieldset>
</SettingsCard>

<style>
	.access-group {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.access-legend {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0;
		padding-bottom: var(--spacing-sm);
		font: var(--label);
		color: var(--black);
	}

	.info-tip-container {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
	}

	.info-tip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background-color: var(--secondary-color);
		color: var(--on-primary);
		font: var(--label);
		font-size: 12px;
		line-height: 1;
		cursor: help;
		transition: var(--transition-default);
	}

	.info-tip:hover {
		opacity: 0.9;
	}

	.info-tip-tooltip {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		z-index: 10;
		width: max-content;
		max-width: 280px;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		background-color: var(--rich-black);
		color: var(--on-primary);
		font: var(--paragrafo);
		font-size: 13px;
		line-height: 1.4;
		opacity: 0;
		pointer-events: none;
		transform: translateY(-4px);
		transition: var(--transition-default);
	}

	.info-tip-container:hover .info-tip-tooltip,
	.info-tip-container:focus-within .info-tip-tooltip {
		opacity: 1;
		transform: translateY(0);
	}

	.access-option {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-md);
		padding: var(--spacing-md);
		border: 1px solid var(--white-gray);
		border-radius: var(--radius-sm);
		background-color: var(--white);
		cursor: pointer;
		transition: var(--transition-default);
	}

	.access-option:hover {
		border-color: var(--secondary-color);
	}

	.access-option:has(input:checked) {
		border-color: var(--secondary-color);
		background-color: var(--status-blue-bg);
	}

	.access-radio {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		opacity: 0;
	}

	.radio-control {
		position: relative;
		width: 18px;
		height: 18px;
		border: 2px solid var(--gray);
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 2px;
		transition: var(--transition-default);
	}

	.access-radio:checked + .radio-control {
		border-color: var(--secondary-color);
	}

	.access-radio:checked + .radio-control::after {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--secondary-color);
	}

	.access-radio:focus-visible + .radio-control {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
	}

	.access-option-text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		min-width: 0;
	}

	.access-option-title {
		font: var(--label);
		color: var(--rich-black);
	}

	.access-option-description {
		margin: 0;
		font: var(--paragrafo);
		font-size: 14px;
		color: var(--gray);
	}
</style>
