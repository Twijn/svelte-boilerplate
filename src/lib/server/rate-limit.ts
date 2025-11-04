import { db } from './db';
import * as table from './db/schema';
import { eq } from 'drizzle-orm';
import { ActivityLogService, ActivityCategory, ActivityActions, LogSeverity } from './activity-log';

export interface RateLimitConfig {
	maxAttempts: number;
	windowMs: number; // Time window in milliseconds
	blockDurationMs?: number; // Optional: how long to block after exceeding limit
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
	login: {
		maxAttempts: 20, // Increased - let account lockout handle per-user security
		windowMs: 15 * 60 * 1000, // 15 minutes
		blockDurationMs: 15 * 60 * 1000 // Block for 15 minutes
	},
	register: {
		maxAttempts: 3,
		windowMs: 60 * 60 * 1000, // 1 hour
		blockDurationMs: 60 * 60 * 1000 // Block for 1 hour
	},
	'password-reset': {
		maxAttempts: 3,
		windowMs: 60 * 60 * 1000, // 1 hour
		blockDurationMs: 60 * 60 * 1000 // Block for 1 hour
	},
	'api-general': {
		maxAttempts: 100,
		windowMs: 60 * 1000 // 1 minute
	}
};

export class RateLimitService {
	/**
	 * Check if an identifier is rate limited for a specific action
	 */
	static async checkRateLimit(
		identifier: string,
		action: string
	): Promise<{ allowed: boolean; retryAfter?: number; attemptsRemaining?: number }> {
		const config = RATE_LIMIT_CONFIGS[action];
		if (!config) {
			throw new Error(`No rate limit configuration found for action: ${action}`);
		}

		const windowStart = new Date(Date.now() - config.windowMs);

		// Get attempts within the time window from activity log
		const attempts = await ActivityLogService.query({
			ipAddress: identifier,
			action: ActivityActions.RATE_LIMIT_CHECK,
			startDate: windowStart,
			limit: 1000 // Get all attempts in window
		});

		// Filter to just this specific action by checking metadata
		const relevantAttempts = attempts.filter(
			(log) =>
				log.metadata && (log.metadata as { rateLimitAction?: string }).rateLimitAction === action
		);

		const attemptsCount = relevantAttempts.length;

		if (attemptsCount >= config.maxAttempts) {
			// Log rate limit exceeded
			await ActivityLogService.logSecurity(ActivityActions.RATE_LIMIT_EXCEEDED, {
				ipAddress: identifier,
				severity: LogSeverity.WARNING,
				metadata: { action, attemptsCount, maxAttempts: config.maxAttempts },
				message: `Rate limit exceeded for action: ${action}`
			});

			// Calculate retry after time
			const oldestAttempt = relevantAttempts.reduce((oldest, current) =>
				current.createdAt < oldest.createdAt ? current : oldest
			);
			const retryAfter = Math.ceil(
				(oldestAttempt.createdAt.getTime() + config.windowMs - Date.now()) / 1000
			);

			return {
				allowed: false,
				retryAfter: Math.max(0, retryAfter),
				attemptsRemaining: 0
			};
		}

		return {
			allowed: true,
			attemptsRemaining: config.maxAttempts - attemptsCount
		};
	}

	/**
	 * Record a rate limit attempt
	 */
	static async recordAttempt(identifier: string, action: string): Promise<void> {
		await ActivityLogService.log({
			ipAddress: identifier,
			action: ActivityActions.RATE_LIMIT_CHECK,
			category: ActivityCategory.SECURITY,
			severity: LogSeverity.DEBUG,
			metadata: { rateLimitAction: action },
			message: `Rate limit check for: ${action}`
		});
	}

	/**
	 * Clear old rate limit attempts (cleanup job)
	 * Now handled by ActivityLogService.cleanup()
	 */
	static async cleanupOldAttempts(): Promise<void> {
		// Activity logs are cleaned up through ActivityLogService
		// This method kept for backward compatibility
		await ActivityLogService.cleanup(90); // Keep 90 days of logs
	}

	/**
	 * Clear rate limit attempts for a specific identifier and action
	 * Note: This now affects activity logs, use sparingly
	 */
	static async clearAttempts(identifier: string, action?: string): Promise<void> {
		// For rate limit clearing, we delete activity logs for this IP
		// This is a destructive operation and should only be used in development/testing
		const logs = await ActivityLogService.query({
			ipAddress: identifier,
			action: ActivityActions.RATE_LIMIT_CHECK,
			limit: 10000
		});

		if (action) {
			// Filter by specific rate limit action in metadata
			const logsToDelete = logs.filter(
				(log) =>
					log.metadata && (log.metadata as { rateLimitAction?: string }).rateLimitAction === action
			);
			for (const log of logsToDelete) {
				await db.delete(table.activityLog).where(eq(table.activityLog.id, log.id));
			}
		} else {
			// Delete all rate limit logs for this IP
			for (const log of logs) {
				await db.delete(table.activityLog).where(eq(table.activityLog.id, log.id));
			}
		}
	}

	/**
	 * Clear all rate limit attempts (useful for testing/debugging)
	 * WARNING: This deletes all rate limit activity logs
	 */
	static async clearAllAttempts(): Promise<void> {
		await db
			.delete(table.activityLog)
			.where(eq(table.activityLog.action, ActivityActions.RATE_LIMIT_CHECK));
	}
}

