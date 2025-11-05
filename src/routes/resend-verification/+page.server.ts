import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { resendVerificationEmail } from '$lib/server/email-verification';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';

export const actions: Actions = {
	default: async ({ locals, url }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized', success: false });
		}

		if (locals.user.emailVerified) {
			return fail(400, { message: 'Email already verified', success: false });
		}

		try {
			const result = await resendVerificationEmail(locals.user.id, url.origin);

			if (!result.success) {
				return fail(400, {
					message: result.error || 'Failed to resend verification email',
					success: false
				});
			}

			// Log activity
			await ActivityLogService.log({
				userId: locals.user.id,
				action: 'user.email.resend_verification',
				category: ActivityCategory.AUTH,
				message: 'User requested new verification email',
				resourceType: 'user',
				resourceId: locals.user.id
			});

			return {
				success: true,
				message: 'Verification email sent! Please check your inbox.'
			};
		} catch (error) {
			console.error('Error resending verification email:', error);
			return fail(500, {
				message: 'Failed to resend verification email',
				success: false
			});
		}
	}
};
