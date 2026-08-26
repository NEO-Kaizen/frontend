<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	type Step = {
		id: number;
		label: string;
	};

	interface Props {
		steps: Step[];
		current: number;
		completedSteps?: Set<number>;
		visitedSteps?: Set<number>;
		onstepclick?: (stepId: number) => void;
	}

	let {
		steps,
		current,
		completedSteps = new Set(),
		visitedSteps = new Set(),
		onstepclick
	}: Props = $props();

	function getStepState(stepId: number): 'completed' | 'current' | 'pending' {
		if (completedSteps.has(stepId)) return 'completed';
		if (stepId === current) return 'current';
		return 'pending';
	}

	function handleStepClick(stepId: number) {
		if (visitedSteps.has(stepId)) {
			onstepclick?.(stepId);
		}
	}
</script>

<nav class="stepper" aria-label="Progresso do formulário">
	<ol class="steps-list">
		{#each steps as step, index (step.id)}
			{@const state = getStepState(step.id)}
			{@const isLast = index === steps.length - 1}

			<li class="step" class:completed={state === 'completed'} class:current={state === 'current'}>
				<button
					type="button"
					class="step-button"
					class:clickable={visitedSteps.has(step.id)}
					onclick={() => handleStepClick(step.id)}
					disabled={!visitedSteps.has(step.id)}
					aria-current={state === 'current' ? 'step' : undefined}
					aria-label="Etapa {step.id}: {step.label}{state === 'completed'
						? ' (concluída)'
						: state === 'current'
							? ' (atual)'
							: ''}"
				>
					<span class="circle">
						{#if state === 'completed'}
							<Icon iconName="check" iconSize="sm" />
						{:else}
							{step.id}
						{/if}
					</span>
				</button>

				<span class="step-label">{step.label}</span>

				{#if !isLast}
					<span class="connector" class:filled={state === 'completed'} aria-hidden="true"></span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.stepper {
		width: 100%;
		padding: var(--spacing-sm) 0;
	}

	.steps-list {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		list-style: none;
		padding: 0;
		margin: 0;
		position: relative;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		position: relative;
		flex: 1;
		max-width: 200px;
	}

	.step-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
		cursor: default;
		z-index: 1;
	}

	.step-button.clickable {
		cursor: pointer;
	}

	.step-button.clickable:focus-visible {
		outline: 2px solid var(--secondary-color);
		outline-offset: 2px;
		border-radius: 50%;
	}

	.circle {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font: var(--label);
		transition: var(--transition-default);
		border: 2px solid var(--white-gray);
		background-color: var(--white);
		color: var(--gray);
	}

	.current .circle {
		background-color: var(--primary-color);
		color: var(--white);
		border-color: var(--primary-color);
	}

	.completed .circle {
		background-color: var(--secondary-color);
		color: var(--white);
		border-color: var(--secondary-color);
	}

	.step-label {
		font: var(--label);
		color: var(--gray);
		text-align: center;
		white-space: nowrap;
	}

	.current .step-label {
		color: var(--primary-color);
		font-weight: 700;
	}

	.completed .step-label {
		color: var(--secondary-color);
	}

	.connector {
		position: absolute;
		top: 18px;
		left: calc(50% + 18px);
		width: calc(100% - 36px);
		height: 2px;
		background-color: var(--white-gray);
		transition: var(--transition-default);
	}

	.connector.filled {
		background-color: var(--secondary-color);
	}
</style>
