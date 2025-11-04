<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUserPlus,
		faShieldAlt,
		faCrown,
		faUserTie,
		faXmarkCircle
	} from '@fortawesome/free-solid-svg-icons';
	import Card from '../ui/Card.svelte';

	interface User {
		id: string;
		username: string;
		email: string;
		firstName: string;
		lastName: string;
		roles: Role[];
	}

	interface Role {
		id: string;
		name: string;
		isSystemRole: boolean;
	}

	interface Props {
		user: User;
		availableRolesCount: number;
		onAssignRole: () => void;
		onRemoveRole: (role: Role) => void;
		onEdit: () => void;
		onDelete: () => void;
		canRemoveRole: (role: Role, allRoles: Role[]) => boolean;
	}

	const {
		user,
		availableRolesCount,
		onAssignRole,
		onRemoveRole,
		onEdit,
		onDelete,
		canRemoveRole
	}: Props = $props();

	function getUserInitials(user: User): string {
		return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
	}

	function getRoleConfig(roleName: string) {
		const lowerName = roleName.toLowerCase();
		if (lowerName.includes('admin')) {
			return { icon: faShieldAlt, color: 'rgb(var(--red))' };
		} else if (lowerName.includes('super')) {
			return { icon: faCrown, color: 'rgb(var(--orange))' };
		} else if (lowerName.includes('manager') || lowerName.includes('moderator')) {
			return { icon: faUserTie, color: 'rgb(var(--blue))' };
		}
		return { icon: faUserTie, color: 'rgb(var(--green))' };
	}
</script>

<Card
	name="{user.firstName} {user.lastName}"
	description="@{user.username}"
	initials={getUserInitials(user)}
	initialsTitle="{user.firstName} {user.lastName}"
>
	{#snippet header()}{/snippet}
	{#snippet children()}
		<div class="user-info">
			<p class="user-email">
				<i class="fa-solid fa-envelope"></i>
				{user.email}
			</p>
		</div>

		<div class="user-roles">
			<h4>Roles ({user.roles.length})</h4>
			{#if user.roles.length > 0}
				<div class="roles-list">
					{#each user.roles as role (role.id)}
						{@const config = getRoleConfig(role.name)}
						<div class="role-badge" style="border-color: {config.color};">
							<FontAwesomeIcon icon={config.icon} />
							<span>{role.name}</span>
							{#if canRemoveRole(role, user.roles)}
								<button
									class="remove-role-btn"
									onclick={() => onRemoveRole(role)}
									title="Remove {role.name} role"
									aria-label="Remove {role.name} role from {user.firstName} {user.lastName}"
								>
									<FontAwesomeIcon icon={faXmarkCircle} />
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="no-roles">No roles assigned</p>
			{/if}
		</div>
	{/snippet}
	{#snippet actions()}
		<Button
			variant="secondary"
			onClick={onAssignRole}
			disabled={availableRolesCount === 0}
			title={availableRolesCount === 0 ? 'All roles already assigned' : 'Assign new role'}
		>
			<FontAwesomeIcon icon={faUserPlus} />
			Assign Role
		</Button>
		<div class="action-group">
			<Button variant="secondary" onClick={onEdit} title="Edit user">Edit</Button>
			<Button variant="error" onClick={onDelete} title="Delete user">Delete</Button>
		</div>
	{/snippet}
</Card>

<style>
	.user-info {
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.user-email {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-color-2);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.user-email i {
		color: var(--theme-color-2);
		font-size: 0.9rem;
	}

	.user-roles h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.95rem;
		color: var(--text-color-1);
	}

	.roles-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid;
		padding: 0.3rem 0.6rem;
		border-radius: 1.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-color-2);
	}

	.remove-role-btn {
		background: rgba(255, 0, 0, 0.1);
		border: none;
		color: rgb(var(--red));
		width: 16px;
		height: 16px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
		margin-left: 0.15rem;
		transition: all 0.2s ease;
	}

	.remove-role-btn:hover {
		background: rgba(255, 0, 0, 0.2);
		transform: scale(1.1);
	}

	.no-roles {
		color: var(--text-color-3);
		font-style: italic;
		margin: 0;
		font-size: 0.85rem;
	}

	.action-group {
		display: flex;
		gap: 0.5rem;
	}
</style>
