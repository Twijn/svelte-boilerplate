<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import UserAvatar from '$lib/components/ui/UserAvatar.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faEdit,
		faTrash,
		faUsers,
		faShieldAlt,
		faCrown,
		faUserTie,
		faUser,
		faLock
	} from '@fortawesome/free-solid-svg-icons';
	import Card from '../ui/Card.svelte';
	import PermissionsDisplay from '../ui/PermissionsDisplay.svelte';

	interface Role {
		id: string;
		name: string;
		description?: string | null;
		permissions: string[];
		isSystemRole: boolean;
		userCount: number;
		users: Array<{
			id: string;
			username: string;
			firstName: string;
			lastName: string;
			avatar?: string | null;
		}>;
	}

	interface Props {
		role: Role;
		onEdit: () => void;
		onDelete: () => void;
	}

	const { role, onEdit, onDelete }: Props = $props();

	// Check if role can be edited (all except super admin)
	const canEdit = $derived(role.id !== 'super-admin');
	const isSuperAdmin = $derived(role.id === 'super-admin');

	function getRoleIcon(roleName: string) {
		const lowerName = roleName.toLowerCase();
		if (lowerName.includes('super') || lowerName.includes('root')) return faCrown;
		if (lowerName.includes('admin')) return faShieldAlt;
		if (lowerName.includes('manager') || lowerName.includes('moderator')) return faUserTie;
		return faUser;
	}
</script>

<Card
	icon={getRoleIcon(role.name)}
	name={role.name}
	description={role.description ?? 'No description'}
>
	{#snippet header()}
		{#if role.isSystemRole}
			<span class="system-badge">System Role</span>
		{/if}
		<span class="user-count">
			<FontAwesomeIcon icon={faUsers} />
			{role.userCount} user{role.userCount !== 1 ? 's' : ''}
		</span>
	{/snippet}
	<div class="role-permissions">
		<h4>
			Permissions <span class="badge">{role.permissions.length}</span>
		</h4>
		<PermissionsDisplay permissions={role.permissions} variant="compact" groupByCategory={true} />
	</div>

	{#if role.users.length > 0}
		<div class="role-users">
			<h4>
				Assigned Users <div class="badge badge-primary">{role.users.length}</div>
			</h4>
			<div class="users-list">
				{#each role.users.slice(0, 3) as user (user.id)}
					<div title="{user.firstName} {user.lastName}">
						<UserAvatar
							avatar={user.avatar}
							firstName={user.firstName}
							lastName={user.lastName}
							username={user.username}
							size="small"
						/>
					</div>
				{/each}
				{#if role.users.length > 3}
					<div class="more-users">+{role.users.length - 3}</div>
				{/if}
			</div>
		</div>
	{/if}
	{#snippet actions()}
		{#if canEdit}
			<Button variant="secondary" onClick={onEdit}>
				<FontAwesomeIcon icon={faEdit} />
				Edit
			</Button>
			{#if !role.isSystemRole}
				<Button
					variant="error"
					onClick={onDelete}
					disabled={role.userCount > 0}
					title={role.userCount > 0 ? 'Cannot delete role with assigned users' : 'Delete role'}
				>
					<FontAwesomeIcon icon={faTrash} />
					Delete
				</Button>
			{/if}
		{:else if isSuperAdmin}
			<div class="system-role-notice">
				<small><FontAwesomeIcon icon={faLock} /> Super Admin role is protected</small>
			</div>
		{/if}
	{/snippet}
</Card>

<style>
	.system-badge {
		background: rgba(var(--blue), 0.2);
		color: rgb(var(--blue));
		padding: 0.15rem 0.5rem;
		border-radius: 0.75rem;
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	.user-count {
		color: var(--text-color-2);
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.4rem;
		background: rgba(var(--blue), 0.2);
		color: rgb(var(--blue));
		border-radius: 0.75rem;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.role-permissions {
		margin-bottom: 0.75rem;
	}

	.role-permissions h4 {
		color: var(--text-color-1);
		font-size: 0.85rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		display: flex;
		align-items: center;
	}

	.role-users {
		margin-bottom: 0.75rem;
	}

	.role-users h4 {
		color: var(--text-color-1);
		font-size: 0.85rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.users-list {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.more-users {
		width: 30px;
		height: 30px;
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

	.system-role-notice {
		color: var(--text-color-3);
		font-style: italic;
		padding: 0.25rem 0;
		font-size: 0.8rem;
	}
</style>
