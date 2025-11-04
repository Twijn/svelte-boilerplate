import { requireAdmin } from '$lib/server/permission-middleware';
import { AccountLockoutService } from '$lib/server/rate-limit';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals.user?.id || null);

	const lockedAccounts = await AccountLockoutService.getLockedAccounts();

	return {
		lockedAccounts
	};
};

export const actions: Actions = {
	unlock: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { message: 'User ID is required', success: false });
		}

		try {
			await AccountLockoutService.unlockAccount(userId);
			return { success: true, message: 'Account unlocked successfully' };
		} catch (error) {
			console.error('Error unlocking account:', error);
			return fail(500, { message: 'Failed to unlock account', success: false });
		}
	},

	lock: async ({ request, locals }) => {
		await requireAdmin(locals.user?.id || null);

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const permanent = formData.get('permanent') === 'true';

		if (!userId) {
			return fail(400, { message: 'User ID is required', success: false });
		}

		try {
			await AccountLockoutService.lockAccount(userId, permanent);
			return {
				success: true,
				message: permanent
					? 'Account permanently locked'
					: 'Account temporarily locked for 30 minutes'
			};
		} catch (error) {
			console.error('Error locking account:', error);
			return fail(500, { message: 'Failed to lock account', success: false });
		}
	}
};
