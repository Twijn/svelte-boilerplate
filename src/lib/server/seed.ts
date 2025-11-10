import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as table from './db/schema';
import 'dotenv/config';
import { generateId } from './utils';
import { hash } from '@node-rs/argon2';

const SYSTEM_ROLES = {
	SUPER_ADMIN: {
		id: 'super-admin',
		name: 'Super Admin',
		description: 'Grants the user full access to all system features and settings',
		permissions: [
			'admin',
			'manage_users',
			'manage_roles',
			'view_logs',
			'view_config',
			'edit_config'
		],
		isSystemRole: true
	},
	ADMIN: {
		id: 'admin',
		name: 'Administrator',
		description: 'Grants the user administrative access to manage users and roles',
		permissions: ['manage_users', 'manage_roles', 'view_logs', 'view_config'],
		isSystemRole: true
	},
	USER: {
		id: 'user',
		name: 'User',
		description: 'Basic user access',
		permissions: ['read'],
		isSystemRole: true
	}
} as const;

// Setup database connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema: table });

async function createRole(
	id: string,
	name: string,
	description: string,
	permissions: string[]
): Promise<void> {
	const existingRole = await db.select().from(table.role).where(eq(table.role.id, id));
	if (existingRole.length === 0) {
		await db.insert(table.role).values({
			id,
			name,
			description,
			permissions,
			isSystemRole: true
		});
		console.log(`Created new role: ${name}`);
	} else {
		console.log(`Role ${name} already exists`);
	}
}

/**
 * Seed the database with initial data
 */
async function seed() {
	console.log('Seeding database...');

	try {
		// Create system roles from SYSTEM_ROLES constant
		await createRole(
			SYSTEM_ROLES.SUPER_ADMIN.id,
			SYSTEM_ROLES.SUPER_ADMIN.name,
			SYSTEM_ROLES.SUPER_ADMIN.description,
			[...SYSTEM_ROLES.SUPER_ADMIN.permissions]
		);

		await createRole(
			SYSTEM_ROLES.ADMIN.id,
			SYSTEM_ROLES.ADMIN.name,
			SYSTEM_ROLES.ADMIN.description,
			[...SYSTEM_ROLES.ADMIN.permissions]
		);

		await createRole(SYSTEM_ROLES.USER.id, SYSTEM_ROLES.USER.name, SYSTEM_ROLES.USER.description, [
			...SYSTEM_ROLES.USER.permissions
		]);

		const users = await db.select().from(table.user).limit(1);
		if (users.length === 0) {
			// Create Admin User
			const adminUserId = generateId();
			const passwordHash = await hash('admin123'); // Default password

			await db.insert(table.user).values({
				id: adminUserId,
				firstName: 'Admin',
				lastName: 'User',
				username: 'admin',
				email: 'admin@example.com',
				passwordHash,
				isLocked: false,
				failedLoginAttempts: '0',
				requirePasswordChange: true, // Force password change on first login
				emailVerified: true, // Admin user is pre-verified
				emailVerifiedAt: new Date() // Set verification timestamp
			});
			console.log('✅ Created admin user (username: admin, password: admin123)');

			// Assign Admin Role to Admin User
			await db.insert(table.userRole).values({
				id: generateId(),
				userId: adminUserId,
				roleId: SYSTEM_ROLES.ADMIN.id
			});
			console.log('✅ Assigned Admin role to admin user');
		}
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	}
}

// Run seed
seed()
	.then(async () => {
		console.log('✅ Seeding complete');
		await client.end();
		process.exit(0);
	})
	.catch(async (error) => {
		console.error('❌ Seeding failed:', error);
		await client.end();
		process.exit(1);
	});

export { seed };
