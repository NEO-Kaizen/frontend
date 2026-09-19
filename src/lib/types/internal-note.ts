import type { UserType } from './user';

export type InternalNoteAuthorRole = Exclude<UserType, 'Solicitante'>;

export interface InternalNoteAuthor {
	id: string;
	name: string;
	role: InternalNoteAuthorRole;
}

export interface InternalNote {
	id: string;
	content: string;
	createdAt: string;
	author: InternalNoteAuthor;
}

export interface InternalNotesResponse {
	items: InternalNote[];
	unseenCount: number;
}

export interface CreateInternalNotePayload {
	content: string;
}

export interface MarkInternalNotesReadPayload {
	lastReadNoteId: string;
}

export const INTERNAL_NOTE_MAX_LENGTH = 4000;
