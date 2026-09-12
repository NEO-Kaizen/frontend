/**
 * Icon sizes:
 * - `sm`: 16px
 * - `md`: 20px
 * - `lg`: 24px
 * - `xl`: 32px
 */
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

//Mais fácil manter aqui por hora, mas se tivermos separações de outras coisas similares, movemos
export const iconDictionary = {
	centralQueue: 'featured_play_list',
	history: 'history',
	home: 'home',
	manageUsers: 'user_attributes',
	search: 'search',
	login: 'login',
	logout: 'logout',
	settings: 'settings',
	filter: 'filter_alt',
	filterList: 'filter_list',
	queueSummary: 'article',
	queueChart: 'analytics',
	addCircle: 'add_circle',
	close: 'close',
	sort: 'sort',
	expandMore: 'arrow_drop_down',
	expandLess: 'arrow_drop_up',
	userList: 'manage_accounts',
	doNotDisturb: 'do_not_disturb_on',
	block: 'block',
	priority: 'priority_high',
	edit: 'edit',
	more: 'more_vert',
	lock: 'lock',
	visibility: 'visibility',
	visibilityOff: 'visibility_off',
	arrowForward: 'arrow_forward',
	arrowBack: 'arrow_back',
	adminPanel: 'admin_panel_settings',
	calendarCheck: 'event_available',
	security: 'security',
	email: 'mail',
	group: 'group',
	userApproved: 'person_check',
	pending: 'pending',
	calculate: 'calculate',
	link: 'link',
	info: 'info',
	check: 'check',
	person: 'person',
	description: 'description',
	send: 'send',
	cloudUpload: 'cloud_upload',
	delete: 'delete',
	calendarMonth: 'calendar_month',
	content_copy: 'content_copy'
} as const;

export type IconName = keyof typeof iconDictionary;
