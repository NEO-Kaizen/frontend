<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { InternalRequestDetail, RequestStatus } from '$lib/types/request';
	import type { CriterionNotes, PrioritizationResult } from '$lib/types/prioritization';
	import { loadPrioritizationFinal } from '$lib/services/prioritization-draft.service';
	import { canAssignAnalyst, canCalculatePriority } from '$lib/services/access.service';
	import AssignAction from './AssignAction.svelte';
	import FloatingPrioritizationPanel from './prioritization/FloatingPrioritizationPanel.svelte';
	import QuickActions from './QuickActions.svelte';
	import SpecTabs from './SpecTabs.svelte';

	interface Props {
		solicitation: InternalRequestDetail;
		onSaveSuccess?: (updated: InternalRequestDetail) => void;
		onSaveError?: (message: string) => void;
		onTriageSuccess?: (updated: InternalRequestDetail) => void;
	}

	let { solicitation, onSaveSuccess, onSaveError, onTriageSuccess }: Props = $props();

	function getStatusTheme(status: RequestStatus): { bg: string; color: string; border: string } {
		switch (status) {
			case 'Concluído':
			case 'Elegível':
				return {
					bg: 'var(--status-green-bg)',
					color: 'var(--status-green)',
					border: 'var(--status-green)'
				};
			case 'Pendente de informações':
			case 'Aguardando triagem':
			case 'Aguardando mapeamento':
				return {
					bg: 'var(--status-yellow-bg)',
					color: 'var(--status-yellow)',
					border: 'var(--status-yellow)'
				};
			case 'Cancelado':
			case 'Não elegível':
				return {
					bg: 'var(--status-red-bg)',
					color: 'var(--status-red)',
					border: 'var(--status-red)'
				};
			default:
				return {
					bg: 'var(--status-blue-bg)',
					color: 'var(--status-blue)',
					border: 'var(--status-blue)'
				};
		}
	}

	let statusTheme = $derived(getStatusTheme(solicitation.status));
	let displayScore = $derived(
		solicitation.prioritization.score === null ? '-' : String(solicitation.prioritization.score)
	);
	let priorityLabel = $derived(solicitation.prioritization.label ?? 'Prioridade a ser calculada');
	let isPriorityCalculated = $derived(solicitation.prioritization.score !== null);
	let maxScore = $derived(solicitation.prioritization.maxScore ?? 50);

	function priorityBadgeTheme(
		label: string | null,
		hasScore: boolean
	): { bg: string; color: string; border: string } {
		if (!hasScore || !label) {
			return { bg: '#f3f4f6', color: 'var(--gray)', border: 'var(--white-gray)' };
		}
		switch (label) {
			case 'Crítica':
				return {
					bg: 'var(--status-red-bg)',
					color: 'var(--status-red)',
					border: 'var(--status-red)'
				};
			case 'Alta':
				return {
					bg: 'var(--status-yellow-bg)',
					color: 'var(--status-yellow)',
					border: 'var(--status-yellow)'
				};
			case 'Média':
				return {
					bg: 'var(--status-blue-bg)',
					color: 'var(--status-blue)',
					border: 'var(--status-blue)'
				};
			default:
				return {
					bg: 'var(--status-green-bg)',
					color: 'var(--status-green)',
					border: 'var(--status-green)'
				};
		}
	}

	let badgeTheme = $derived(
		priorityBadgeTheme(solicitation.prioritization.label, isPriorityCalculated)
	);

	const currentUser = $derived(page.data.user as import('$lib/types/auth').SessionUser | null);
	const canAssign = $derived(canAssignAnalyst(currentUser));
	const canCalculate = $derived(
		canCalculatePriority(currentUser, solicitation.assignee?.id ?? null)
	);
	const hiddenQuickActionKeys = $derived.by(() => {
		const hidden: string[] = [];
		if (!canAssign) hidden.push('assignResponsible');
		if (!canCalculate) hidden.push('priorityCalculator');
		return hidden;
	});
	const existingPriorityResult = $derived<PrioritizationResult | null>(
		isPriorityCalculated && solicitation.prioritization.label
			? {
					score: solicitation.prioritization.score as number,
					maxScore,
					level: solicitation.prioritization.label as PrioritizationResult['level']
				}
			: null
	);

	// ---- Calculadora flutuante (R1-R9) ----
	let isCalculatorOpen = $state(false);
	let isCalculatorMinimized = $state(false);
	let calculatorPos = $state<{ x: number; y: number } | null>(null);

	let isAssignModalOpen = $state(false);

	// Restaura priorização final do sessionStorage ao montar/trocar de protocolo
	// Corrige header que revertia após invalidateAll (mock servidor isolado) — sem depender de solicitation para evitar loop
	$effect(() => {
		const protocol = solicitation.protocol;
		if (!browser) return;
		untrack(() => {
			const persisted = loadPrioritizationFinal(protocol);
			if (!persisted) return;
			const hasNotes = Object.keys(persisted.notes).length > 0;
			if (!hasNotes) return;
			const current = solicitation;
			const serverNotes = current.prioritization.notes;
			const needsUpdate =
				JSON.stringify(serverNotes) !== JSON.stringify(persisted.notes) ||
				persisted.result?.score !== current.prioritization.score;
			if (needsUpdate) {
				solicitation = {
					...current,
					prioritization: {
						score: persisted.result?.score ?? current.prioritization.score,
						maxScore: 50 as const,
						label: persisted.result?.level ?? current.prioritization.label,
						notes: { ...persisted.notes }
					}
				};
			}
		});
	});

	function handleOpenCalculator() {
		if (!canCalculate) return;
		isCalculatorOpen = true;
		isCalculatorMinimized = false;
	}

	function handleCloseCalculator() {
		isCalculatorOpen = false;
		// R5: não reseta o que foi preenchido — estado interno da calculadora permanece
	}

	function handleToggleMinimize() {
		isCalculatorMinimized = !isCalculatorMinimized;
	}

	function handleCalculatorPositionChange(pos: { x: number; y: number }) {
		calculatorPos = pos;
	}

	function handleCalculatorSave(result: PrioritizationResult, notes: CriterionNotes) {
		solicitation = {
			...solicitation,
			prioritization: {
				score: result.score,
				maxScore: 50 as const,
				label: result.level,
				notes: { ...notes }
			}
		};
		// Propaga para +page.svelte e outras abas sem reload manual (sem invalidateAll para não reverter via mock servidor)
		onTriageSuccess?.(solicitation);
		onSaveSuccess?.(solicitation);
	}

	function handleAssignSuccess(updated: InternalRequestDetail): void {
		// Atualiza localmente sem invalidar: evita revert do mock (server sem persistência) e
		// mantém mesma lógica para Triagem/Mapeamento — apenas o PATCH muda (assigneeId vs mappingAssigneeId)
		solicitation = updated;
	}

	function handleQuickAction(key: string) {
		if (key === 'priorityCalculator') {
			if (!canCalculate) return;
			handleOpenCalculator();
		} else if (key === 'assignResponsible') {
			if (!canAssign) return;
			isAssignModalOpen = true;
		}
	}
