import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { deleteUploadedFile } from '$lib/server/file-upload';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';

export const actions: Actions = {
	deleteAccount: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		// Delete avatar file if it exists
		if (locals.user.avatar) {
			await deleteUploadedFile(locals.user.avatar);
		}

		// Log activity before deletion
		await ActivityLogService.log({
			userId: locals.user.id,
			action: 'user.account.delete',
			category: ActivityCategory.USER,
			message: 'User deleted their account',
			resourceType: 'user',
			resourceId: locals.user.id
		});

		// Delete user's roles first
		await db.delete(table.userRole).where(eq(table.userRole.userId, locals.user.id));

		// Delete user's sessions
		await db.delete(table.session).where(eq(table.session.userId, locals.user.id));

		// Delete user
		await db.delete(table.user).where(eq(table.user.id, locals.user.id));

		// Redirect to home page after deletion
		throw redirect(302, '/');
	}
};
