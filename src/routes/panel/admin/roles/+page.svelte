<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import RoleCard from '$lib/components/admin/RoleCard.svelte';
	import PermissionSelector from '$lib/components/ui/PermissionSelector.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { enhance } from '$app/forms';
	import { notifications } from '$lib/stores/notifications';
	import Heading from '$lib/components/layout/Heading.svelte';
	import { APP_NAME } from '$lib/consts.js';
	import {
		faWarning,
		faShield,
		faCog,
		faLayerGroup,
		faUserTag
	} from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

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

	const { data, form } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedRole = $state<Role | null>(null);
	let newRoleName = $state('');
	let newRoleDescription = $state('');
	let selectedPermissions = $state<string[]>([]);

	function openCreateModal() {
		newRoleName = '';
		newRoleDescription = '';
		selectedPermissions = [];
		showCreateModal = true;
	}

	function openEditModal(role: Role) {
		selectedRole = role;
		newRoleName = role.name;
		newRoleDescription = role.description || '';
		selectedPermissions = [...role.permissions];
		showEditModal = true;
	}

	// Check if role can be edited (not super admin)
	function canEditRole(role: Role): boolean {
		return role.id !== 'super-admin';
	}

	function openDeleteModal(role: Role) {
		selectedRole = role;
		showDeleteModal = true;
	}

	function closeModals() {
		showCreateModal = false;
		showEditModal = false;
		showDeleteModal = false;
		selectedRole = null;
		newRoleName = '';
		newRoleDescription = '';
		selectedPermissions = [];
	}

	// Show notifications from form actions and close modals on success
	$effect(() => {
		if (form?.message) {
			if (form.success) {
				notifications.success(form.message);
				closeModals(); // Close modal after successful action
			} else {
				notifications.error(form.message);
			}
		}
	});
</script>

<svelte:head>
	<title>Role Management - Admin | {APP_NAME}</title>
</svelte:head>

<Heading
	text="Role Management"
	description="Create and manage user roles and permissions"
	buttons={[
		{
			text: 'Create Role',
			variant: 'primary',
			onClick: openCreateModal
		}
	]}
/>

<!-- Stats Cards -->
<div class="col-3 col-md-6 col-sm-12">
	<StatCard icon={faShield} value={data.stats.totalRoles} label="Total Roles" color="blue" />
</div>

<div class="col-3 col-md-6 col-sm-12">
	<StatCard icon={faCog} value={data.stats.systemRoles} label="System Roles" color="orange" />
</div>

<div class="col-3 col-md-6 col-sm-12">
	<StatCard
		icon={faLayerGroup}
		value={data.stats.customRoles}
		label="Custom Roles"
		color="purple"
	/>
</div>

<div class="col-3 col-md-6 col-sm-12">
	<StatCard
		icon={faUserTag}
		value={data.stats.totalAssignments}
		label="Total Assignments"
		color="green"
	/>
</div>

