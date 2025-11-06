import { ActivityLogService } from '$lib/server/activity-log';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user;

	if (!user) {
		throw new Error('User not authenticated');
	}

	// Pagination
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 25;
	const offset = (page - 1) * limit;

	// Query user's activity logs
	const activities = await ActivityLogService.query({
		userId: user.id,
		limit,
		offset
	});

	// Get total count
	const totalActivities = await ActivityLogService.query({
		userId: user.id,
		limit: 1000000
	});

	return {
		activities,
		pagination: {
			page,
			limit,
			total: totalActivities.length,
			totalPages: Math.ceil(totalActivities.length / limit)
		}
	};
};
