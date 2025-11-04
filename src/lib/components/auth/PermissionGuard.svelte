<script lang="ts">
	/**
	 * Component to conditionally render content based on user permissions.
	 * Usage:
	 * <PermissionGuard {userPermissions} requiredPermissions={['admin']}>
	 *   <p>Admin only content</p>
	 * </PermissionGuard>
	 */

	import { PERMISSIONS } from '$lib/constants/permissions';

	interface Props {
		userPermissions?: string[];
		requiredPermissions?: string[];
		requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission.
		fallback?: any; // Snippet to render if permission check fails
		children: any;
	}

	const {
		userPermissions = [],
		requiredPermissions = [],
		requireAll = false,
		fallback,
		children
	}: Props = $props();

	// Check if user has the required permissions
	const hasPermission = $derived(() => {
		if (!requiredPermissions.length) return true;
		if (!userPermissions.length) return false;

		// Admin users have access to everything
		if (userPermissions.includes(PERMISSIONS.ADMIN)) return true;

		if (requireAll) {
			return requiredPermissions.every((permission) => userPermissions.includes(permission));
		} else {
			return requiredPermissions.some((permission) => userPermissions.includes(permission));
		}
	});
</script>

{#if hasPermission()}
	{@render children()}
{:else if fallback}
	{@render fallback()}
{/if}
