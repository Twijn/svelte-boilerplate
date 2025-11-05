<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faEdit,
		faTrash,
		faUsers,
		faShieldAlt,
		faCrown,
		faUserTie,
		faUser,
		faLock,
		faShield
	} from '@fortawesome/free-solid-svg-icons';
	import PermissionsDisplay from '../ui/PermissionsDisplay.svelte';

	interface Role {
		id: string;
		name: string;
		description: string | null;
		permissions: string[];
		isSystemRole: boolean;
		userCount: number;
		users: Array<{
			id: string;
			username: string;
			firstName: string;
			lastName: string;
		}>;
	}

	interface Props {
		roles: Role[];
		onEdit: (role: Role) => void;
		onDelete: (role: Role) => void;
	}

	const { roles, onEdit, onDelete }: Props = $props();

	function getRoleIcon(roleName: string) {
		const lowerName = roleName.toLowerCase();
		if (lowerName.includes('super') || lowerName.includes('root')) return faCrown;
		if (lowerName.includes('admin')) return faShieldAlt;
		if (lowerName.includes('manager') || lowerName.includes('moderator')) return faUserTie;
		return faUser;
	}

	function getRoleColor(roleName: string) {
		const lowerName = roleName.toLowerCase();
		if (lowerName.includes('super')) return 'rgb(var(--orange))';
		if (lowerName.includes('admin')) return 'rgb(var(--red))';
		if (lowerName.includes('manager') || lowerName.includes('moderator')) return 'rgb(var(--blue))';
		return 'rgb(var(--green))';
	}
</script>

<div class="table-container col-12">
	<table>
		<thead>
			<tr>
				<th>Role</th>
				<th>Permissions</th>
				<th>Users</th>
				<th class="actions-column">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each roles as role (role.id)}
				{@const canEdit = role.id !== 'super-admin'}
				{@const isSuperAdmin = role.id === 'super-admin'}
				<tr class="role-row">
					<td class="role-cell">
						<div
							class="role-icon"
							style="background: linear-gradient(135deg, {getRoleColor(role.name)}, {getRoleColor(
								role.name
							)}dd)"
						>
							<FontAwesomeIcon icon={getRoleIcon(role.name)} />
						</div>
						<div class="role-info">
							<div class="role-name-row">
								<span class="role-name">{role.name}</span>
								{#if role.isSystemRole}
									<span class="system-badge">
										<FontAwesomeIcon icon={faShield} />
										System
									</span>
								{/if}
							</div>
							{#if role.description}
								<div class="role-description">{role.description}</div>
							{/if}
						</div>
					</td>

					<td class="permissions-cell">
						<div class="permissions-summary">
							<span class="permission-count">{role.permissions.length} permissions</span>
							<PermissionsDisplay
								permissions={role.permissions}
								variant="compact"
								groupByCategory={true}
							/>
						</div>
					</td>

					<td class="users-cell">
						<div class="users-info">
							<div class="user-count">
								<FontAwesomeIcon icon={faUsers} />
								<span>{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
							</div>
							{#if role.users.length > 0}
								<div class="users-list">
									{#each role.users.slice(0, 4) as user (user.id)}
										<div class="user-avatar" title="{user.firstName} {user.lastName}">
											{user.firstName.charAt(0)}{user.lastName.charAt(0)}
										</div>
									{/each}
									{#if role.users.length > 4}
										<div class="more-users">+{role.users.length - 4}</div>
									{/if}
								</div>
							{/if}
						</div>
					</td>

					<td class="actions-cell">
						<div class="action-buttons">
							{#if canEdit}
								<Button variant="secondary" onClick={() => onEdit(role)}>
									<FontAwesomeIcon icon={faEdit} />
									<span class="button-text">Edit</span>
								</Button>
								{#if !role.isSystemRole}
									<Button
										variant="error"
										onClick={() => onDelete(role)}
										disabled={role.userCount > 0}
										title={role.userCount > 0
											? 'Cannot delete role with assigned users'
											: 'Delete role'}
									>
										<FontAwesomeIcon icon={faTrash} />
										<span class="button-text-hide-mobile">Delete</span>
									</Button>
								{/if}
							{:else if isSuperAdmin}
								<div class="protected-notice">
									<FontAwesomeIcon icon={faLock} />
									<span>Protected</span>
								</div>
							{/if}
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.actions-column {
		text-align: right;
	}

	.role-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 250px;
	}

	.role-icon {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		color: white;
		flex-shrink: 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.role-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.role-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.role-name {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.system-badge {
		background: rgba(var(--blue), 0.2);
		color: rgb(var(--blue));
		padding: 0.15rem 0.4rem;
		border-radius: 0.5rem;
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.role-description {
		color: var(--text-color-3);
		font-size: 0.8rem;
	}

	.permissions-cell {
		min-width: 200px;
	}

	.permissions-summary {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.permission-count {
		color: var(--text-color-2);
		font-size: 0.85rem;
		font-weight: 500;
	}

	.users-cell {
		min-width: 150px;
	}

	.users-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.user-count {
		color: var(--text-color-2);
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.users-list {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--theme-color-1), var(--theme-color-2));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.7rem;
		color: white;
		cursor: help;
		border: 2px solid var(--background-color-2);
	}

	.more-users {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		color: var(--text-color-2);
		font-weight: 500;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.protected-notice {
		color: var(--text-color-3);
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-style: italic;
	}

	@media (max-width: 1200px) {
		.button-text-hide-mobile {
			display: none;
		}
	}

	@media (max-width: 968px) {
		.table-container {
			border: none;
			background: transparent;
		}

		table,
		thead,
		tbody,
		th,
		td,
		tr {
			display: block;
		}

		thead {
			display: none;
		}

		tr {
			background: var(--background-color-2);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 0.75rem;
			margin-bottom: 1rem;
			padding: 1rem;
		}

		tr:hover {
			border-color: rgba(255, 255, 255, 0.2);
		}

		td {
			padding: 0.5rem 0;
			border: none;
		}

		.role-cell {
			padding-bottom: 1rem;
			margin-bottom: 1rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
			min-width: 0;
		}

		.permissions-cell,
		.users-cell {
			min-width: 0;
			margin-bottom: 0.75rem;
		}

		.permissions-cell::before {
			content: 'Permissions';
			display: block;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-color-3);
			text-transform: uppercase;
			margin-bottom: 0.5rem;
		}

		.users-cell::before {
			content: 'Users';
			display: block;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-color-3);
			text-transform: uppercase;
			margin-bottom: 0.5rem;
		}

		.action-buttons {
			justify-content: flex-start;
			flex-wrap: wrap;
		}
	}
</style>
