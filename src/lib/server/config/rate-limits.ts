/**
 * Rate Limit Configuration
 * Registers all rate limit settings as configurable variables
 */

import { registerConfig } from './variables';

// Helper to validate positive integers
const validatePositiveInt = (value: number): boolean | string => {
	if (!Number.isInteger(value) || value <= 0) {
		return 'Must be a positive integer';
	}
	return true;
};

// Helper to convert minutes to milliseconds
export const minutesToMs = (minutes: number) => minutes * 60 * 1000;
export const hoursToMs = (hours: number) => hours * 60 * 60 * 1000;

/**
 * Register all rate limit configuration variables
 */
export function registerRateLimitConfigs() {
	// Login Rate Limits
	registerConfig({
		key: 'rate_limit.login.max_attempts',
		defaultValue: 20,
		type: 'number',
		category: 'rate_limit',
		description: 'Maximum login attempts allowed within the time window (per IP)',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'rate_limit.login.window_minutes',
		defaultValue: 15,
		type: 'number',
		category: 'rate_limit',
		description: 'Time window in minutes for tracking login attempts',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'rate_limit.login.block_duration_minutes',
		defaultValue: 15,
		type: 'number',
		category: 'rate_limit',
		description: 'How long to block login attempts after exceeding the limit (in minutes)',
		validator: validatePositiveInt
	});

	// Registration Rate Limits
	registerConfig({
		key: 'rate_limit.register.max_attempts',
		defaultValue: 3,
		type: 'number',
		category: 'rate_limit',
		description: 'Maximum registration attempts allowed within the time window (per IP)',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'rate_limit.register.window_minutes',
		defaultValue: 60,
		type: 'number',
		category: 'rate_limit',
		description: 'Time window in minutes for tracking registration attempts',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'rate_limit.register.block_duration_minutes',
		defaultValue: 60,
		type: 'number',
		category: 'rate_limit',
		description: 'How long to block registrations after exceeding the limit (in minutes)',
		validator: validatePositiveInt
	});

	// Password Reset Rate Limits
	registerConfig({
		key: 'rate_limit.password_reset.max_attempts',
		defaultValue: 3,
		type: 'number',
		category: 'rate_limit',
		description: 'Maximum password reset requests allowed within the time window (per IP)',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'rate_limit.password_reset.window_minutes',
		defaultValue: 60,
		type: 'number',
		category: 'rate_limit',
		description: 'Time window in minutes for tracking password reset attempts',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'rate_limit.password_reset.block_duration_minutes',
		defaultValue: 60,
		type: 'number',
		category: 'rate_limit',
		description: 'How long to block password resets after exceeding the limit (in minutes)',
		validator: validatePositiveInt
	});

	// General API Rate Limits
	registerConfig({
		key: 'rate_limit.api_general.max_attempts',
		defaultValue: 100,
		type: 'number',
		category: 'rate_limit',
		description: 'Maximum general API requests allowed within the time window (per IP)',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'rate_limit.api_general.window_minutes',
		defaultValue: 1,
		type: 'number',
		category: 'rate_limit',
		description: 'Time window in minutes for tracking general API requests',
		validator: validatePositiveInt
	});

	// Account Lockout Settings
	registerConfig({
		key: 'security.account_lockout.max_failed_attempts',
		defaultValue: 5,
		type: 'number',
		category: 'security',
		description: 'Maximum failed login attempts before account lockout',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'security.account_lockout.duration_minutes',
		defaultValue: 30,
		type: 'number',
		category: 'security',
		description: 'How long to lock an account after too many failed attempts (in minutes)',
		validator: validatePositiveInt
	});

	// Session Settings
	registerConfig({
		key: 'security.session.lifetime_days',
		defaultValue: 30,
		type: 'number',
		category: 'security',
		description: 'Session lifetime in days',
		validator: validatePositiveInt
	});

	registerConfig({
		key: 'security.session.renewal_threshold_days',
		defaultValue: 15,
		type: 'number',
		category: 'security',
		description: 'Renew session if it expires within this many days',
		validator: validatePositiveInt
	});

	// Password Requirements
	registerConfig({
		key: 'security.password.min_length',
		defaultValue: 8,
		type: 'number',
		category: 'security',
		description: 'Minimum password length',
		validator: (value: number) => {
			if (!Number.isInteger(value) || value < 6) {
				return 'Minimum password length must be at least 6';
			}
			if (value > 128) {
				return 'Minimum password length cannot exceed 128';
			}
			return true;
		}
	});

	registerConfig({
		key: 'security.password.require_uppercase',
		defaultValue: true,
		type: 'boolean',
		category: 'security',
		description: 'Require at least one uppercase letter in passwords'
	});

	registerConfig({
		key: 'security.password.require_lowercase',
		defaultValue: true,
		type: 'boolean',
		category: 'security',
		description: 'Require at least one lowercase letter in passwords'
	});

	registerConfig({
		key: 'security.password.require_number',
		defaultValue: true,
		type: 'boolean',
		category: 'security',
		description: 'Require at least one number in passwords'
	});

	registerConfig({
		key: 'security.password.require_special',
		defaultValue: false,
		type: 'boolean',
		category: 'security',
		description: 'Require at least one special character in passwords'
	});

	// Email Verification
	registerConfig({
		key: 'email.verification.required',
		defaultValue: true,
		type: 'boolean',
		category: 'email',
		description: 'Require email verification for new accounts'
	});

	registerConfig({
		key: 'email.verification.token_expiry_hours',
		defaultValue: 24,
		type: 'number',
		category: 'email',
		description: 'Email verification token expiry time in hours',
		validator: validatePositiveInt
	});

	// Two-Factor Authentication
	registerConfig({
		key: 'security.2fa.backup_codes_count',
		defaultValue: 10,
		type: 'number',
		category: 'security',
		description: 'Number of backup codes to generate for 2FA',
		validator: (value: number) => {
			if (!Number.isInteger(value) || value < 5 || value > 20) {
				return 'Backup codes count must be between 5 and 20';
			}
			return true;
		}
	});
}
