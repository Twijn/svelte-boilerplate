<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUserPlus,
		faShieldAlt,
		faCrown,
		faUserTie,
		faXmarkCircle,
		faLock,
		faUnlock,
		faEnvelope
	} from '@fortawesome/free-solid-svg-icons';
	import Card from '../ui/Card.svelte';

	interface User {
		id: string;
		username: string;
		email: string;
		firstName: string;
		lastName: string;
		roles: Role[];
		isLocked?: boolean;
		lockedUntil?: Date | null;
		failedLoginAttempts?: string;
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
		onUnlock?: () => void;
		canRemoveRole: (role: Role, allRoles: Role[]) => boolean;
	}

	const {
		user,
		availableRolesCount,
		onAssignRole,
		onRemoveRole,
		onEdit,
		onDelete,
		onUnlock,
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
	{#if user.isLocked}
		{@const isTemporary = user.lockedUntil && new Date(user.lockedUntil) > new Date()}
		{@const isPermanent = user.isLocked && !user.lockedUntil}
		<button
			class="lock-status locked clickable"
			onclick={onUnlock}
			disabled={!onUnlock}
			title={onUnlock ? 'Click to unlock account' : 'Cannot unlock'}
		>
			<FontAwesomeIcon icon={faLock} />
			<span>
				{#if isPermanent}
					<strong>Permanently Locked</strong>
				{:else if isTemporary && user.lockedUntil}
					{@const minutesRemaining = Math.ceil(
						(new Date(user.lockedUntil).getTime() - Date.now()) / 60000
					)}
					<strong>Temporarily Locked</strong>
					<br />
					({minutesRemaining} min remaining)
				{:else}
					<strong>Locked</strong> (expired, auto-unlocking)
				{/if}
			</span>
			{#if user.failedLoginAttempts && parseInt(user.failedLoginAttempts) > 0}
				<span class="failed-attempts">
					{user.failedLoginAttempts} failed attempts
				</span>
			{/if}
		</button>
	{:else}
		<div class="lock-status unlocked">
			<FontAwesomeIcon icon={faUnlock} />
			<span>Account Active</span>
		</div>
	{/if}

	<div class="user-info">
		<p class="user-email">
			<FontAwesomeIcon icon={faEnvelope} />
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
		gap: 0.25rem;
	}

	.lock-status {
		font-family: var(--font-family-heading), sans-serif;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-weight: 500;
		width: 100%;
		text-align: left;
		margin-bottom: 0.75rem;
	}

	.lock-status.clickable {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.lock-status.clickable:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.lock-status.clickable:active:not(:disabled) {
		transform: translateY(0);
	}

	.lock-status.clickable:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.lock-status.locked {
		background: rgba(255, 59, 48, 0.15);
		border: 1px solid rgba(255, 59, 48, 0.3);
		color: rgb(255, 100, 90);
	}

	.lock-status.locked strong {
		color: rgb(255, 80, 70);
	}

	.lock-status.unlocked {
		background: rgba(52, 199, 89, 0.15);
		border: 1px solid rgba(52, 199, 89, 0.3);
		color: rgb(80, 210, 110);
		font-weight: 500;
	}

	.failed-attempts {
		margin-left: auto;
		font-size: 0.75rem;
		opacity: 0.8;
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
