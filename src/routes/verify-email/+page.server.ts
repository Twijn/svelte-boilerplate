import { verifyEmailToken } from '$lib/server/email-verification';
import { ActivityLogService, ActivityCategory } from '$lib/server/activity-log';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, getClientAddress, request }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return {
			success: false,
			message: 'No verification token provided'
		};
	}

	const result = await verifyEmailToken(token);

	if (result.success && result.userId) {
		// Log successful verification
		await ActivityLogService.log({
			userId: result.userId,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent'),
			action: 'user.email.verify',
			category: ActivityCategory.AUTH,
			message: 'User verified their email address',
			resourceType: 'user',
			resourceId: result.userId
		});

		// Redirect to panel after successful verification
		throw redirect(302, '/panel?verified=true');
	}

	return {
		success: result.success,
		message: result.error || 'Email verification failed'
	};
};
