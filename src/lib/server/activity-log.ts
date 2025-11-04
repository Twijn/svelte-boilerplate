import { db } from './db';
import * as table from './db/schema';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

/**
 * Activity categories for organizing logs
 */
export enum ActivityCategory {
	AUTH = 'auth',
	USER = 'user',
	ROLE = 'role',
	PERMISSION = 'permission',
	SECURITY = 'security',
	SYSTEM = 'system',
	API = 'api',
	DATABASE = 'database'
}

/**
 * Log severity levels
 */
export enum LogSeverity {
	DEBUG = 'debug',
	INFO = 'info',
	WARNING = 'warning',
	ERROR = 'error',
	CRITICAL = 'critical'
}

/**
 * Common action types for consistency
 */
export const ActivityActions = {
	// Authentication
	LOGIN: 'user.login',
	LOGIN_FAILED: 'user.login.failed',
	LOGOUT: 'user.logout',
	REGISTER: 'user.register',
	PASSWORD_RESET_REQUEST: 'user.password_reset.request',
	PASSWORD_RESET_COMPLETE: 'user.password_reset.complete',
	PASSWORD_CHANGE: 'user.password.change',

	// User management
	USER_CREATE: 'user.create',
	USER_UPDATE: 'user.update',
	USER_DELETE: 'user.delete',
	USER_LOCK: 'user.lock',
	USER_UNLOCK: 'user.unlock',

	// Role management
	ROLE_CREATE: 'role.create',
	ROLE_UPDATE: 'role.update',
	ROLE_DELETE: 'role.delete',
	ROLE_ASSIGN: 'role.assign',
	ROLE_REVOKE: 'role.revoke',

	// Permission management
	PERMISSION_GRANT: 'permission.grant',
	PERMISSION_REVOKE: 'permission.revoke',

	// Security
	RATE_LIMIT_CHECK: 'security.rate_limit.check',
	RATE_LIMIT_EXCEEDED: 'security.rate_limit.exceeded',
	ACCOUNT_LOCKED: 'security.account.locked',
	SUSPICIOUS_ACTIVITY: 'security.suspicious',

	// System
	SYSTEM_START: 'system.start',
	SYSTEM_ERROR: 'system.error',
	DATABASE_MIGRATION: 'system.database.migration'
} as const;

/**
 * Options for logging an activity
 */
export interface LogActivityOptions {
	// Actor information
	userId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;

	// Action details
	action: string;
	category: ActivityCategory;
	severity?: LogSeverity;

	// Resource affected
	resourceType?: string | null;
	resourceId?: string | null;

	// Context
	metadata?: Record<string, unknown>;
	message?: string | null;

	// Status
	success?: boolean;
	errorMessage?: string | null;

	// Performance
	duration?: number; // in milliseconds
}

/**
 * Query options for retrieving activity logs
 */
export interface QueryActivityOptions {
	userId?: string;
	ipAddress?: string;
	action?: string;
	category?: ActivityCategory;
	severity?: LogSeverity;
	resourceType?: string;
	resourceId?: string;
	success?: boolean;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
	offset?: number;
}

/**
 * Activity Log Service
 * Provides a modular way to log all activities across the application
 */
export class ActivityLogService {
	/**
	 * Log an activity
	 */
	static async log(options: LogActivityOptions): Promise<string> {
		const bytes = crypto.getRandomValues(new Uint8Array(10));
		const id = encodeBase32LowerCase(bytes);

		await db.insert(table.activityLog).values({
			id,
			userId: options.userId ?? null,
			ipAddress: options.ipAddress ?? null,
			userAgent: options.userAgent ?? null,
			action: options.action,
			category: options.category,
			severity: options.severity ?? LogSeverity.INFO,
			resourceType: options.resourceType ?? null,
			resourceId: options.resourceId ?? null,
			metadata: options.metadata ?? null,
			message: options.message ?? null,
			success: options.success ?? true,
			errorMessage: options.errorMessage ?? null,
			duration: options.duration?.toString() ?? null,
			createdAt: new Date()
		});

		return id;
	}

	/**
	 * Convenience method for logging successful actions
	 */
	static async logSuccess(
		action: string,
		category: ActivityCategory,
		options?: Partial<LogActivityOptions>
	): Promise<string> {
		return this.log({
			action,
			category,
			success: true,
			severity: LogSeverity.INFO,
			...options
		});
	}

	/**
	 * Convenience method for logging failures
	 */
	static async logFailure(
		action: string,
		category: ActivityCategory,
		errorMessage: string,
		options?: Partial<LogActivityOptions>
	): Promise<string> {
		return this.log({
			action,
			category,
			success: false,
			errorMessage,
			severity: LogSeverity.ERROR,
			...options
		});
	}

	/**
	 * Log a security event
	 */
	static async logSecurity(
		action: string,
		options: Partial<LogActivityOptions> & { severity?: LogSeverity }
	): Promise<string> {
		return this.log({
			action,
			category: ActivityCategory.SECURITY,
			severity: options.severity ?? LogSeverity.WARNING,
			...options
		});
	}

