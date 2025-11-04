import { requireAdmin } from '$lib/server/permission-middleware';
import { PermissionService } from '$lib/server/permissions';
import { ActivityLogService } from '$lib/server/activity-log';

export const load = async ({ locals }) => {
	await requireAdmin(locals.user?.id || null);

	const permissionService = new PermissionService();

	// Get some basic stats for the dashboard
	const [totalUsers, totalRoles, recentActivity, securityEvents, activityStats] = await Promise.all(
		[
			permissionService.getUserCount(),
			permissionService.getRoleCount(),
			ActivityLogService.query({ limit: 20 }),
			ActivityLogService.getSecurityEvents(10),
			ActivityLogService.getStats(
				new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
				new Date()
			)
		]
	);

	// Get failed logins in last 24 hours
	const failedLoginsCount = await ActivityLogService.count({
		action: 'user.login.failed',
		startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
	});

	return {
		stats: {
			totalUsers,
			totalRoles,
			totalActivityToday: activityStats.total,
			failedLoginsToday: failedLoginsCount
		},
		recentActivity,
		securityEvents
	};
};
