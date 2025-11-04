import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { notifications } from '$lib/stores/notifications.js';

export const actions = {
	default: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);
		notifications.info('You have been logged out.');

		return redirect(302, '/login');
	}
};
