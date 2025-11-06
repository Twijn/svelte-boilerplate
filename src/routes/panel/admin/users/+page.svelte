<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import UserTable from '$lib/components/admin/UserTable.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { enhance } from '$app/forms';
	import { notifications } from '$lib/stores/notifications';
	import Heading from '$lib/components/layout/Heading.svelte';
	import {
		faUsers,
		faCheckCircle,
		faLock,
		faExclamationTriangle
	} from '@fortawesome/free-solid-svg-icons';
	import { APP_NAME } from '$lib/consts.js';

	type User = {
		id: string;
		firstName: string;
		lastName: string;
		username: string;
		email: string;
		requirePasswordChange: boolean;
		roles: Array<{ id: string; name: string; isSystemRole: boolean }>;
	};

	type Role = {
		id: string;
		name: string;
		isSystemRole: boolean;
	};

	const { data, form } = $props();

	// Modal state
	let showAssignModal = $state(false);
	let showRemoveModal = $state(false);
	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let showUnlockModal = $state(false);
	let showDisableModal = $state(false);
	let showEnableModal = $state(false);
	let selectedUser = $state<User | null>(null);
	let selectedRole = $state('');
	let roleToRemove = $state<Role | null>(null);
	let disableReason = $state('');

	// Form state
	let createForm = $state({
		username: '',
		email: '',
		firstName: '',
		lastName: '',
		password: '',
		requirePasswordChange: false
	});

	let editForm = $state({
		username: '',
		email: '',
		firstName: '',
		lastName: '',
		requirePasswordChange: false
	});

	// Modal handlers
	function openCreateModal() {
		createForm = {
			username: '',
			email: '',
			firstName: '',
			lastName: '',
			password: '',
			requirePasswordChange: false
		};
		showCreateModal = true;
	}

	function openEditModal(user: User) {
		selectedUser = user;
		editForm = {
			username: user.username,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			requirePasswordChange: user.requirePasswordChange
		};
		showEditModal = true;
	}

	function openDeleteModal(user: User) {
		selectedUser = user;
		showDeleteModal = true;
	}

	function openAssignModal(user: User) {
		selectedUser = user;
		selectedRole = '';
		showAssignModal = true;
	}

	function openRemoveModal(user: User, role: Role) {
		selectedUser = user;
		roleToRemove = role;
		showRemoveModal = true;
	}

	function openUnlockModal(user: User) {
		selectedUser = user;
		showUnlockModal = true;
	}

	function openDisableModal(user: User) {
		selectedUser = user;
		disableReason = '';
		showDisableModal = true;
	}

	function openEnableModal(user: User) {
		selectedUser = user;
		showEnableModal = true;
	}

	function closeModals() {
		showAssignModal = false;
		showRemoveModal = false;
		showCreateModal = false;
		showEditModal = false;
		showDeleteModal = false;
		showUnlockModal = false;
		showDisableModal = false;
		showEnableModal = false;
		selectedUser = null;
		roleToRemove = null;
		disableReason = '';
	}

	// Utility functions
	function getAvailableRoles(user: User) {
		const userRoleIds = user.roles.map((r) => r.id);
		return data.roles.filter((role: Role) => !userRoleIds.includes(role.id));
	}

	function canRemoveRole(role: Role, userRoles: Role[]) {
		return !role.isSystemRole || userRoles.length > 1;
	}

	// Show notifications from form actions
	$effect(() => {
		if (form?.message) {
			if (form.success) {
				notifications.success(form.message);
			} else {
				notifications.error(form.message);
			}
		}
	});
</script>

<svelte:head>
	<title>User Management - Admin | {APP_NAME}</title>
</svelte:head>

<Heading
	text="User Management"
	description="Manage user roles and permissions"
	buttons={[{ text: 'Create User', variant: 'primary', onClick: openCreateModal }]}
/>

<!-- Stats Cards -->
<StatCard
	icon={faUsers}
	value={data.stats.totalUsers}
	label="Total Users"
	color="blue"
	columns={3}
/>

<StatCard
	icon={faCheckCircle}
	value={data.stats.activeUsers}
	label="Active Users"
	color="green"
	columns={3}
