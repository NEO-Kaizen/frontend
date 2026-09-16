<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import { DEFAULT_PORTAL_CONFIG } from '$lib/config/portal-defaults';
	import { saveAccess } from '$lib/config/portal-config.service';
	import { SectionState } from '$lib/states/section.svelte';
	import type { AccessSection, SolicitationMode } from '$lib/types/portal-config';
	import SectionActions from './SectionActions.svelte';
	import SettingsCard from './SettingsCard.svelte';

	const section = new SectionState<AccessSection>(
		{ solicitationMode: page.data.portalConfig.solicitationMode },
		{ solicitationMode: DEFAULT_PORTAL_CONFIG.solicitationMode },
		(draft) => saveAccess({ solicitationMode: draft.solicitationMode })
	);

	function setMode(mode: SolicitationMode) {
		section.draft = { solicitationMode: mode };
		section.clearFeedback();
	}

	async function handleSave() {
		if (await section.save()) {
			await invalidateAll();
		}
	}
</script>

<SettingsCard
	iconName="security"
	title="1. Acesso"
	description="Defina como o portal será aberto para os usuários."
>
	{#snippet actions()}
		<SectionActions
			dirty={section.dirty}
			saving={section.saving}
			feedback={section.feedback}
			onSave={handleSave}
			onCancel={() => section.reset()}
			onRestoreDefaults={() => section.restoreDefaults()}
		/>
	{/snippet}

	<fieldset class="access-group">
		<legend class="access-legend">
			<span class="access-legend-text">Modo de abertura do portal</span>
			<InfoTip
				label="Ver informação sobre o modo de abertura do portal"
				text="Define se o portal pode ser acessado sem login (Público) ou exige autenticação (Autenticado)."
			/>
		</legend>

		<label class="access-option">
			<input
				class="sr-only access-radio"
				type="radio"
				name="accessMode"
				value="PUBLIC"
				checked={section.draft.solicitationMode === 'PUBLIC'}
				onchange={() => setMode('PUBLIC')}
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
				checked={section.draft.solicitationMode === 'AUTHENTICATED'}
				onchange={() => setMode('AUTHENTICATED')}
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
