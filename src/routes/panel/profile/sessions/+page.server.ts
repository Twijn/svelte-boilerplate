import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, gt, ne } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		throw new Error('User not authenticated');
	}

	// Fetch active sessions
	const sessions = await db
		.select()
		.from(table.session)
		.where(and(eq(table.session.userId, user.id), gt(table.session.expiresAt, new Date())));

	return {
		sessions,
		currentSessionId: locals.session?.id
	};
};

export const actions: Actions = {
	revokeSession: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const sessionId = formData.get('sessionId') as string;

		if (!sessionId) {
			return fail(400, { message: 'Session ID is required', success: false });
		}

		try {
			// Verify the session belongs to the user
			const sessions = await db
				.select()
				.from(table.session)
				.where(and(eq(table.session.id, sessionId), eq(table.session.userId, locals.user.id)));

			if (sessions.length === 0) {
				return fail(404, { message: 'Session not found', success: false });
			}

			// Delete the session
			await db.delete(table.session).where(eq(table.session.id, sessionId));

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.session.revoke',
				category: ActivityCategory.SECURITY,
				message: 'User revoked a session',
				resourceType: 'session',
				resourceId: sessionId
			});

			return {
				success: true,
				message: 'Session revoked successfully',
				action: 'revokeSession'
			};
		} catch (error) {
			console.error('Session revoke error:', error);
			return fail(500, {
				message: 'Failed to revoke session',
				success: false
			});
		}
	},

	revokeAllSessions: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		try {
			// Get current session ID to keep it
			const currentSessionId = locals.session?.id;

			if (!currentSessionId) {
				return fail(400, { message: 'No active session', success: false });
			}

			// Delete all sessions except current one
			await db
				.delete(table.session)
				.where(
					and(eq(table.session.userId, locals.user.id), ne(table.session.id, currentSessionId))
				);

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.session.revoke_all',
				category: ActivityCategory.SECURITY,
				message: 'User revoked all other sessions'
			});

			return {
				success: true,
				message: 'All other sessions have been revoked',
				action: 'revokeAllSessions'
			};
		} catch (error) {
			console.error('Revoke all sessions error:', error);
			return fail(500, {
				message: 'Failed to revoke sessions',
				success: false
			});
		}
	}
};
