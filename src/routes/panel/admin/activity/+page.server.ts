import {
	ActivityLogService,
	ActivityCategory,
	LogSeverity,
	type QueryActivityOptions
} from '$lib/server/activity-log';
import { requireAdmin } from '$lib/server/permission-middleware';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireAdmin(locals.user?.id || null);

	// Pagination
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const offset = (page - 1) * limit;

	// Filters
	const userId = url.searchParams.get('userId') || undefined;
	const action = url.searchParams.get('action') || undefined;
	const category = url.searchParams.get('category') || undefined;
	const severity = url.searchParams.get('severity') || undefined;
	const success = url.searchParams.get('success');
	const dateFrom = url.searchParams.get('dateFrom') || undefined;
	const dateTo = url.searchParams.get('dateTo') || undefined;

	// Build filter object
	const filters: QueryActivityOptions = {};
	if (userId) filters.userId = userId;
	if (action) filters.action = action;
	if (category) filters.category = category as ActivityCategory;
	if (severity) filters.severity = severity as LogSeverity;
	if (success !== null) filters.success = success === 'true';
	if (dateFrom) filters.startDate = new Date(dateFrom);
	if (dateTo) filters.endDate = new Date(dateTo);

	// Query activity logs
	const activities = await ActivityLogService.query({
		...filters,
		limit,
		offset
	});

	// Get total count for pagination
	const totalActivities = await ActivityLogService.query({
		...filters,
		limit: 1000000 // Large number to get all matching records
	});

	// Get filter options
	const stats = await ActivityLogService.getStats(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
		new Date()
	);

	return {
		activities,
		pagination: {
			page,
			limit,
			total: totalActivities.length,
			totalPages: Math.ceil(totalActivities.length / limit)
		},
		filters: {
			userId,
			action,
			category,
			severity,
			success: success !== null ? success === 'true' : undefined,
			dateFrom,
			dateTo
		},
		stats
	};
};
