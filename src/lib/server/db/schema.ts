import { pgTable, text, timestamp, boolean, json } from 'drizzle-orm/pg-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const user: any = pgTable('user', {
	id: text('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),

	// Profile fields
	avatar: text('avatar'), // URL or path to avatar image
	bio: text('bio'), // Short biography
	location: text('location'), // User's location
	website: text('website'), // Personal website URL

	// Two-Factor Authentication
	twoFactorSecret: text('two_factor_secret'), // TOTP secret (encrypted)
	twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
	twoFactorBackupCodes: json('two_factor_backup_codes').$type<string[]>(), // Hashed backup codes

	// Account status
	isLocked: boolean('is_locked').notNull().default(false),
	lockedAt: timestamp('locked_at', { withTimezone: true, mode: 'date' }),
	lockedUntil: timestamp('locked_until', { withTimezone: true, mode: 'date' }),
	failedLoginAttempts: text('failed_login_attempts').notNull().default('0'),
	lastFailedLogin: timestamp('last_failed_login', { withTimezone: true, mode: 'date' }),
	requirePasswordChange: boolean('require_password_change').notNull().default(false),

	// Account disabled
	isDisabled: boolean('is_disabled').notNull().default(false),
	disabledAt: timestamp('disabled_at', { withTimezone: true, mode: 'date' }),
	disabledBy: text('disabled_by').references(() => user.id, { onDelete: 'set null' }),
	disableReason: text('disable_reason'),

	// Email verification
	emailVerified: boolean('email_verified').notNull().default(false),
	emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true, mode: 'date' }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;

// Permission system tables
export const role = pgTable('role', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description'),
	permissions: json('permissions').$type<string[]>().notNull().default([]),
	isSystemRole: boolean('is_system_role').notNull().default(false), // Prevents deletion of system roles
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const userRole = pgTable('user_role', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	roleId: text('role_id')
		.notNull()
		.references(() => role.id, { onDelete: 'cascade' }),
	assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	assignedBy: text('assigned_by').references(() => user.id, { onDelete: 'set null' })
});

// Future-proof: Node-based permissions for granular control
export const permissionNode = pgTable('permission_node', {
	id: text('id').primaryKey(),
	nodeType: text('node_type').notNull(), // e.g., 'page', 'api', 'resource', 'feature'
	nodePath: text('node_path').notNull(), // e.g., '/admin', '/api/users', 'feature:analytics'
	description: text('description'),
	parentNodeId: text('parent_node_id'), // Self-reference to be added after table definition
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const userNodePermission = pgTable('user_node_permission', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	nodeId: text('node_id')
		.notNull()
		.references(() => permissionNode.id, { onDelete: 'cascade' }),
	permissions: json('permissions').$type<string[]>().notNull().default([]), // e.g., ['read', 'write', 'delete']
	grantedAt: timestamp('granted_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	grantedBy: text('granted_by').references(() => user.id, { onDelete: 'set null' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }) // Optional expiration
});

// Password reset tokens
export const passwordResetToken = pgTable('password_reset_token', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	tokenHash: text('token_hash').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Email change verification tokens
export const emailChangeToken = pgTable('email_change_token', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	newEmail: text('new_email').notNull(),
	tokenHash: text('token_hash').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Email verification tokens
export const emailVerificationToken = pgTable('email_verification_token', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	tokenHash: text('token_hash').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

// Activity log - tracks all actions and changes in the system
export const activityLog = pgTable('activity_log', {
	id: text('id').primaryKey(),
	// Who performed the action
	userId: text('user_id').references(() => user.id, { onDelete: 'set null' }), // null for anonymous/system actions
	ipAddress: text('ip_address'), // IP address of the actor
	userAgent: text('user_agent'), // Browser/client info

	// What action was performed
	action: text('action').notNull(), // e.g., 'user.login', 'user.create', 'role.update', 'rate_limit.check'
	category: text('category').notNull(), // e.g., 'auth', 'user', 'role', 'permission', 'security', 'system'
	severity: text('severity').notNull().default('info'), // 'debug', 'info', 'warning', 'error', 'critical'

	// What was affected
	resourceType: text('resource_type'), // e.g., 'user', 'role', 'session'
	resourceId: text('resource_id'), // ID of the affected resource

	// Additional context
	metadata: json('metadata').$type<Record<string, unknown>>(), // Flexible JSON for any additional data
	message: text('message'), // Human-readable description

	// Status
	success: boolean('success').notNull().default(true),
	errorMessage: text('error_message'), // If success=false, what went wrong

	// Timing
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	duration: text('duration') // Optional: how long the action took (in ms)
});

// Configuration variables - database-backed config for runtime settings
export const configVariable = pgTable('config_variable', {
	key: text('key').primaryKey(),
	value: text('value').notNull(), // Stored as string, parsed based on type
	type: text('type').notNull(), // 'string', 'number', 'boolean', 'json'
	category: text('category').notNull(), // e.g., 'rate_limit', 'email', 'security', 'feature'
	description: text('description'),
	defaultValue: text('default_value').notNull(),
	isEditable: boolean('is_editable').notNull().default(true), // Some vars may be readonly
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' })
});

export type User = typeof user.$inferSelect;
export type Role = typeof role.$inferSelect;
export type UserRole = typeof userRole.$inferSelect;
export type PermissionNode = typeof permissionNode.$inferSelect;
export type UserNodePermission = typeof userNodePermission.$inferSelect;
export type PasswordResetToken = typeof passwordResetToken.$inferSelect;
export type EmailChangeToken = typeof emailChangeToken.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationToken.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type ConfigVariable = typeof configVariable.$inferSelect;
