<script lang="ts">
	let {
		value,
		options,
		variant = 'mode',
		disabled = false,
		ariaLabel,
		onChange
	}: {
		value: string;
		options: { value: string; label: string }[];
		variant?: 'mode' | 'tone' | 'neutral';
		disabled?: boolean;
		ariaLabel?: string;
		onChange: (v: string) => void;
	} = $props();

	let open = $state(false);
	let anchor: HTMLButtonElement | undefined = $state(undefined);
	let menuEl: HTMLDivElement | undefined = $state(undefined);
	let coords = $state({ top: 0, left: 0, minWidth: 0 });

	function updateCoords() {
		if (!anchor) return;
		const rect = anchor.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const menuH = 200;
		const menuW = Math.max(rect.width, 160);
		let top = rect.bottom + 6;
		if (top + menuH > vh - 8) top = rect.top - menuH - 6;
		if (top < 8) top = 8;
		let left = rect.left;
		if (left + menuW > vw - 8) left = vw - menuW - 8;
		if (left < 8) left = 8;
		coords = { top, left, minWidth: rect.width };
	}

	function toggle() {
		if (disabled) return;
		open = !open;
		if (open) {
			requestAnimationFrame(() => {
				updateCoords();
				menuEl?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
			});
		}
	}

	function select(v: string) {
		onChange(v);
		open = false;
		anchor?.focus();
	}

	function onWindowPointerDown(e: PointerEvent) {
		if (!open) return;
		const target = e.target as Node;
		if (anchor && anchor.contains(target)) return;
		if (menuEl && menuEl.contains(target)) return;
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			open = false;
			anchor?.focus();
		}
		if (e.key === 'Tab') open = false;
	}

	$effect(() => {
		if (open) {
			window.addEventListener('pointerdown', onWindowPointerDown);
			window.addEventListener('keydown', onKeydown);
			window.addEventListener('resize', updateCoords);
			window.addEventListener('scroll', updateCoords, true);
			return () => {
				window.removeEventListener('pointerdown', onWindowPointerDown);
				window.removeEventListener('keydown', onKeydown);
				window.removeEventListener('resize', updateCoords);
				window.removeEventListener('scroll', updateCoords, true);
			};
		}
	});

	const label = $derived(options.find((o) => o.value === value)?.label ?? '—');
</script>

<button
	bind:this={anchor}
	type="button"
	class="badge-trigger variant-{variant}"
	class:open
	{disabled}
	aria-label={ariaLabel}
	aria-haspopup="listbox"
	aria-expanded={open}
	onclick={toggle}
>
	{#if variant === 'tone'}<span class="tone-dot" aria-hidden="true"></span>{/if}{label}
</button>

{#if open}
	<div
		bind:this={menuEl}
		role="listbox"
		class="badge-menu"
		style:top="{coords.top}px"
		style:left="{coords.left}px"
		style:min-width="{coords.minWidth}px"
	>
		{#each options as opt (opt.value)}
			<button
				type="button"
				role="option"
				class="badge-option tone-{opt.value}"
				class:selected={opt.value === value}
				aria-selected={opt.value === value}
				onclick={() => select(opt.value)}
			>
				{#if variant === 'tone'}<span class="tone-dot" aria-hidden="true"></span>{/if}{opt.label}
			</button>
		{/each}
	</div>
{/if}

<style>
	.badge-trigger {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 2px var(--spacing-sm);
		border: 1px solid var(--tone-border, var(--border-color));
		border-radius: var(--radius-sm);
		background-color: var(--tone-bg, var(--white-gray));
		color: var(--tone-family, var(--text-color-primary));
		font-size: 12px;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color var(--transition-default),
			border-color var(--transition-default),
			transform 100ms ease;
	}
	.badge-trigger:hover:not(:disabled) {
		filter: brightness(0.97);
	}
	.badge-trigger:active:not(:disabled) {
		transform: scale(0.97);
	}
	.badge-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.badge-trigger.variant-mode {
		--tone-bg: var(--white-gray);
		--tone-border: var(--border-color);
		--tone-family: var(--text-color-primary);
	}
	.tone-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: var(--tone-family);
		flex-shrink: 0;
	}
	.badge-menu {
		position: fixed;
		z-index: 40;
		display: flex;
		flex-direction: column;
		padding: 4px;
		gap: 2px;
		max-height: 200px;
		overflow-y: auto;
		background: var(--surface);
		border: var(--border-default);
		border-radius: var(--radius-sm);
		box-shadow: var(--regular-shadow);
		animation: scaleIn 120ms ease;
	}
	.badge-option {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 6px 10px;
		border: none;
		border-radius: 4px;
		background: none;
		color: var(--text-color-primary);
		font-size: 13px;
		text-align: left;
		cursor: pointer;
	}
	.badge-option:hover {
		background: var(--tint);
	}
	.badge-option.selected {
		background: var(--tint);
		color: var(--primary-color);
		font-weight: 700;
	}
	.badge-option.tone-error {
		--tone-family: var(--status-error);
	}
	.badge-option.tone-success {
		--tone-family: var(--status-success);
	}
	.badge-option.tone-info {
		--tone-family: var(--status-info);
	}
	.badge-option.tone-warning {
		--tone-family: var(--status-warning);
	}
	.badge-option.tone-neutral {
		--tone-family: var(--status-neutral);
	}
	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.badge-trigger,
		.badge-menu {
			transition: none;
			animation: none;
		}
	}
</style>
