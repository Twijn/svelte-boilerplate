<script lang="ts">
	import SortableTable from '$lib/components/ui/SortableTable.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUserPlus,
		faShieldAlt,
		faCrown,
		faUserTie,
		faUser,
		faXmarkCircle,
		faLock,
		faUnlock,
		faEdit,
		faTrash,
		faKey,
		faExclamationTriangle
	} from '@fortawesome/free-solid-svg-icons';

	interface User {
		id: string;
		username: string;
		email: string;
		firstName: string;
		lastName: string;
		requirePasswordChange: boolean;
		roles: Role[];
		isLocked?: boolean;
		lockedUntil?: Date | null;
		failedLoginAttempts?: string;
		isDisabled?: boolean;
		disabledAt?: Date | null;
		disableReason?: string | null;
	}

	interface Role {
		id: string;
		name: string;
		isSystemRole: boolean;
	}

	interface Props {
		users: User[];
		onAssignRole: (user: User) => void;
		onRemoveRole: (user: User, role: Role) => void;
		onEdit: (user: User) => void;
		onDelete: (user: User) => void;
		onUnlock?: (user: User) => void;
		onDisable?: (user: User) => void;
		onEnable?: (user: User) => void;
		canRemoveRole: (role: Role, allRoles: Role[]) => boolean;
		availableRolesForUser: (user: User) => number;
	}

	const {
		users,
		onAssignRole,
		onRemoveRole,
		onEdit,
		onDelete,
		onUnlock,
		onDisable,
		onEnable,
		canRemoveRole,
		availableRolesForUser
	}: Props = $props();

	const roleIcons = {
		super: faCrown,
		admin: faShieldAlt,
		manager: faUserTie,
		moderator: faUserTie,
		default: faUser
	};

	const roleColors = {
		super: 'rgb(var(--orange))',
		admin: 'rgb(var(--red))',
		manager: 'rgb(var(--blue))',
		moderator: 'rgb(var(--blue))',
		default: 'rgb(var(--green))'
	};

	function getRoleIcon(roleName: string) {
		const lower = roleName.toLowerCase();
		for (const key in roleIcons) {
			if (lower.includes(key)) return roleIcons[key as keyof typeof roleIcons];
		}
		return roleIcons.default;
	}

	function getRoleColor(roleName: string) {
		const lower = roleName.toLowerCase();
		for (const key in roleColors) {
			if (lower.includes(key)) return roleColors[key as keyof typeof roleColors];
		}
		return roleColors.default;
	}

	// Custom sort function for status - prioritizes disabled > locked > requirePasswordChange > active
	function getStatusSortValue(user: User): number {
		if (user.isDisabled) return 0;
		if (user.isLocked) return 1;
		if (user.requirePasswordChange) return 2;
		return 3;
	}

	const columns = [
		{
			key: 'username' as keyof User,
			label: 'User',
			sortValue: (user: User) => `${user.firstName} ${user.lastName}`.toLowerCase()
		},
		{
			key: 'isDisabled' as keyof User,
			label: 'Status',
			sortValue: getStatusSortValue
		},
		{
			key: 'roles' as keyof User,
			label: 'Roles',
			sortValue: (user: User) => user.roles.length
		},
		{
			key: 'id' as keyof User,
			label: 'Actions',
			sortable: false
		}
	];
</script>

