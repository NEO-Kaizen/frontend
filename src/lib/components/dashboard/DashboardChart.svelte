<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Chart, ChartConfiguration, ChartType } from 'chart.js';

	type DashboardChartType = Extract<ChartType, 'bar' | 'line' | 'doughnut'>;

	interface Props {
		type: DashboardChartType;
		labels: string[];
		values: number[];
		colors: string[];
		textColor: string;
		gridColor: string;
		ariaLabel: string;
		horizontal?: boolean;
		height?: number;
	}

	let {
		type,
		labels,
		values,
		colors,
		textColor,
		gridColor,
		ariaLabel,
		horizontal = false,
		height = 320
	}: Props = $props();

	let canvas = $state<HTMLCanvasElement>();
	let chart = $state.raw<Chart<DashboardChartType, number[], string>>();

	function buildConfiguration(): ChartConfiguration<DashboardChartType, number[], string> {
		return {
			type,
			data: {
				labels,
				datasets: [
					{
						data: values,
						backgroundColor: colors,
						borderColor: colors,
						borderWidth: type === 'line' ? 2 : 1,
						tension: type === 'line' ? 0.3 : 0,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				color: textColor,
				borderColor: gridColor,
				indexAxis: horizontal ? 'y' : 'x',
				plugins: {
					legend: {
						display: type === 'doughnut',
						position: 'bottom',
						labels: { color: textColor }
					},
					tooltip: { enabled: true }
				},
				scales:
					type === 'doughnut'
						? undefined
						: {
								x: {
									beginAtZero: true,
									grid: { color: gridColor },
									ticks: { color: textColor, precision: 0 }
								},
								y: {
									beginAtZero: true,
									grid: { color: gridColor },
									ticks: { color: textColor, precision: 0 }
								}
							}
			}
		};
	}

	onMount(async () => {
		if (!canvas) return;

		const chartModule = await import('chart.js');
		chartModule.Chart.register(...chartModule.registerables);
		chart = new chartModule.Chart(canvas, buildConfiguration());
	});

	$effect(() => {
		if (!chart) return;

		const dataset = chart.data.datasets[0];
		chart.data.labels = labels;
		if (dataset) {
			dataset.data = values;
			dataset.backgroundColor = colors;
			dataset.borderColor = colors;
		}
		chart.options.color = textColor;
		chart.options.borderColor = gridColor;

		const legend = chart.options.plugins?.legend;
		if (legend?.labels) legend.labels.color = textColor;

		for (const scale of Object.values(chart.options.scales ?? {})) {
			if (!scale) continue;
			if (scale.ticks) scale.ticks.color = textColor;
			if (scale.grid) scale.grid.color = gridColor;
		}
		chart.update();
	});

	onDestroy(() => chart?.destroy());
</script>

<div class="chart-container" style:height={`${height}px`}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<table class="sr-only">
	<caption>{ariaLabel}</caption>
	<thead>
		<tr>
			<th scope="col">Categoria</th>
			<th scope="col">Quantidade</th>
		</tr>
	</thead>
	<tbody>
		{#each labels as label, index (label)}
			<tr>
				<th scope="row">{label}</th>
				<td>{values[index] ?? 0}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		min-height: 280px;
	}
</style>