/>

<StatCard
	icon={faLock}
	value={data.stats.lockedUsers}
	label="Locked Accounts"
	color="red"
	columns={3}
/>

<StatCard
	icon={faExclamationTriangle}
	value={data.stats.usersWithFailedLogins}
	label="Failed Login Attempts"
	color="orange"
	columns={3}
/>

<UserTable
	users={data.users}
	availableRolesForUser={(user) => getAvailableRoles(user).length}
	onAssignRole={(user) => openAssignModal(user)}
	onRemoveRole={(user, role) => openRemoveModal(user, role)}
	onEdit={(user) => openEditModal(user)}
	onDelete={(user) => openDeleteModal(user)}
	onUnlock={(user) => openUnlockModal(user)}
	onDisable={(user) => openDisableModal(user)}
	onEnable={(user) => openEnableModal(user)}
	{canRemoveRole}
/>

<!-- Modals -->
<Modal
	isOpen={showAssignModal}
	onClose={closeModals}
	title={selectedUser
		? `Assign Role to ${selectedUser.firstName} ${selectedUser.lastName}`
		: 'Assign Role'}
	size="medium"
>
	{#if selectedUser}
		<form
			method="POST"
			action="?/assignRole"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeModals();
					}
				};
			}}
		>
			<input type="hidden" name="userId" value={selectedUser.id} />

			<div class="form-group">
				<label for="role-select">Select Role:</label>
				<select id="role-select" name="roleId" bind:value={selectedRole} required>
					<option value="">Choose a role...</option>
					{#each getAvailableRoles(selectedUser) as role (role.id)}
						<option value={role.id}>{role.name}</option>
					{/each}
				</select>
			</div>

			<div class="modal-actions">
				<Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
				<Button type="submit" variant="primary" disabled={!selectedRole}>Assign Role</Button>
			</div>
		</form>
	{/if}
</Modal>

<ConfirmModal
	bind:isOpen={showRemoveModal}
	onClose={closeModals}
	onConfirm={() => {
		if (selectedUser && roleToRemove) {
			// Submit the form programmatically
			const form = document.getElementById('remove-role-form') as HTMLFormElement;
			form?.requestSubmit();
		}
	}}
	title="Remove Role"
	warning="This action cannot be undone."
	confirmText="Remove Role"
	confirmVariant="error"
>
	{#snippet messageSnippet()}
		<p>
			Are you sure you want to remove the <strong>{roleToRemove?.name}</strong> role from
			<strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
		</p>
	{/snippet}
</ConfirmModal>

{#if selectedUser && roleToRemove}
	<form
		id="remove-role-form"
		method="POST"
		action="?/removeRole"
		use:enhance
		style="display: none;"
	>
		<input type="hidden" name="userId" value={selectedUser.id} />
		<input type="hidden" name="roleId" value={roleToRemove.id} />
	</form>
{/if}

<!-- Create User Modal -->
<Modal isOpen={showCreateModal} onClose={closeModals} title="Create New User" size="medium">
	<form
		method="POST"
		action="?/createUser"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					closeModals();
				}
			};
		}}
	>
		<div class="form-group">
			<label for="create-username">Username:</label>
			<input
				id="create-username"
				type="text"
				name="username"
				bind:value={createForm.username}
				required
				placeholder="e.g., john_doe"
			/>
			<small>3-31 characters, lowercase letters, numbers, hyphens, or underscores</small>
		</div>

		<div class="form-group">
			<label for="create-email">Email Address:</label>
			<input
				id="create-email"
				type="email"
				name="email"
				bind:value={createForm.email}
				required
				placeholder="e.g., john@example.com"
			/>
		</div>

		<div class="form-group">
			<label for="create-firstName">First Name:</label>
			<input
				id="create-firstName"
				type="text"
				name="firstName"
				bind:value={createForm.firstName}
				required
				placeholder="e.g., John"
			/>
		</div>

		<div class="form-group">
			<label for="create-lastName">Last Name:</label>
			<input
				id="create-lastName"
				type="text"
				name="lastName"
				bind:value={createForm.lastName}
				required
				placeholder="e.g., Doe"
			/>
		</div>

		<div class="form-group">
			<label for="create-password">Password:</label>
			<input
				id="create-password"
				type="password"
				name="password"
				bind:value={createForm.password}
				required
				placeholder="Minimum 6 characters"
			/>
		</div>

		<div class="form-group checkbox-group">
			<label>
				<input
					type="checkbox"
					name="requirePasswordChange"
					value="true"
					bind:checked={createForm.requirePasswordChange}
				/>
				Require password change on next login
			</label>
			<small>User will be prompted to change their password when they first log in</small>
		</div>

		<div class="modal-actions">
			<Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
			<Button type="submit" variant="primary">Create User</Button>
		</div>
	</form>
