import { redirect } from '@sveltejs/kit';
import { PermissionService } from '$lib/server/permissions';

export const load = async ({ locals }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	// Get user permissions
	const userPermissions = await PermissionService.getUserPermissions(locals.user.id);

	return {
		user: locals.user,
		userPermissions
	};
};
