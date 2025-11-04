<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faLock } from '@fortawesome/free-solid-svg-icons';

	const { form } = $props();

	// Password form
	let passwordForm = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	// Track unsaved changes
	let hasUnsavedChanges = $derived(
		passwordForm.currentPassword !== '' ||
			passwordForm.newPassword !== '' ||
			passwordForm.confirmPassword !== ''
	);

	// Show notifications from form actions
	$effect(() => {
		if (form?.message) {
			if (form.success) {
				notifications.success(form.message);
				// Reset password form on success
				passwordForm = {
					currentPassword: '',
					newPassword: '',
					confirmPassword: ''
				};
			} else {
				notifications.error(form.message);
			}
		}
	});
</script>

<ProfileTab
	title="Change Password"
	description="Choose a strong password to keep your account secure"
	{hasUnsavedChanges}
>
	<form
		method="POST"
		action="?/changePassword"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ reset: false });
			};
		}}
	>
		<div class="form-group">
			<label for="currentPassword">Current Password</label>
			<input
				id="currentPassword"
				type="password"
				name="currentPassword"
				bind:value={passwordForm.currentPassword}
				required
				placeholder="Enter your current password"
				autocomplete="current-password"
			/>
		</div>

		<div class="form-group">
			<label for="newPassword">New Password</label>
			<input
				id="newPassword"
				type="password"
				name="newPassword"
				bind:value={passwordForm.newPassword}
				required
				placeholder="Enter new password (min 6 characters)"
				minlength="6"
				autocomplete="new-password"
			/>
			<small>Minimum 6 characters</small>
		</div>

		<div class="form-group">
			<label for="confirmPassword">Confirm New Password</label>
			<input
				id="confirmPassword"
				type="password"
				name="confirmPassword"
				bind:value={passwordForm.confirmPassword}
				required
				placeholder="Confirm new password"
				autocomplete="new-password"
			/>
		</div>

		<div class="form-actions">
			<Button type="submit" variant="primary">
				<FontAwesomeIcon icon={faLock} />
				Update Password
			</Button>
		</div>
	</form>
</ProfileTab>

<style>
	.form-group {
		display: flex;
		flex-direction: column;
		margin-bottom: 1.5rem;
	}

	label {
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	small {
		margin-top: 0.25rem;
		color: var(--text-color-2);
		font-size: 0.85rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.form-actions {
			flex-direction: column;
		}
	}
</style>
