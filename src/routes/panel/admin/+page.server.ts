import { requireAdmin } from '$lib/server/permission-middleware';
import { PermissionService } from '$lib/server/permissions';

export const load = async ({ locals }) => {
	await requireAdmin(locals.user?.id || null);

	const permissionService = new PermissionService();

	// Get some basic stats for the dashboard
	const [totalUsers, totalRoles] = await Promise.all([
		permissionService.getUserCount(),
		permissionService.getRoleCount()
	]);

	return {
		stats: {
			totalUsers,
			totalRoles
		}
	};
};
