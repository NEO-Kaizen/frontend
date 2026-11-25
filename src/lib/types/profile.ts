import type { Permission } from './permission';

export interface ProfileReference {
	id: string;
	name: string;
}

export interface ProfileSnapshot {
	id: string | null;
	name: string;
}

export interface Profile extends ProfileReference {
	description: string | null;
	isActive: boolean;
	isRoot: boolean;
	isAssignableTriage: boolean;
	isAssignableMapping: boolean;
	userCount: number;
	permissions: Permission[];
}
