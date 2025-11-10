import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { getAllConfigs, setConfig, resetConfig } from '$lib/server/config';
import { PermissionService, PERMISSIONS } from '$lib/server/permissions';
import { ActivityLogService, ActivityActions, ActivityCategory } from '$lib/server/activity-log';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		throw redirect(302, '/login');
	}

	// Check if user has permission to view config
	const canView = await PermissionService.hasPermission(user.id, PERMISSIONS.VIEW_CONFIG);
	const canEdit = await PermissionService.hasPermission(user.id, PERMISSIONS.EDIT_CONFIG);

	if (!canView) {
		throw redirect(302, '/unauthorized');
	}

	// Get all configuration variables
	const configs = await getAllConfigs();

	// Group configs by category
	const grouped = configs.reduce(
		(acc, config) => {
			if (!acc[config.category]) {
				acc[config.category] = [];
			}
			acc[config.category].push(config);
			return acc;
		},
		{} as Record<string, typeof configs>
	);

	return {
		configs,
		grouped,
		canEdit
	};
};

export const actions: Actions = {
	update: async ({ locals, request }) => {
		const user = locals.user;

		if (!user) {
			return fail(401, { error: 'Authentication required' });
		}

		const canEdit = await PermissionService.hasPermission(user.id, PERMISSIONS.EDIT_CONFIG);
		if (!canEdit) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const formData = await request.formData();
		const key = formData.get('key') as string;
		const value = formData.get('value');
		const type = formData.get('type') as string;

		if (!key) {
			return fail(400, { error: 'Missing config key' });
		}

		// Parse value based on type
		let parsedValue: unknown;
		if (type === 'number') {
			parsedValue = Number(value);
		} else if (type === 'boolean') {
			parsedValue = value === 'true';
		} else if (type === 'json') {
			try {
				parsedValue = JSON.parse(value as string);
			} catch {
				return fail(400, { error: 'Invalid JSON value' });
			}
		} else {
			parsedValue = value;
		}

		const result = await setConfig(key, parsedValue, user.id);
		if (!result.success) {
			return fail(400, { error: result.error || 'Failed to update configuration' });
		}

		// Log the configuration change
		await ActivityLogService.log({
			userId: user.id,
			action: ActivityActions.CONFIG_UPDATE,
			category: ActivityCategory.SYSTEM,
			metadata: { key, value: parsedValue, action: 'update' },
			message: `Configuration "${key}" updated`
		});

		return { success: true, message: 'Configuration updated successfully' };
	},

	reset: async ({ locals, request }) => {
		const user = locals.user;

		if (!user) {
			return fail(401, { error: 'Authentication required' });
		}

		const canEdit = await PermissionService.hasPermission(user.id, PERMISSIONS.EDIT_CONFIG);
		if (!canEdit) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const formData = await request.formData();
		const key = formData.get('key') as string;

		if (!key) {
			return fail(400, { error: 'Missing config key' });
		}

		const success = await resetConfig(key, user.id);
		if (!success) {
			return fail(500, { error: 'Failed to reset configuration' });
		}

		// Log the configuration change
		await ActivityLogService.log({
			userId: user.id,
			action: ActivityActions.CONFIG_UPDATE,
			category: ActivityCategory.SYSTEM,
			metadata: { key, action: 'reset' },
			message: `Configuration "${key}" reset to default`
		});

		return { success: true, message: 'Configuration reset successfully' };
	}
};
