import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Fetch fresh user data with all profile fields
	const users = await db.select().from(table.user).where(eq(table.user.id, locals.user.id));

	if (users.length === 0) {
		throw redirect(302, '/login');
	}

	return {
		user: users[0]
	};
};
