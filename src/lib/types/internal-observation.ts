export interface InternalObservationAuthor {
	id: string;
	name: string;
	role: string;
}

export interface InternalObservation {
	id: string;
	content: string;
	author: InternalObservationAuthor;
	createdAt: string;
}

export interface InternalObservationsData {
	observations: InternalObservation[];
}

export interface CreateInternalObservationPayload {
	content: string;
}
