import type { Permission, PermissionKey, PermissionCustody } from './permission';

export interface Profile {
	id: string;
	name: string;
	description: string | null;
	isActive: boolean;
	isRoot: boolean;
	isAssignableTriage: boolean;
	isAssignableMapping: boolean;
	userCount: number;
	permissions: Permission[];
}

export interface ProfileKeyDefinition {
	key: PermissionKey;
	custodyType: 'global' | 'custodial';
	allowedCustodies: PermissionCustody[];
	dependencies: PermissionKey[];
}

export interface ProfileKeyCatalog {
	permissions: ProfileKeyDefinition[];
	assignabilityPredicates: {
		triage: PermissionKey[];
		mapping: PermissionKey[];
	};
}

export interface ProfilePermissionInput {
	key: PermissionKey;
	custody: PermissionCustody;
}

export interface ProfileCreateInput {
	name: string;
	description?: string | null;
	isAssignableTriage?: boolean;
	isAssignableMapping?: boolean;
	permissions: ProfilePermissionInput[];
}

export interface ProfileUpdateInput {
	name?: string;
	description?: string | null;
	isAssignableTriage?: boolean;
	isAssignableMapping?: boolean;
	permissions?: ProfilePermissionInput[];
}

export interface ProfileStatusResponse {
	id: string;
	isActive: boolean;
}

export interface DuplicateProfileInput {
	name: string;
	description?: string | null;
}
