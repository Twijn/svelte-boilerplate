import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionService, PERMISSIONS } from '$lib/server/permissions';

// Mock the database
vi.mock('$lib/server/db', () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	}
}));

// Mock the generateId utility
vi.mock('$lib/server/utils', () => ({
	generateId: vi.fn(() => 'mock-id-' + Math.random())
}));

type MockSelectChain = {
	from: ReturnType<typeof vi.fn>;
	innerJoin: ReturnType<typeof vi.fn>;
	where: ReturnType<typeof vi.fn>;
};

describe('PermissionService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getUserPermissions', () => {
		it('should return unique permissions from all user roles', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([
					{ permissions: ['content.create', 'content.edit', 'content.view'] },
					{ permissions: ['content.view', 'analytics.view'] } // content.view is duplicate
				])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const permissions = await PermissionService.getUserPermissions('user-1');

			expect(permissions).toHaveLength(4);
			expect(permissions).toContain('content.create');
			expect(permissions).toContain('content.edit');
			expect(permissions).toContain('content.view');
			expect(permissions).toContain('analytics.view');
		});

		it('should return empty array when user has no roles', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const permissions = await PermissionService.getUserPermissions('user-2');

			expect(permissions).toHaveLength(0);
		});

		it('should handle null permissions gracefully', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: null }, { permissions: ['content.view'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const permissions = await PermissionService.getUserPermissions('user-3');

			expect(permissions).toHaveLength(1);
			expect(permissions).toContain('content.view');
		});
	});

	describe('hasPermission', () => {
		it('should return true when user has the permission', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: ['content.create', 'content.edit'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasPermission('user-1', 'content.create');

			expect(result).toBe(true);
		});

		it('should return false when user does not have the permission', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: ['content.create'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasPermission('user-1', 'content.delete');

			expect(result).toBe(false);
		});

		it('should return true when user has admin permission', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: [PERMISSIONS.ADMIN] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasPermission('admin-1', 'any.permission');

			expect(result).toBe(true);
		});
	});

	describe('hasAnyPermission', () => {
		it('should return true when user has at least one permission', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: ['content.create', 'content.edit'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasAnyPermission('user-1', [
				'content.create',
				'content.delete'
			]);

			expect(result).toBe(true);
		});

		it('should return false when user has none of the permissions', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: ['content.view'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasAnyPermission('user-1', [
				'content.create',
				'content.delete'
			]);

			expect(result).toBe(false);
		});

		it('should return true when user has admin permission', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: [PERMISSIONS.ADMIN] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasAnyPermission('admin-1', [
				'content.delete',
				'user.manage'
			]);

			expect(result).toBe(true);
		});
	});

	describe('hasAllPermissions', () => {
		it('should return true when user has all required permissions', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi
					.fn()
					.mockResolvedValue([{ permissions: ['content.create', 'content.edit', 'content.view'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasAllPermissions('user-1', [
				'content.create',
				'content.edit'
			]);

			expect(result).toBe(true);
		});

		it('should return false when user is missing one or more permissions', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: ['content.create'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasAllPermissions('user-1', [
				'content.create',
				'content.delete'
			]);

			expect(result).toBe(false);
		});

		it('should return true when user has admin permission', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: [PERMISSIONS.ADMIN] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasAllPermissions('admin-1', [
				'content.delete',
				'user.manage'
			]);

			expect(result).toBe(true);
		});

		it('should return true with empty permission array', async () => {
			const { db } = await import('$lib/server/db');
			const mockSelect: MockSelectChain = {
				from: vi.fn().mockReturnThis(),
				innerJoin: vi.fn().mockReturnThis(),
				where: vi.fn().mockResolvedValue([{ permissions: ['content.view'] }])
			};
			vi.mocked(db.select).mockReturnValue(
				mockSelect as MockSelectChain & ReturnType<typeof db.select>
			);

			const result = await PermissionService.hasAllPermissions('user-1', []);

			expect(result).toBe(true);
		});
	});
});