	/**
	 * Query activity logs with filters
	 */
	static async query(options: QueryActivityOptions = {}): Promise<table.ActivityLog[]> {
		let query = db.select().from(table.activityLog);

		const conditions = [];

		if (options.userId) {
			conditions.push(eq(table.activityLog.userId, options.userId));
		}
		if (options.ipAddress) {
			conditions.push(eq(table.activityLog.ipAddress, options.ipAddress));
		}
		if (options.action) {
			conditions.push(eq(table.activityLog.action, options.action));
		}
		if (options.category) {
			conditions.push(eq(table.activityLog.category, options.category));
		}
		if (options.severity) {
			conditions.push(eq(table.activityLog.severity, options.severity));
		}
		if (options.resourceType) {
			conditions.push(eq(table.activityLog.resourceType, options.resourceType));
		}
		if (options.resourceId) {
			conditions.push(eq(table.activityLog.resourceId, options.resourceId));
		}
		if (options.success !== undefined) {
			conditions.push(eq(table.activityLog.success, options.success));
		}
		if (options.startDate) {
			conditions.push(gte(table.activityLog.createdAt, options.startDate));
		}
		if (options.endDate) {
			conditions.push(lte(table.activityLog.createdAt, options.endDate));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as typeof query;
		}

		// Order by most recent first
		query = query.orderBy(sql`${table.activityLog.createdAt} DESC`) as typeof query;

		// Apply pagination
		if (options.limit) {
			query = query.limit(options.limit) as typeof query;
		}
		if (options.offset) {
			query = query.offset(options.offset) as typeof query;
		}

		return await query;
	}

	/**
	 * Get activity logs for a specific user
	 */
	static async getUserActivity(userId: string, limit: number = 50): Promise<table.ActivityLog[]> {
		return this.query({ userId, limit });
	}

	/**
	 * Get recent security events
	 */
	static async getSecurityEvents(limit: number = 100): Promise<table.ActivityLog[]> {
		return this.query({
			category: ActivityCategory.SECURITY,
			limit
		});
	}

	/**
	 * Get failed login attempts
	 */
	static async getFailedLogins(
		startDate?: Date,
		endDate?: Date,
		limit: number = 100
	): Promise<table.ActivityLog[]> {
		return this.query({
			action: ActivityActions.LOGIN_FAILED,
			startDate,
			endDate,
			limit
		});
	}

	/**
	 * Get rate limit violations
	 */
	static async getRateLimitViolations(
		ipAddress?: string,
		startDate?: Date,
		limit: number = 100
	): Promise<table.ActivityLog[]> {
		return this.query({
			action: ActivityActions.RATE_LIMIT_EXCEEDED,
			ipAddress,
			startDate,
			limit
		});
	}

	/**
	 * Count activities matching criteria
	 */
	static async count(options: QueryActivityOptions = {}): Promise<number> {
		let query = db.select({ count: sql<number>`count(*)` }).from(table.activityLog);

		const conditions = [];

		if (options.userId) {
			conditions.push(eq(table.activityLog.userId, options.userId));
		}
		if (options.action) {
			conditions.push(eq(table.activityLog.action, options.action));
		}
		if (options.category) {
			conditions.push(eq(table.activityLog.category, options.category));
		}
		if (options.severity) {
			conditions.push(eq(table.activityLog.severity, options.severity));
		}
		if (options.success !== undefined) {
			conditions.push(eq(table.activityLog.success, options.success));
		}
		if (options.startDate) {
			conditions.push(gte(table.activityLog.createdAt, options.startDate));
		}
		if (options.endDate) {
			conditions.push(lte(table.activityLog.createdAt, options.endDate));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as typeof query;
		}

		const result = await query;
		return result[0]?.count ?? 0;
	}

	/**
	 * Clean up old logs (for maintenance)
	 */
	static async cleanup(olderThanDays: number = 90): Promise<void> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		await db.delete(table.activityLog).where(sql`${table.activityLog.createdAt} < ${cutoffDate}`);
	}

	/**
	 * Delete all logs for a user (GDPR compliance)
	 */
	static async deleteUserLogs(userId: string): Promise<void> {
		await db.delete(table.activityLog).where(eq(table.activityLog.userId, userId));
	}

	/**
	 * Get activity statistics
	 */
	static async getStats(startDate?: Date, endDate?: Date) {
		const conditions = [];
		if (startDate) {
			conditions.push(gte(table.activityLog.createdAt, startDate));
		}
		if (endDate) {
			conditions.push(lte(table.activityLog.createdAt, endDate));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [totalCount, successCount, failureCount, byCategoryResult, bySeverityResult] =
			await Promise.all([
				// Total count
				db
					.select({ count: sql<number>`count(*)` })
					.from(table.activityLog)
					.where(whereClause)
					.then((r) => r[0]?.count ?? 0),

				// Success count
				db
					.select({ count: sql<number>`count(*)` })
					.from(table.activityLog)
					.where(
						whereClause
							? and(whereClause, eq(table.activityLog.success, true))
							: eq(table.activityLog.success, true)
					)
					.then((r) => r[0]?.count ?? 0),

				// Failure count
				db
					.select({ count: sql<number>`count(*)` })
					.from(table.activityLog)
					.where(
						whereClause
							? and(whereClause, eq(table.activityLog.success, false))
							: eq(table.activityLog.success, false)
					)
					.then((r) => r[0]?.count ?? 0),

				// By category
				db
					.select({
						category: table.activityLog.category,
						count: sql<number>`count(*)`
					})
					.from(table.activityLog)
					.where(whereClause)
					.groupBy(table.activityLog.category),

				// By severity
				db
					.select({
						severity: table.activityLog.severity,
						count: sql<number>`count(*)`
					})
					.from(table.activityLog)
					.where(whereClause)
					.groupBy(table.activityLog.severity)
			]);

		return {
			total: totalCount,
			successful: successCount,
			failed: failureCount,
			byCategory: byCategoryResult.reduce(
				(acc, { category, count }) => {
					acc[category] = count;
					return acc;
				},
				{} as Record<string, number>
			),
			bySeverity: bySeverityResult.reduce(
				(acc, { severity, count }) => {
					acc[severity] = count;
					return acc;
				},
				{} as Record<string, number>
			)
		};
	}
}
