import type { IconName } from '$lib/types/icons';

export type MetricTone = 'indigo' | 'green' | 'blue' | 'neutral' | 'orange' | 'danger';

export interface MetricItem {
	label: string;
	value: string | number;
	iconName: IconName;
	tone: MetricTone;
}