{#each data.roles as role (role.id)}
	<div class="col-4 col-md-6 col-sm-12">
		<RoleCard {role} onEdit={() => openEditModal(role)} onDelete={() => openDeleteModal(role)} />
	</div>
{/each}

<!-- Create Role Modal -->
<Modal bind:isOpen={showCreateModal} onClose={closeModals} title="Create New Role" size="large">
	<form method="POST" action="?/createRole" use:enhance>
		<div class="form-group">
			<label for="role-name">Role Name:</label>
			<input
				id="role-name"
				name="name"
				type="text"
				bind:value={newRoleName}
				placeholder="e.g., Content Manager"
				required
			/>
		</div>

		<div class="form-group">
			<label for="role-description">Description (optional):</label>
			<textarea
				id="role-description"
				name="description"
				bind:value={newRoleDescription}
				placeholder="Brief description of this role's purpose"
				rows="3"
			></textarea>
		</div>

		<div class="form-group">
			<div class="form-label">Permissions:</div>
			<PermissionSelector bind:selected={selectedPermissions} />
			<!-- Hidden inputs for form submission -->
			{#each selectedPermissions as permission}
				<input type="hidden" name="permissions" value={permission} />
			{/each}
		</div>

		<div class="modal-actions">
			<Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
			<Button
				type="submit"
				variant="primary"
				disabled={!newRoleName.trim() || selectedPermissions.length === 0}
			>
				Create Role
			</Button>
		</div>
	</form>
</Modal>

<!-- Edit Role Modal -->
<Modal
	isOpen={showEditModal && !!selectedRole}
	onClose={closeModals}
	title={selectedRole ? `Edit Role: ${selectedRole.name}` : ''}
	size="large"
>
	{#if selectedRole}
		{@const isLocked = !canEditRole(selectedRole)}
		<form method="POST" action="?/updateRole" use:enhance>
			<input type="hidden" name="roleId" value={selectedRole.id} />

			{#if isLocked}
				<div class="warning-banner">
					<strong>Super Admin Role</strong>
					<p>The Super Admin role cannot be modified to maintain system security.</p>
				</div>
			{/if}

			<div class="form-group">
				<label for="edit-role-name">Role Name:</label>
				<input
					id="edit-role-name"
					type="text"
					name="name"
					bind:value={newRoleName}
					required
					placeholder="e.g., Editor"
					disabled={isLocked ||
						(selectedRole.isSystemRole &&
							selectedRole.id !== 'admin' &&
							selectedRole.id !== 'user')}
				/>
				{#if selectedRole.isSystemRole && !isLocked}
					<small
						><FontAwesomeIcon icon={faWarning} /> Changing system role names may affect existing code
						references</small
					>
				{/if}
			</div>

			<div class="form-group">
				<label for="edit-role-description">Description:</label>
				<textarea
					id="edit-role-description"
					name="description"
					bind:value={newRoleDescription}
					rows="3"
					placeholder="e.g., Can edit content but cannot publish"
					disabled={isLocked}
				></textarea>
			</div>

			<div class="form-group">
				<div class="form-label">Permissions:</div>
				<PermissionSelector bind:selected={selectedPermissions} disabled={isLocked} />
				<!-- Hidden inputs for form submission -->
				{#each selectedPermissions as permission}
					<input type="hidden" name="permissions" value={permission} />
				{/each}
			</div>

			<div class="modal-actions">
				<Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
				<Button
					type="submit"
					variant="primary"
					disabled={selectedPermissions.length === 0 || isLocked}
				>
					Update Role
				</Button>
			</div>
		</form>
	{/if}
</Modal>

<!-- Delete Role Modal -->
{#if selectedRole}
	<ConfirmModal
		bind:isOpen={showDeleteModal}
		onClose={closeModals}
		title="Delete Role"
		message={`Are you sure you want to delete the <strong>${selectedRole.name}</strong> role?`}
		warning="This action cannot be undone."
		confirmText="Delete Role"
		confirmVariant="error"
		onConfirm={() => {
			const form = document.querySelector('form[action="?/deleteRole"]') as HTMLFormElement;
			if (form) form.requestSubmit();
		}}
	/>

	<form method="POST" action="?/deleteRole" use:enhance style="display: none;">
		<input type="hidden" name="roleId" value={selectedRole.id} />
	</form>
{/if}

<style>
	/* Form Styles */

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label,
	.form-label {
		display: block;
		color: var(--text-color-1);
		font-weight: 500;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem;
		color: var(--text-color-1);
		font-size: 1rem;
		font-family: inherit;
		resize: vertical;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);
	}

	.form-group small {
		display: block;
		margin-top: 0.25rem;
		color: var(--text-color-3);
		font-size: 0.85rem;
	}

	.warning-banner {
		background: rgba(255, 165, 0, 0.1);
		border: 1px solid rgba(255, 165, 0, 0.3);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.warning-banner strong {
		color: rgb(var(--orange));
		display: block;
		margin-bottom: 0.25rem;
	}

	.warning-banner p {
		color: var(--text-color-2);
		margin: 0;
		font-size: 0.9rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}
</style>