// Account lockout constants
export const ACCOUNT_LOCKOUT_CONFIG = {
	maxFailedAttempts: 5,
	lockoutDurationMs: 5 * 60 * 1000, // 5 minutes (reduced from 30)
	resetAttemptsAfterMs: 10 * 60 * 1000 // Reset counter after 10 minutes of no attempts
};

export class AccountLockoutService {
	/**
	 * Check if an account is locked
	 */
	static async isAccountLocked(userId: string): Promise<{
		locked: boolean;
		lockedUntil?: Date;
		reason?: string;
	}> {
		const user = await db.select().from(table.user).where(eq(table.user.id, userId)).limit(1);

		if (user.length === 0) {
			return { locked: false };
		}

		const userData = user[0];

		// Check if account is manually locked (no expiration)
		if (userData.isLocked && !userData.lockedUntil) {
			return {
				locked: true,
				reason: 'Account has been locked by an administrator'
			};
		}

		// Check if account is temporarily locked
		if (userData.isLocked && userData.lockedUntil) {
			if (userData.lockedUntil > new Date()) {
				return {
					locked: true,
					lockedUntil: userData.lockedUntil,
					reason: 'Account temporarily locked due to too many failed login attempts'
				};
			} else {
				// Lock period expired, unlock the account
				await this.unlockAccount(userId);
				return { locked: false };
			}
		}

		return { locked: false };
	}

	/**
	 * Record a failed login attempt
	 */
	static async recordFailedLogin(userId: string): Promise<{
		locked: boolean;
		attemptsRemaining: number;
		lockedUntil?: Date;
	}> {
		const user = await db.select().from(table.user).where(eq(table.user.id, userId)).limit(1);

		if (user.length === 0) {
			throw new Error('User not found');
		}

		const userData = user[0];
		let failedAttempts = parseInt(userData.failedLoginAttempts) || 0;
		const lastFailed = userData.lastFailedLogin;

		// Reset counter if last attempt was too long ago
		if (
			lastFailed &&
			Date.now() - lastFailed.getTime() > ACCOUNT_LOCKOUT_CONFIG.resetAttemptsAfterMs
		) {
			failedAttempts = 0;
		}

		failedAttempts++;

		// Check if we should lock the account
		if (failedAttempts >= ACCOUNT_LOCKOUT_CONFIG.maxFailedAttempts) {
			const lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_CONFIG.lockoutDurationMs);

			await db
				.update(table.user)
				.set({
					isLocked: true,
					lockedAt: new Date(),
					lockedUntil,
					failedLoginAttempts: failedAttempts.toString(),
					lastFailedLogin: new Date()
				})
				.where(eq(table.user.id, userId));

			return {
				locked: true,
				attemptsRemaining: 0,
				lockedUntil
			};
		}

		// Update failed attempts
		await db
			.update(table.user)
			.set({
				failedLoginAttempts: failedAttempts.toString(),
				lastFailedLogin: new Date()
			})
			.where(eq(table.user.id, userId));

		return {
			locked: false,
			attemptsRemaining: ACCOUNT_LOCKOUT_CONFIG.maxFailedAttempts - failedAttempts
		};
	}

	/**
	 * Clear failed login attempts (on successful login)
	 */
	static async clearFailedAttempts(userId: string): Promise<void> {
		await db
			.update(table.user)
			.set({
				failedLoginAttempts: '0',
				lastFailedLogin: null
			})
			.where(eq(table.user.id, userId));
	}

	/**
	 * Unlock an account
	 */
	static async unlockAccount(userId: string): Promise<void> {
		await db
			.update(table.user)
			.set({
				isLocked: false,
				lockedAt: null,
				lockedUntil: null,
				failedLoginAttempts: '0',
				lastFailedLogin: null
			})
			.where(eq(table.user.id, userId));
	}

	/**
	 * Manually lock an account (admin action)
	 */
	static async lockAccount(userId: string, permanent: boolean = false): Promise<void> {
		const updateData: Partial<typeof table.user.$inferInsert> = {
			isLocked: true,
			lockedAt: new Date()
		};

		if (!permanent) {
			updateData.lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_CONFIG.lockoutDurationMs);
		} else {
			updateData.lockedUntil = null; // null means permanent
		}

		await db.update(table.user).set(updateData).where(eq(table.user.id, userId));
	}

	/**
	 * Get all locked accounts
	 */
	static async getLockedAccounts(): Promise<
		Array<{
			id: string;
			username: string;
			email: string;
			firstName: string;
			lastName: string;
			isLocked: boolean;
			lockedAt: Date | null;
			lockedUntil: Date | null;
			failedLoginAttempts: string;
		}>
	> {
		return await db
			.select({
				id: table.user.id,
				username: table.user.username,
				email: table.user.email,
				firstName: table.user.firstName,
				lastName: table.user.lastName,
				isLocked: table.user.isLocked,
				lockedAt: table.user.lockedAt,
				lockedUntil: table.user.lockedUntil,
				failedLoginAttempts: table.user.failedLoginAttempts
			})
			.from(table.user)
			.where(eq(table.user.isLocked, true));
	}
}
