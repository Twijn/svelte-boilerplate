<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrash, faWarning, faBan } from '@fortawesome/free-solid-svg-icons';

	let showDeleteModal = $state(false);
	let showDisableModal = $state(false);
</script>

<ProfileTab title="Danger Zone" description="Irreversible and destructive actions">
	<div class="danger-content">
		<p class="warning-text">
			<FontAwesomeIcon icon={faWarning} />
			Actions in this section are destructive and may be irreversible. Proceed with caution.
		</p>

		<div class="danger-item">
			<div class="danger-info">
				<h4>Disable Account</h4>
				<p>
					Temporarily disable your account. You won't be able to log in until an admin re-enables
					it.
				</p>
			</div>
			<Button variant="error" onClick={() => (showDisableModal = true)}>
				<FontAwesomeIcon icon={faBan} />
				Disable Account
			</Button>
		</div>

		<div class="danger-item">
			<div class="danger-info">
				<h4>Delete Account</h4>
				<p>Permanently delete your account and all associated data</p>
			</div>
			<Button variant="error" onClick={() => (showDeleteModal = true)}>
				<FontAwesomeIcon icon={faTrash} />
				Delete Account
			</Button>
		</div>
	</div>
</ProfileTab>

<!-- Disable Confirmation Modal -->
<ConfirmModal
	bind:isOpen={showDisableModal}
	onClose={() => (showDisableModal = false)}
	onConfirm={() => {
		const form = document.getElementById('disable-account-form') as HTMLFormElement;
		form?.requestSubmit();
	}}
	title="Disable Account"
	warning="You will be logged out and unable to log back in until an administrator re-enables your account."
	confirmText="Disable My Account"
	confirmVariant="error"
>
	{#snippet messageSnippet()}
		<p>Are you sure you want to disable your account? This will:</p>
		<ul>
			<li>Log you out from all devices</li>
			<li>Prevent you from logging in</li>
			<li>Require admin intervention to re-enable</li>
		</ul>
		<p>Your data will remain intact and can be restored when your account is re-enabled.</p>
	{/snippet}
</ConfirmModal>

<!-- Delete Confirmation Modal -->
<ConfirmModal
	bind:isOpen={showDeleteModal}
	onClose={() => (showDeleteModal = false)}
	onConfirm={() => {
		const form = document.getElementById('delete-account-form') as HTMLFormElement;
		form?.requestSubmit();
	}}
	title="Delete Account"
	warning="This action is permanent and cannot be undone. All your data will be permanently deleted."
	confirmText="Delete My Account"
	confirmVariant="error"
>
	{#snippet messageSnippet()}
		<p>
			Are you absolutely sure you want to delete your account? This will permanently remove all your
			data including:
		</p>
		<ul>
			<li>Profile information</li>
			<li>Activity history</li>
			<li>All associated data</li>
		</ul>
	{/snippet}
</ConfirmModal>

<form
	id="disable-account-form"
	method="POST"
	action="?/disableAccount"
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'success') {
				// Redirect to login page after successful disable
				await goto('/login');
			}
		};
	}}
	style="display: none;"
></form>

<form
	id="delete-account-form"
	method="POST"
	action="?/deleteAccount"
	use:enhance
	style="display: none;"
></form>

<style>
	.danger-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.warning-text {
		color: rgb(var(--red));
		background: rgba(var(--red), 0.1);
		border: 1px solid rgba(var(--red), 0.3);
		border-radius: 0.5rem;
		padding: 1rem;
		margin: 0;
	}

	.danger-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		background: rgba(var(--red), 0.05);
		border: 1px solid rgba(var(--red), 0.2);
		border-radius: 0.5rem;
	}

	.danger-info h4 {
		margin: 0 0 0.5rem 0;
		color: var(--text-color-1);
	}

	.danger-info p {
		margin: 0;
		color: var(--text-color-2);
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.danger-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>