</Modal>

<!-- Edit User Modal -->
<Modal
	bind:isOpen={showEditModal}
	onClose={closeModals}
	title={selectedUser ? `Edit ${selectedUser.firstName} ${selectedUser.lastName}` : 'Edit User'}
	size="medium"
>
	{#if selectedUser}
		<form
			method="POST"
			action="?/updateUser"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						closeModals();
					}
				};
			}}
		>
			<input type="hidden" name="userId" value={selectedUser.id} />

			<div class="form-group">
				<label for="edit-username">Username:</label>
				<input
					id="edit-username"
					type="text"
					name="username"
					bind:value={editForm.username}
					required
					placeholder="e.g., john_doe"
				/>
				<small>3-31 characters, lowercase letters, numbers, hyphens, or underscores</small>
			</div>

			<div class="form-group">
				<label for="edit-email">Email Address:</label>
				<input
					id="edit-email"
					type="email"
					name="email"
					bind:value={editForm.email}
					required
					placeholder="e.g., john@example.com"
				/>
			</div>

			<div class="form-group">
				<label for="edit-firstName">First Name:</label>
				<input
					id="edit-firstName"
					type="text"
					name="firstName"
					bind:value={editForm.firstName}
					required
					placeholder="e.g., John"
				/>
			</div>

			<div class="form-group">
				<label for="edit-lastName">Last Name:</label>
				<input
					id="edit-lastName"
					type="text"
					name="lastName"
					bind:value={editForm.lastName}
					required
					placeholder="e.g., Doe"
				/>
			</div>

			<div class="form-group checkbox-group">
				<label>
					<input
						type="checkbox"
						name="requirePasswordChange"
						value="true"
						bind:checked={editForm.requirePasswordChange}
					/>
					Require password change on next login
				</label>
				<small>User will be prompted to change their password when they next log in</small>
			</div>

			<div class="modal-actions">
				<Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
				<Button type="submit" variant="primary">Save Changes</Button>
			</div>
		</form>
	{/if}
</Modal>

<!-- Delete User Confirmation -->
<ConfirmModal
	bind:isOpen={showDeleteModal}
	onClose={closeModals}
	onConfirm={() => {
		if (selectedUser) {
			const form = document.getElementById('delete-user-form') as HTMLFormElement;
			form?.requestSubmit();
		}
	}}
	title="Delete User"
	warning="This action cannot be undone. All user data, roles, and sessions will be permanently deleted."
	confirmText="Delete User"
	confirmVariant="error"
