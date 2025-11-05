import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify, hash } from '@node-rs/argon2';
import { validatePassword, invalidateUserSessions } from '$lib/server/auth';
import { ActivityLogService, ActivityCategory, ActivityActions } from '$lib/server/activity-log';

export const load: PageServerLoad = async ({ locals, url }) => {
	const required = url.searchParams.get('required') === 'true';
	return {
		required,
		user: locals.user
	};
};

export const actions: Actions = {
	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('currentPassword') as string;
		const newPassword = formData.get('newPassword') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		// Validate inputs
		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, {
				message: 'All fields are required',
				success: false
			});
		}

		if (newPassword !== confirmPassword) {
			return fail(400, {
				message: 'New passwords do not match',
				success: false
			});
		}

		if (!validatePassword(newPassword)) {
			return fail(400, {
				message: 'New password must be at least 6 characters',
				success: false
			});
		}

		try {
			// Fetch current user to verify password
			const users = await db.select().from(table.user).where(eq(table.user.id, locals.user.id));

			if (users.length === 0) {
				return fail(404, {
					message: 'User not found',
					success: false
				});
			}

			const user = users[0];

			// Verify current password
			const validPassword = await verify(user.passwordHash, currentPassword);
			if (!validPassword) {
				return fail(400, {
					message: 'Current password is incorrect',
					success: false
				});
			}

			// Hash new password
			const newPasswordHash = await hash(newPassword);

			// Update password and clear requirePasswordChange flag
			await db
				.update(table.user)
				.set({
					passwordHash: newPasswordHash,
					requirePasswordChange: false,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Invalidate all sessions except current one (force re-login on other devices)
			await invalidateUserSessions(locals.user.id, locals.session?.id);

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: ActivityActions.PASSWORD_CHANGE,
				category: ActivityCategory.AUTH,
				message: 'User changed their password',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			return {
				success: true,
				message: 'Password changed successfully. Other sessions have been logged out.',
				action: 'changePassword'
			};
		} catch (error) {
			console.error('Password change error:', error);
			return fail(500, {
				message: 'Failed to change password',
				success: false
			});
		}
	}
};
