import type { Profile } from '$lib/types/profile';

export type ProfileView = {
	source: Profile;
	id: string;
	name: string;
	description: string;
	composition: Profile['permissions'];
	isRoot: boolean;
	isActive: boolean;
	isAssignableTriage: boolean;
	isAssignableMapping: boolean;
	userCount: number;
};

export type EditorMode = 'create' | 'edit' | 'duplicate';