>
	{#snippet messageSnippet()}
		{#if selectedUser}
			Are you sure you want to delete <strong
				>{selectedUser.firstName} {selectedUser.lastName}</strong
			>?
		{:else}
			No selected user.
		{/if}
	{/snippet}
</ConfirmModal>

{#if selectedUser}
	<form
		id="delete-user-form"
		method="POST"
		action="?/deleteUser"
		use:enhance
		style="display: none;"
	>
		<input type="hidden" name="userId" value={selectedUser.id} />
	</form>
{/if}

<!-- Disable User Modal -->
<Modal isOpen={showDisableModal} onClose={closeModals} title="Disable Account">
	{#if selectedUser}
		<form
			id="disable-user-form"
			method="POST"
			action="?/disableUser"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						notifications.success('Account disabled successfully');
						closeModals();
					} else if (result.type === 'failure') {
						const message =
							(result.data as { message?: string })?.message || 'Failed to disable account';
						notifications.error(message);
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="userId" value={selectedUser.id} />

			<p>
				Are you sure you want to disable <strong
					>{selectedUser.firstName} {selectedUser.lastName}</strong
				>'s account? They will be logged out from all devices and unable to log in.
			</p>

			<div class="form-group">
				<label for="disable-reason">Reason (optional)</label>
				<input
					type="text"
					id="disable-reason"
					name="reason"
					bind:value={disableReason}
					placeholder="e.g., Account under review"
					maxlength="200"
				/>
			</div>

			<div class="modal-actions">
				<Button variant="secondary" onClick={closeModals}>Cancel</Button>
				<Button variant="error" type="submit">Disable Account</Button>
			</div>
		</form>
	{/if}
</Modal>

<!-- Enable User Confirmation -->
<ConfirmModal
	bind:isOpen={showEnableModal}
	onClose={closeModals}
	onConfirm={() => {
		if (selectedUser) {
			const form = document.getElementById('enable-user-form') as HTMLFormElement;
			form?.requestSubmit();
		}
	}}
	title="Enable Account"
	confirmText="Enable Account"
	confirmVariant="success"
>
	{#snippet messageSnippet()}
		{#if selectedUser}
			Are you sure you want to enable <strong
				>{selectedUser.firstName} {selectedUser.lastName}</strong
			>'s account? They will be able to log in again.
		{:else}
			No selected user.
		{/if}
	{/snippet}
</ConfirmModal>

{#if selectedUser}
	<form
		id="enable-user-form"
		method="POST"
		action="?/enableUser"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					notifications.success('Account enabled successfully');
					closeModals();
				} else if (result.type === 'failure') {
					const message =
						(result.data as { message?: string })?.message || 'Failed to enable account';
					notifications.error(message);
				}
				await update();
			};
		}}
		style="display: none;"
	>
		<input type="hidden" name="userId" value={selectedUser.id} />
	</form>
{/if}

<!-- Unlock User Confirmation -->
<ConfirmModal
	bind:isOpen={showUnlockModal}
	onClose={closeModals}
	onConfirm={() => {
		if (selectedUser) {
			const form = document.getElementById('unlock-user-form') as HTMLFormElement;
			form?.requestSubmit();
		}
	}}
	title="Unlock Account"
	confirmText="Unlock Account"
	confirmVariant="primary"
>
	{#snippet messageSnippet()}
		{#if selectedUser}
			Are you sure you want to unlock <strong
				>{selectedUser.firstName} {selectedUser.lastName}</strong
			>'s account?
		{:else}
			No selected user.
		{/if}
	{/snippet}
</ConfirmModal>

{#if selectedUser}
	<form
		id="unlock-user-form"
		method="POST"
		action="?/unlockUser"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					notifications.success('Account unlocked successfully');
					closeModals();
				} else if (result.type === 'failure') {
					const message =
						(result.data as { message?: string })?.message || 'Failed to unlock account';
					notifications.error(message);
				}
				await update();
			};
		}}
		style="display: none;"
	>
		<input type="hidden" name="userId" value={selectedUser.id} />
	</form>
{/if}

<style>
	/* Form Styles */
	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		color: var(--text-color-1);
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.form-group select {
		width: 100%;
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem;
		color: var(--text-color-1);
		font-size: 1rem;
		font-family: inherit;
	}

	.form-group select:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);
	}

	.checkbox-group {
		padding: 1rem;
		background: rgba(var(--theme-color-rgb), 0.05);
		border-radius: 0.5rem;
		border: 1px solid rgba(var(--theme-color-rgb), 0.2);
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		margin-bottom: 0.25rem;
	}

	.checkbox-group input[type='checkbox'] {
		width: auto;
		cursor: pointer;
	}

	.checkbox-group small {
		display: block;
		color: var(--text-color-2);
		font-size: 0.875rem;
		margin-top: 0.25rem;
		margin-left: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	@media (max-width: 768px) {
		.modal-actions {
			flex-direction: column-reverse;
		}
	}
</style>
