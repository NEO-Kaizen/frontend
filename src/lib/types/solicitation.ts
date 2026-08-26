export interface SolicitationMeeting {
	date: string;
	link?: string;
}

export interface SolicitationDetail {
	protocol: string;
	title: string;
	statusLabel: string;
	technicalResponsible: string;
	openingDate: string;
	completionForecast: string;
	lastUpdate: string;
	meeting?: SolicitationMeeting;
	lastMessage?: string;
}