<div class="table-container col-12">
	<SortableTable data={users} {columns} rowKey={(user) => user.id} rowClass={() => 'user-row'}>
		{#snippet cellContent({ item: user, column })}
			{#if column.label === 'User'}
				<div class="user-cell">
					<div class="user-avatar">
						{user.firstName.charAt(0)}{user.lastName.charAt(0)}
					</div>
					<div class="user-info">
						<div class="user-name">{user.firstName} {user.lastName}</div>
						<div class="user-username">@{user.username}</div>
						<div class="user-email">{user.email}</div>
					</div>
				</div>
			{:else if column.label === 'Status'}
				<div class="status-cell">
					{#if user.isDisabled}
						<button
							class="status-badge disabled clickable"
							onclick={() => onEnable?.(user)}
							disabled={!onEnable}
							title={onEnable
								? `Disabled: ${user.disableReason || 'No reason given'}. Click to enable.`
								: 'Cannot enable'}
						>
							<FontAwesomeIcon icon={faLock} />
							<span>Disabled</span>
						</button>
					{:else if user.isLocked}
						{@const isTemporary = user.lockedUntil && new Date(user.lockedUntil) > new Date()}
						{@const isPermanent = user.isLocked && !user.lockedUntil}
						<button
							class="status-badge locked clickable"
							onclick={() => onUnlock?.(user)}
							disabled={!onUnlock}
							title={onUnlock ? 'Click to unlock account' : 'Cannot unlock'}
						>
							<FontAwesomeIcon icon={faLock} />
							<span>
								{#if isPermanent}
									Permanently Locked
								{:else if isTemporary && user.lockedUntil}
									{@const minutesRemaining = Math.ceil(
										(new Date(user.lockedUntil).getTime() - Date.now()) / 60000
									)}
									Locked ({minutesRemaining}m)
								{:else}
									Locked (expiring)
								{/if}
							</span>
						</button>
					{:else}
						<div class="status-badge active">
							<FontAwesomeIcon icon={faUnlock} />
							<span>Active</span>
						</div>
					{/if}
					{#if user.requirePasswordChange}
						<div class="status-badge warning" title="Must change password on next login">
							<FontAwesomeIcon icon={faKey} />
							<span>Pwd Change Required</span>
						</div>
					{/if}
					{#if user.failedLoginAttempts && parseInt(user.failedLoginAttempts) > 0}
						<div class="status-badge warning-light" title="Failed login attempts">
							<FontAwesomeIcon icon={faExclamationTriangle} />
							<span>{user.failedLoginAttempts} failed</span>
						</div>
					{/if}
				</div>
			{:else if column.label === 'Roles'}
				<div class="roles-container">
					{#if user.roles.length > 0}
						<div class="roles-list">
							{#each user.roles as role (role.id)}
								<div class="role-badge" style="--role-color: {getRoleColor(role.name)}">
									<FontAwesomeIcon icon={getRoleIcon(role.name)} />
									<span>{role.name}</span>
									{#if canRemoveRole(role, user.roles)}
										<button
											class="remove-role-btn"
											onclick={(e) => {
												e.stopPropagation();
												onRemoveRole(user, role);
											}}
											title="Remove {role.name} role"
										>
											<FontAwesomeIcon icon={faXmarkCircle} />
										</button>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<span class="no-roles">No roles assigned</span>
					{/if}
				</div>
			{:else if column.label === 'Actions'}
				<div class="action-buttons">
					<Button
						variant="secondary"
						onClick={() => onAssignRole(user)}
						disabled={availableRolesForUser(user) === 0}
						title={availableRolesForUser(user) === 0
							? 'All roles already assigned'
							: 'Assign new role'}
					>
						<FontAwesomeIcon icon={faUserPlus} />
						<span class="button-text">Assign</span>
					</Button>
					{#if user.isDisabled && onEnable}
						<Button variant="success" onClick={() => onEnable(user)} title="Enable account">
							<FontAwesomeIcon icon={faUnlock} />
							<span class="button-text">Enable</span>
						</Button>
					{:else if !user.isDisabled && onDisable}
						<Button variant="secondary" onClick={() => onDisable(user)} title="Disable account">
							<FontAwesomeIcon icon={faLock} />
							<span class="button-text">Disable</span>
						</Button>
					{/if}
					<Button variant="secondary" onClick={() => onEdit(user)} title="Edit user">
						<FontAwesomeIcon icon={faEdit} />
						<span class="button-text">Edit</span>
					</Button>
					<Button variant="error" onClick={() => onDelete(user)} title="Delete user">
						<FontAwesomeIcon icon={faTrash} />
						<span class="button-text-hide-mobile">Delete</span>
					</Button>
				</div>
			{/if}
		{/snippet}
	</SortableTable>
</div>

<style>
	.table-container {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.table-container :global(td:last-child) {
		text-align: right;
	}

	.user-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--theme-color-1), var(--theme-color-2));
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		color: white;
		flex-shrink: 0;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.user-username {
		color: var(--text-color-2);
		font-size: 0.85rem;
	}

	.user-email {
		color: var(--text-color-3);
		font-size: 0.8rem;
	}

	.status-cell {
		min-width: 180px;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.65rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 500;
		margin-bottom: 0.25rem;
		border: 1px solid transparent;
	}

	.status-badge.clickable {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.status-badge.clickable:hover:not(:disabled) {
		transform: translateX(2px);
	}

	.status-badge.clickable:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.status-badge.active {
		background: rgba(52, 199, 89, 0.15);
		border-color: rgba(52, 199, 89, 0.3);
		color: rgb(80, 210, 110);
	}

	.status-badge.locked {
		background: rgba(255, 59, 48, 0.15);
		border-color: rgba(255, 59, 48, 0.3);
		color: rgb(255, 100, 90);
	}

	.status-badge.disabled {
		background: rgba(var(--orange), 0.15);
		border-color: rgba(var(--orange), 0.3);
		color: rgb(var(--orange));
	}

	.status-badge.warning {
		background: rgba(var(--orange), 0.15);
		border-color: rgba(var(--orange), 0.3);
		color: rgb(var(--orange));
	}

	.status-badge.warning-light {
		background: rgba(var(--orange), 0.1);
		border-color: rgba(var(--orange), 0.2);
		color: rgba(var(--orange), 0.9);
	}

	.roles-container {
		min-width: 200px;
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
		border: 1px solid var(--role-color);
		padding: 0.3rem 0.6rem;
		border-radius: 1rem;
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
		font-size: 0.9rem;
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
		font-size: 0.85rem;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
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

		.table-container :global(table),
		.table-container :global(thead),
		.table-container :global(tbody),
		.table-container :global(th),
		.table-container :global(td),
		.table-container :global(tr) {
			display: block;
		}

		.table-container :global(thead) {
			display: none;
		}

		.table-container :global(tr) {
			background: var(--background-color-2);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 0.75rem;
			margin-bottom: 1rem;
			padding: 1rem;
		}

		.table-container :global(tr:hover) {
			border-color: rgba(255, 255, 255, 0.2);
		}

		.table-container :global(td) {
			padding: 0.5rem 0;
			border: none;
		}

		.user-cell {
			padding-bottom: 1rem;
			margin-bottom: 1rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}

		.status-cell,
		.roles-container {
			min-width: 0;
			margin-bottom: 0.75rem;
		}

		.status-badge {
			display: flex;
			width: 100%;
			margin-bottom: 0.5rem;
		}

		.action-buttons {
			justify-content: flex-start;
			flex-wrap: wrap;
		}
	}
</style>
