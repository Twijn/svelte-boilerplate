import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { deleteUploadedFile } from '$lib/server/file-upload';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';

export const actions: Actions = {
	disableAccount: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		try {
			// Delete all sessions to log the user out everywhere
			await db.delete(table.session).where(eq(table.session.userId, locals.user.id));

			// Disable the account
			await db
				.update(table.user)
				.set({
					isDisabled: true,
					disabledAt: new Date(),
					disabledBy: locals.user.id,
					disableReason: 'Account disabled by user'
				})
				.where(eq(table.user.id, locals.user.id));

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.account.disable',
				category: ActivityCategory.USER,
				message: 'User disabled their account',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			return {
				success: true,
				message: 'Account disabled successfully'
			};
		} catch (error) {
			console.error('Error disabling account:', error);
			return fail(500, {
				message: 'Failed to disable account. Please try again.',
				success: false
			});
		}
	},

	deleteAccount: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		try {
			// Delete avatar file if it exists
			if (locals.user.avatar) {
				await deleteUploadedFile(locals.user.avatar);
			}

			// Delete in the correct order to handle foreign key constraints
			// 1. Delete sessions (no cascade)
			await db.delete(table.session).where(eq(table.session.userId, locals.user.id));

			// 2. Delete password reset tokens (has cascade but just to be safe)
			await db
				.delete(table.passwordResetToken)
				.where(eq(table.passwordResetToken.userId, locals.user.id));

			// 3. Delete email change tokens (has cascade but just to be safe)
			await db
				.delete(table.emailChangeToken)
				.where(eq(table.emailChangeToken.userId, locals.user.id));

			// 4. Delete user roles (has cascade, but assignedBy field doesn't have onDelete set)
			await db.delete(table.userRole).where(eq(table.userRole.userId, locals.user.id));

			// 5. Delete user node permissions (has cascade)
			await db
				.delete(table.userNodePermission)
				.where(eq(table.userNodePermission.userId, locals.user.id));

			// 6. Log activity before final deletion (will be set to null when user is deleted)
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.account.delete',
				category: ActivityCategory.USER,
				message: 'User deleted their account',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			// 7. Finally, delete the user (this will set activityLog.userId to null due to onDelete: 'set null')
			await db.delete(table.user).where(eq(table.user.id, locals.user.id));
		} catch (error) {
			console.error('Error deleting account:', error);
			return fail(500, {
				message: 'Failed to delete account. Please try again or contact support.',
				success: false
			});
		}

		// Redirect to home page after successful deletion
		throw redirect(302, '/');
	}
};