</script>

{#snippet headerSnippet()}
	<div class="header-row">
		<div class="header-left">
			<div class="header-meta">
				<span
					class="status-badge"
					style:background-color={statusTheme.bg}
					style:color={statusTheme.color}
					style:border={`1px solid ${statusTheme.border}`}
				>
					{solicitation.status.toUpperCase()}
				</span>
				<span class="protocol">{solicitation.protocol}</span>
				<span class="notification-skeleton" aria-label="Notificações pendentes">
					<Icon iconName="info" iconSize="sm" />
					<span class="notification-text">0 notificações</span>
				</span>
			</div>
			<h1 class="solicitation-title">{solicitation.demand.title}</h1>
			<div class="responsible-field" aria-label="Responsável da solicitação">
				<span class="responsible-label">
					<Icon iconName="person" iconSize="sm" />
					Responsável
				</span>
				<span
					class="responsible-value"
					class:is-unassigned={!solicitation.assignee?.name}
					title={solicitation.assignee?.name ?? 'Não atribuído'}
				>
					{solicitation.assignee?.name ?? 'Não atribuído'}
				</span>
			</div>
		</div>
		{@render prioritizationCardSnippet()}
	</div>
{/snippet}

{#snippet prioritizationCardSnippet()}
	<div
		class="prio-card"
		role="status"
		aria-label={isPriorityCalculated
			? `Prioridade ${priorityLabel} com pontuação ${displayScore} de ${maxScore}`
			: 'Prioridade a ser calculada'}
	>
		<span class="prio-label">
			<Icon iconName="security" iconSize="sm" />
			Priorização
		</span>
		<div class="prio-score-row">
			<span class="prio-score" class:muted={!isPriorityCalculated}>
				{displayScore}<span class="prio-max">/{maxScore}</span>
			</span>
			<span
				class="prio-badge"
				style:background-color={badgeTheme.bg}
				style:color={badgeTheme.color}
				style:border={`1px solid ${badgeTheme.border}`}
			>
				{priorityLabel}
			</span>
		</div>
	</div>
{/snippet}

<div class="solicitation-specs-page">
	{@render headerSnippet()}

	<SpecTabs
		{solicitation}
		{onSaveSuccess}
		{onSaveError}
		{onTriageSuccess}
		onOpenCalculator={handleOpenCalculator}
	/>

	<QuickActions
		hiddenActionKeys={hiddenQuickActionKeys}
		hasExistingPriority={isPriorityCalculated}
		existingPriorityDisplay={isPriorityCalculated
			? `${displayScore}/${maxScore} — ${priorityLabel}`
			: null}
		onAction={handleQuickAction}
	/>

	<FloatingPrioritizationPanel
		protocol={solicitation.protocol}
		initialNotes={solicitation.prioritization.notes}
		existingResult={existingPriorityResult}
		isOpen={isCalculatorOpen && canCalculate}
		isMinimized={isCalculatorMinimized}
		position={calculatorPos}
		hasExistingPriority={isPriorityCalculated}
		existingPriorityDisplay={isPriorityCalculated
			? `${displayScore}/${maxScore} — ${priorityLabel}`
			: null}
		onClose={handleCloseCalculator}
		onMinimize={handleToggleMinimize}
		onPositionChange={handleCalculatorPositionChange}
		onSave={handleCalculatorSave}
	/>

	{#if isAssignModalOpen && canAssign}
		<AssignAction
			protocol={solicitation.protocol}
			currentAssigneeId={solicitation.assignee?.id ?? null}
			currentAssigneeName={solicitation.assignee?.name ?? null}
			// currentMappingAssigneeId={solicitation.mappingAssignee?.id ?? null}
			// currentMappingAssigneeName={solicitation.mappingAssignee?.name ?? null}
			onclose={() => (isAssignModalOpen = false)}
			onSuccess={handleAssignSuccess}
		/>
	{/if}
</div>

<style>
	.solicitation-specs-page {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-lg);
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 5px;
		flex: 1;
		min-width: 0;
	}

	.header-meta {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.status-badge {
		display: inline-block;
		padding: 3px 10px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.protocol {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 500;
		color: var(--gray);
	}

	.notification-skeleton {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		border-radius: var(--radius-md);
		background: var(--background-color);
		border: 1px solid var(--white-gray);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 500;
		color: var(--gray);
	}

	.notification-text {
		white-space: nowrap;
	}

	.solicitation-title {
		margin: 0;
		font-family: var(--font-montserrat);
		font-size: 22px;
		font-weight: 700;
		color: var(--primary-color);
		line-height: 1.3;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	.responsible-field {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 5px 10px;
		background: linear-gradient(135deg, var(--white) 0%, var(--background-color) 100%);
		border: 1px solid var(--white-gray);
		border-left: 3px solid var(--secondary-color);
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
		width: fit-content;
		min-width: 180px;
		max-width: 100%;
		text-align: center;
		flex-shrink: 0;
	}

	.responsible-field :global(.material-symbols-outlined) {
		color: var(--gray);
	}

	.responsible-label {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray);
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.responsible-value {
		font-family: var(--font-inter);
		font-size: 13px;
		font-weight: 700;
		color: var(--primary-color);
		line-height: 1.3;
		word-break: break-word;
		overflow-wrap: anywhere;
		max-width: 220px;
		text-align: center;
	}

	.responsible-value.is-unassigned {
		color: var(--gray);
		font-weight: 400;
		font-style: italic;
	}

	.prio-card {
		background: linear-gradient(135deg, var(--white) 0%, var(--background-color) 100%);
		border: 1px solid var(--white-gray);
		border-left: 3px solid var(--secondary-color);
		border-radius: var(--radius-sm);
		padding: 14px 18px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		box-shadow: var(--regular-shadow);
		min-width: 220px;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.prio-label {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 600;
		color: var(--gray);
		letter-spacing: 0.02em;
	}

	.prio-score-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	.prio-score {
		font-family: var(--font-montserrat);
		font-size: 26px;
		font-weight: 800;
		color: var(--status-blue);
		line-height: 1;
	}

	.prio-score.muted {
		color: var(--gray);
	}

	.prio-max {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray);
		margin-left: 1px;
	}

	.prio-badge {
		padding: 3px 8px;
		border-radius: var(--radius-md);
		font-family: var(--font-inter);
		font-size: 11px;
		font-weight: 700;
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.header-row {
			flex-direction: column;
		}

		.prio-card {
			width: 100%;
		}

		.responsible-field {
			width: 100%;
			min-width: 0;
		}
	}

	@media (max-width: 640px) {
		.solicitation-title {
			font-size: 18px;
		}
	}
</style>
