import { mockPortalConfig } from '../data/portal-config';
import { jsonResponse } from '../http';

export function get(): Response {
	return jsonResponse(mockPortalConfig);
}
