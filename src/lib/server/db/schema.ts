import { pgTable, text, timestamp, boolean, json } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
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
	assignedBy: text('assigned_by').references(() => user.id)
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
	grantedBy: text('granted_by').references(() => user.id),
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

export type User = typeof user.$inferSelect;
export type Role = typeof role.$inferSelect;
export type UserRole = typeof userRole.$inferSelect;
export type PermissionNode = typeof permissionNode.$inferSelect;
export type UserNodePermission = typeof userNodePermission.$inferSelect;
export type PasswordResetToken = typeof passwordResetToken.$inferSelect;
