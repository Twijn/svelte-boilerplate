<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import Heading from '$lib/components/layout/Heading.svelte';
	import { enhance } from '$app/forms';
	import { notifications } from '$lib/stores/notifications';
	import { faLock, faLockOpen, faUserSlash, faClock } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	const { data, form } = $props();

	let showUnlockModal = $state(false);
	let selectedUserId = $state<string | null>(null);
	let selectedUserName = $state<string>('');

	function openUnlockModal(userId: string, userName: string) {
		selectedUserId = userId;
		selectedUserName = userName;
		showUnlockModal = true;
	}

	function closeModal() {
		showUnlockModal = false;
		selectedUserId = null;
		selectedUserName = '';
	}

	function formatTimeRemaining(lockedUntil: Date | null): string {
		if (!lockedUntil) return 'Permanent';

		const now = new Date();
		const diff = lockedUntil.getTime() - now.getTime();

		if (diff <= 0) return 'Expired (auto-unlocking)';

		const minutes = Math.ceil(diff / 60000);
		if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}m`;
	}

	// Show notifications from form actions
	$effect(() => {
		if (form?.message) {
			if (form.success) {
				notifications.success(form.message);
				closeModal();
			} else {
				notifications.error(form.message);
			}
		}
	});
</script>

<svelte:head>
	<title>Locked Accounts - Admin</title>
</svelte:head>

<Heading
	text="Locked Accounts"
	description="Manage user accounts that have been locked due to security reasons"
/>

{#if data.lockedAccounts.length === 0}
	<div class="empty-state col-12">
		<div class="empty-icon">
			<FontAwesomeIcon icon={faLockOpen} size="3x" />
		</div>
		<h3>No Locked Accounts</h3>
		<p>All user accounts are currently unlocked and accessible.</p>
	</div>
{:else}
	{#each data.lockedAccounts as account (account.id)}
		{@const initials = `${account.firstName.charAt(0)}${account.lastName.charAt(0)}`.toUpperCase()}
		<div class="col-6 col-md-12 col-sm-12">
			<Card
				name="{account.firstName} {account.lastName}"
				description="@{account.username}"
				{initials}
				initialsTitle="{account.firstName} {account.lastName}"
			>
				{#snippet children()}
					<div class="account-info">
						<div class="info-row">
							<FontAwesomeIcon icon={faUserSlash} />
							<div>
								<strong>Email:</strong>
								<span>{account.email}</span>
							</div>
						</div>

						<div class="info-row">
							<FontAwesomeIcon icon={faLock} />
							<div>
								<strong>Status:</strong>
								<span class="status-badge locked">
									{account.lockedUntil ? 'Temporarily Locked' : 'Permanently Locked'}
								</span>
							</div>
						</div>

						{#if account.lockedUntil}
							<div class="info-row">
								<FontAwesomeIcon icon={faClock} />
								<div>
									<strong>Unlocks in:</strong>
									<span>{formatTimeRemaining(account.lockedUntil)}</span>
								</div>
							</div>
						{/if}

						<div class="info-row">
							<FontAwesomeIcon icon={faLock} />
							<div>
								<strong>Failed Attempts:</strong>
								<span>{account.failedLoginAttempts}</span>
							</div>
						</div>

						{#if account.lockedAt}
							<div class="info-row">
								<FontAwesomeIcon icon={faClock} />
								<div>
									<strong>Locked At:</strong>
									<span>{new Date(account.lockedAt).toLocaleString()}</span>
								</div>
							</div>
						{/if}
					</div>

					<div class="account-actions">
						<Button
							variant="primary"
							onClick={() =>
								openUnlockModal(
									account.id,
									`${account.firstName} ${account.lastName} (@${account.username})`
								)}
						>
							<FontAwesomeIcon icon={faLockOpen} />
							Unlock Account
						</Button>
					</div>
				{/snippet}
			</Card>
		</div>
	{/each}
{/if}

<!-- Unlock Confirmation Modal -->
<ConfirmModal
	bind:isOpen={showUnlockModal}
	onClose={closeModal}
	onConfirm={() => {
		if (selectedUserId) {
			const form = document.getElementById('unlock-form') as HTMLFormElement;
			form?.requestSubmit();
		}
	}}
	title="Unlock Account"
	message="Are you sure you want to unlock the account for <strong>{selectedUserName}</strong>?"
	confirmText="Unlock Account"
	confirmVariant="primary"
/>

{#if selectedUserId}
	<form id="unlock-form" method="POST" action="?/unlock" use:enhance style="display: none;">
		<input type="hidden" name="userId" value={selectedUserId} />
	</form>
{/if}

<style>
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--text-color-2);
	}

	.empty-icon {
		color: var(--theme-color-2);
		margin-bottom: 1.5rem;
		opacity: 0.7;
	}

	.empty-state h3 {
		color: var(--text-color-1);
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 1rem;
	}

	.account-info {
		margin-bottom: 1rem;
	}

	.info-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		color: var(--text-color-2);
		font-size: 0.9rem;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-row :global(svg) {
		color: var(--theme-color-2);
		margin-top: 0.2rem;
		flex-shrink: 0;
	}

	.info-row div {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.info-row strong {
		color: var(--text-color-1);
		font-size: 0.85rem;
	}

	.info-row span {
		color: var(--text-color-2);
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.status-badge.locked {
		background: rgba(var(--red), 0.2);
		color: rgb(var(--red));
		border: 1px solid rgba(var(--red), 0.3);
	}

	.account-actions {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
