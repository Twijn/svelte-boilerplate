<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrash, faWarning } from '@fortawesome/free-solid-svg-icons';

	let showDeleteModal = $state(false);
</script>

<ProfileTab title="Danger Zone" description="Irreversible and destructive actions">
	<div class="danger-content">
		<p class="warning-text">
			<FontAwesomeIcon icon={faWarning} />
			Once you delete your account, there is no going back. This action is permanent and cannot be undone.
		</p>

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
