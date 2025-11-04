<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import RoleCard from '$lib/components/admin/RoleCard.svelte';
	import { enhance } from '$app/forms';
	import { notifications } from '$lib/stores/notifications';
	import Heading from '$lib/components/layout/Heading.svelte';
	import { APP_NAME } from '$lib/consts.js';

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

	function togglePermission(permission: string) {
		if (selectedPermissions.includes(permission)) {
			selectedPermissions = selectedPermissions.filter((p) => p !== permission);
		} else {
			selectedPermissions = [...selectedPermissions, permission];
		}
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

{#each data.roles as role (role.id)}
	<div class="col-4 col-md-6 col-sm-12">
		<RoleCard {role} onEdit={() => openEditModal(role)} onDelete={() => openDeleteModal(role)} />
	</div>
{/each}

<!-- Create Role Modal -->
<Modal bind:isOpen={showCreateModal} onClose={closeModals} title="Create New Role" size="medium">
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
			<div class="permissions-grid">
				{#each data.availablePermissions as permission}
					<label class="permission-checkbox">
						<input
							type="checkbox"
							name="permissions"
							value={permission.value}
							checked={selectedPermissions.includes(permission.value)}
							onchange={() => togglePermission(permission.value)}
						/>
						<span>{permission.label}</span>
					</label>
				{/each}
			</div>
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
	size="medium"
>
	{#if selectedRole}
		<form method="POST" action="?/updateRole" use:enhance>
			<input type="hidden" name="roleId" value={selectedRole.id} />

			<div class="form-group">
				<label for="edit-role-name">Role Name:</label>
				<input
					id="edit-role-name"
					type="text"
					name="name"
					bind:value={newRoleName}
					required
					placeholder="e.g., Editor"
					disabled={selectedRole.isSystemRole}
				/>
				{#if selectedRole.isSystemRole}
					<small style="color: rgb(var(--orange));">System role names cannot be changed</small>
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
					disabled={selectedRole.isSystemRole}
				></textarea>
				{#if selectedRole.isSystemRole}
					<small style="color: rgb(var(--orange));"
						>System role descriptions cannot be changed</small
					>
				{/if}
			</div>

			<div class="form-group">
				<div class="form-label">Permissions:</div>
				<div class="permissions-grid">
					{#each data.availablePermissions as permission}
						<label class="permission-checkbox">
							<input
								type="checkbox"
								name="permissions"
								value={permission.value}
								checked={selectedPermissions.includes(permission.value)}
								onchange={() => togglePermission(permission.value)}
								disabled={selectedRole.isSystemRole}
							/>
							<span>{permission.label}</span>
						</label>
					{/each}
				</div>
				{#if selectedRole.isSystemRole}
					<small style="color: rgb(var(--orange)); margin-top: 0.5rem; display: block;">
						System role permissions cannot be modified
					</small>
				{/if}
			</div>

			<div class="modal-actions">
				<Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
				<Button
					type="submit"
					variant="primary"
					disabled={selectedPermissions.length === 0 || selectedRole.isSystemRole}
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

	.permissions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.permission-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.permission-checkbox:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.permission-checkbox input[type='checkbox'] {
		width: auto;
		margin: 0;
	}

	.permission-checkbox span {
		color: var(--text-color-2);
		font-size: 0.9rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	@media (max-width: 768px) {
		.permissions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
