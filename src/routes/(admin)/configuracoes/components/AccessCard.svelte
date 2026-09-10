<script lang="ts">
	import SettingsCard from './SettingsCard.svelte';
</script>

<SettingsCard
	iconName="security"
	title="1. Acesso"
	description="Defina como o portal será aberto para os usuários."
>
	<fieldset class="access-group">
		<legend class="access-legend">
			<span class="access-legend-text">Modo de abertura do portal</span>
			<span class="field-indicator" aria-hidden="true"></span>
		</legend>

		<label class="access-option">
			<input class="sr-only access-radio" type="radio" name="accessMode" value="public" checked />
			<span class="radio-control" aria-hidden="true"></span>
			<span class="access-option-text">
				<span class="access-option-title">Público</span>
				<span class="access-option-description">
					Qualquer pessoa anônima pode enviar uma solicitação.
				</span>
			</span>
		</label>

		<label class="access-option">
			<input class="sr-only access-radio" type="radio" name="accessMode" value="authenticated" />
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

	.field-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--secondary-color);
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
