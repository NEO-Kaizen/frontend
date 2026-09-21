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
	addUser: 'person_add',
	close: 'close',
	sort: 'sort',
	expandMore: 'arrow_drop_down',
	expandLess: 'arrow_drop_up',
	userList: 'manage_accounts',
	doNotDisturb: 'do_not_disturb_on',
	block: 'block',
	priority: 'priority_high',
	autorenew: 'autorenew',
	edit: 'edit',
	more: 'more_vert',
	lock: 'lock',
	lockOpen: 'lock_open',
	visibility: 'visibility',
	visibilityOff: 'visibility_off',
	arrowForward: 'arrow_forward',
	arrowBack: 'arrow_back',
	adminPanel: 'admin_panel_settings',
	calendarCheck: 'event_available',
	category: 'category',
	security: 'security',
	email: 'mail',
	group: 'group',
	userApproved: 'person_check',
	pending: 'pending',
	palette: 'palette',
	calculate: 'calculate',
	link: 'link',
	info: 'info',
	warning: 'warning',
	error: 'error',
	check: 'check',
	person: 'person',
	description: 'description',
	send: 'send',
	cloudUpload: 'cloud_upload',
	delete: 'delete',
	dragIndicator: 'drag_indicator',
	calendarMonth: 'calendar_month',
	validate: 'verified',
	reopen: 'replay',
	inbox: 'inbox',
	flag: 'flag',
	lightMode: 'light_mode',
	darkMode: 'dark_mode',
	content_copy: 'content_copy'
} as const;

export type IconName = keyof typeof iconDictionary;
