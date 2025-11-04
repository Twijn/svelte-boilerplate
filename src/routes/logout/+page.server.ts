import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { notifications } from '$lib/stores/notifications.js';
import {
	ActivityLogService,
	ActivityCategory,
	ActivityActions,
	LogSeverity
} from '$lib/server/activity-log';

export const actions = {
	default: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}

		const userId = event.locals.user?.id;

		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);
		notifications.info('You have been logged out.');

		// Log logout
		if (userId) {
			await ActivityLogService.log({
				userId,
				ipAddress:
					event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
					event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent'),
				action: ActivityActions.LOGOUT,
				category: ActivityCategory.AUTH,
				severity: LogSeverity.INFO,
				message: 'User logged out',
				success: true
			});
		}

		return redirect(302, '/login');
	}
};
