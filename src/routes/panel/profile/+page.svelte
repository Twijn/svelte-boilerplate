<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import Heading from '$lib/components/layout/Heading.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import AvatarUpload from '$lib/components/ui/AvatarUpload.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUser,
		faLock,
		faEnvelope,
		faTrash,
		faSave,
		faExclamationTriangle,
		faShieldAlt,
		faCopy,
		faCheck
	} from '@fortawesome/free-solid-svg-icons';
	import { APP_NAME } from '$lib/consts';
	import TotpInput from '$lib/components/ui/TotpInput.svelte';

	const { data, form } = $props();

	let activeTab = $state<'profile' | 'password' | 'email' | 'security' | 'danger'>('profile');
	let showDeleteModal = $state(false);
	let selectedFile = $state<File | null>(null);
	let deleteAvatar = $state(false);

	// 2FA state
	let show2FASetup = $state(!!data.qrCode); // Show setup if QR code is present
	let totpCode = $state('');
	let backupCodesCopied = $state(false);

	// Update show2FASetup when data changes
	$effect(() => {
		if (data.qrCode) {
			show2FASetup = true;
		}
	});

	// Profile form
	let profileForm = $state({
		firstName: data.user.firstName,
		lastName: data.user.lastName,
		username: data.user.username,
		bio: data.user.bio || '',
		location: data.user.location || '',
		website: data.user.website || ''
	});

	// Password form
	let passwordForm = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	// Email form
	let emailForm = $state({
		newEmail: '',
		password: ''
	});

	function handleFileSelect(file: File) {
		selectedFile = file;
		deleteAvatar = false;
	}

	function handleAvatarDelete() {
		selectedFile = null;
		deleteAvatar = true;
	}

	function handleTotpComplete(code: string) {
		totpCode = code;
	}

	function copyBackupCodes() {
		if (data.backupCodes) {
			const codesText = data.backupCodes.join('\n');
			navigator.clipboard.writeText(codesText);
			backupCodesCopied = true;
			notifications.success('Backup codes copied to clipboard');
			setTimeout(() => {
				backupCodesCopied = false;
			}, 3000);
		}
	}

	// Show notifications from form actions
	$effect(() => {
		if (form?.message) {
			if (form.success) {
				notifications.success(form.message);
				// Reset password form on success
				if (form.action === 'changePassword') {
					passwordForm = {
						currentPassword: '',
						newPassword: '',
						confirmPassword: ''
					};
				}
				// Reset email form on success
				if (form.action === 'changeEmail') {
					emailForm = {
						newEmail: '',
						password: ''
					};
				}
				// Reset profile form state after update
				if (form.action === 'updateProfile') {
					selectedFile = null;
					deleteAvatar = false;
				}
				// Hide 2FA setup on disable or verify
				if (form.action === 'disable2FA' || form.action === 'verify2FA') {
					show2FASetup = false;
					totpCode = '';
				}
			} else {
				notifications.error(form.message);
			}
		}
	});
</script>

<svelte:head>
	<title>Profile Settings | {APP_NAME}</title>
</svelte:head>

<Heading text="Profile Settings" description="Manage your account settings and preferences" />

<!-- Tab Navigation -->
<div class="tabs col-12">
	<button
		class="tab"
		class:active={activeTab === 'profile'}
		onclick={() => (activeTab = 'profile')}
	>
		<FontAwesomeIcon icon={faUser} />
		Profile
	</button>
	<button
		class="tab"
		class:active={activeTab === 'password'}
		onclick={() => (activeTab = 'password')}
	>
		<FontAwesomeIcon icon={faLock} />
		Password
	</button>
	<button class="tab" class:active={activeTab === 'email'} onclick={() => (activeTab = 'email')}>
		<FontAwesomeIcon icon={faEnvelope} />
		Email
	</button>
	<button
		class="tab"
		class:active={activeTab === 'security'}
		onclick={() => (activeTab = 'security')}
	>
		<FontAwesomeIcon icon={faShieldAlt} />
		Security
	</button>
	<button
		class="tab danger"
		class:active={activeTab === 'danger'}
		onclick={() => (activeTab = 'danger')}
	>
		<FontAwesomeIcon icon={faExclamationTriangle} />
		Danger Zone
	</button>
</div>

<!-- Profile Tab -->
{#if activeTab === 'profile'}
	<div class="col-12">
		<div class="card-container">
			<form
				method="POST"
				action="?/updateProfile"
				enctype="multipart/form-data"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
					};
				}}
			>
				<div class="profile-header">
					<AvatarUpload
						currentAvatar={data.user.avatar}
						size="medium"
						editable={true}
						onFileSelect={handleFileSelect}
						onDelete={handleAvatarDelete}
					/>
					<div class="profile-info">
						<h2>{data.user.firstName} {data.user.lastName}</h2>
						<p class="username">@{data.user.username}</p>
						<p class="email">{data.user.email}</p>
					</div>
				</div>

				{#if deleteAvatar}
					<input type="hidden" name="deleteAvatar" value="true" />
				{/if}

				<div class="form-grid">
					<div class="form-group">
						<label for="firstName">First Name</label>
						<input
							id="firstName"
							type="text"
							name="firstName"
							bind:value={profileForm.firstName}
							required
							placeholder="John"
						/>
					</div>

					<div class="form-group">
						<label for="lastName">Last Name</label>
						<input
							id="lastName"
							type="text"
							name="lastName"
							bind:value={profileForm.lastName}
							required
							placeholder="Doe"
						/>
					</div>

					<div class="form-group full-width">
						<label for="username">Username</label>
						<input
							id="username"
							type="text"
							name="username"
							bind:value={profileForm.username}
							required
							placeholder="johndoe"
							pattern="[a-z0-9_-]&#123;3,31&#125;"
							title="3-31 characters, lowercase letters, numbers, hyphens, or underscores"
						/>
						<small>3-31 characters, lowercase letters, numbers, hyphens, or underscores</small>
					</div>

					<div class="form-group full-width">
						<label for="bio">Bio</label>
						<textarea
							id="bio"
							name="bio"
							bind:value={profileForm.bio}
							rows="4"
							placeholder="Tell us about yourself..."
							maxlength="500"
						></textarea>
						<small>{profileForm.bio.length}/500 characters</small>
					</div>

					<div class="form-group">
						<label for="location">Location</label>
						<input
							id="location"
							type="text"
							name="location"
							bind:value={profileForm.location}
							placeholder="San Francisco, CA"
						/>
					</div>

					<div class="form-group">
						<label for="website">Website</label>
						<input
							id="website"
							type="url"
							name="website"
							bind:value={profileForm.website}
							placeholder="https://example.com"
						/>
					</div>
				</div>

				<div class="form-actions">
					<Button type="submit" variant="primary">
						<FontAwesomeIcon icon={faSave} />
						Save Changes
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Password Tab -->
{#if activeTab === 'password'}
	<div class="col-12">
		<div class="card-container">
			<h3>Change Password</h3>
			<p class="text-muted">Choose a strong password to keep your account secure</p>

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
		</div>
	</div>
{/if}

<!-- Email Tab -->
{#if activeTab === 'email'}
	<div class="col-12">
		<div class="card-container">
			<h3>Change Email Address</h3>
			<p class="text-muted">
				We'll send a verification email to your new address. Your current email: <strong
					>{data.user.email}</strong
				>
			</p>

			<form
				method="POST"
				action="?/changeEmail"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: false });
					};
				}}
			>
				<div class="form-group">
					<label for="newEmail">New Email Address</label>
					<input
						id="newEmail"
						type="email"
						name="newEmail"
						bind:value={emailForm.newEmail}
						required
						placeholder="newemail@example.com"
					/>
				</div>

				<div class="form-group">
					<label for="password">Confirm Password</label>
					<input
						id="password"
						type="password"
						name="password"
						bind:value={emailForm.password}
						required
						placeholder="Enter your password to confirm"
						autocomplete="current-password"
					/>
				</div>

				<div class="form-actions">
					<Button type="submit" variant="primary">
						<FontAwesomeIcon icon={faEnvelope} />
						Send Verification Email
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Security Tab -->
{#if activeTab === 'security'}
	<div class="col-12">
		<div class="card-container">
			<h3>Two-Factor Authentication (2FA)</h3>
			<p class="text-muted">
				Add an extra layer of security to your account using a time-based one-time password (TOTP)
				authenticator app.
			</p>

			{#if data.user.twoFactorEnabled}
				<!-- 2FA is enabled -->
				<div class="twofa-status enabled">
					<div class="status-icon">
						<FontAwesomeIcon icon={faShieldAlt} size="2x" />
					</div>
					<div class="status-content">
						<h4>Two-Factor Authentication is Enabled</h4>
						<p>Your account is protected with 2FA</p>
					</div>
				</div>

				<form
					method="POST"
					action="?/disable2FA"
					use:enhance={() => {
						return async ({ update }) => {
							await update({ reset: false });
						};
					}}
				>
					<div class="form-group">
						<label for="disable2FAPassword">Confirm Your Password</label>
						<input
							id="disable2FAPassword"
							type="password"
							name="password"
							required
							placeholder="Enter your password to disable 2FA"
							autocomplete="current-password"
						/>
					</div>

					<div class="form-actions">
						<Button type="submit" variant="error">
							<FontAwesomeIcon icon={faLock} />
							Disable 2FA
						</Button>
					</div>
				</form>
			{:else if show2FASetup && data.qrCode}
				<!-- 2FA setup flow -->
				<div class="twofa-setup">
					<div class="setup-step">
						<h4>Step 1: Scan QR Code</h4>
						<p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
						<div class="qr-code-container">
							<img src={data.qrCode} alt="2FA QR Code" />
						</div>
						{#if data.totpSecret}
							<details class="manual-setup">
								<summary>Can't scan? Enter manually</summary>
								<div class="secret-key">
									<code>{data.totpSecret}</code>
								</div>
							</details>
						{/if}
					</div>

					{#if data.backupCodes}
						<div class="setup-step">
							<h4>Step 2: Save Backup Codes</h4>
							<p class="warning-text">
								<FontAwesomeIcon icon={faExclamationTriangle} />
								Save these backup codes in a safe place. You'll need them if you lose access to your
								authenticator app.
							</p>
							<div class="backup-codes">
								{#each data.backupCodes as code (code)}
									<code class="backup-code">{code}</code>
								{/each}
							</div>
							<Button variant="secondary" onClick={copyBackupCodes}>
								<FontAwesomeIcon icon={backupCodesCopied ? faCheck : faCopy} />
								{backupCodesCopied ? 'Copied!' : 'Copy All Codes'}
							</Button>
						</div>
					{/if}

					<div class="setup-step">
						<h4>Step 3: Verify Setup</h4>
						<p>Enter the 6-digit code from your authenticator app to complete setup</p>

						<form
							method="POST"
							action="?/verify2FA"
							use:enhance={() => {
								return async ({ update }) => {
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="totpCode" bind:value={totpCode} />
							{#if data.backupCodes}
								<input type="hidden" name="backupCodes" value={JSON.stringify(data.backupCodes)} />
							{/if}

							<div class="totp-input-wrapper">
								<TotpInput onComplete={handleTotpComplete} />
							</div>

							<div class="form-actions">
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										show2FASetup = false;
										totpCode = '';
									}}
								>
									Cancel
								</Button>
								<Button type="submit" variant="primary" disabled={totpCode.length !== 6}>
									<FontAwesomeIcon icon={faShieldAlt} />
									Enable 2FA
								</Button>
							</div>
						</form>
					</div>
				</div>
			{:else}
				<!-- 2FA is disabled, show enable option -->
				<div class="twofa-status disabled">
					<div class="status-icon">
						<FontAwesomeIcon icon={faShieldAlt} size="2x" />
					</div>
					<div class="status-content">
						<h4>Two-Factor Authentication is Disabled</h4>
						<p>Enable 2FA to add an extra layer of security to your account</p>
					</div>
				</div>

				<form
					method="POST"
					action="?/enable2FA"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update({ reset: false });
							// If successful, navigate to setup page
							if (
								result.type === 'success' &&
								result.data &&
								'redirect' in result.data &&
								typeof result.data.redirect === 'string'
							) {
								await invalidateAll();
								goto(result.data.redirect);
							}
						};
					}}
				>
					<div class="form-group">
						<label for="enable2FAPassword">Confirm Your Password</label>
						<input
							id="enable2FAPassword"
							type="password"
							name="password"
							required
							placeholder="Enter your password to enable 2FA"
							autocomplete="current-password"
						/>
					</div>

					<div class="form-actions">
						<Button type="submit" variant="primary">
							<FontAwesomeIcon icon={faShieldAlt} />
							Enable 2FA
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

<!-- Danger Zone Tab -->
{#if activeTab === 'danger'}
	<div class="col-12">
		<div class="card-container">
			<div class="danger-zone">
				<div class="danger-header">
					<FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
					<h3>Danger Zone</h3>
				</div>
				<p class="text-muted">
					Once you delete your account, there is no going back. This action is permanent and cannot
					be undone.
				</p>

				<div class="danger-content">
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
			</div>
		</div>
	</div>
{/if}

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
	.card-container {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.card-container h3 {
		margin: 0 0 0.5rem 0;
		color: var(--text-color-1);
		font-size: 1.5rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		overflow-x: auto;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: none;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		border-bottom: 3px solid transparent;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--text-color-1);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: var(--theme-color-2);
		border-bottom-color: var(--theme-color-2);
	}

	.tab.danger {
		color: rgb(var(--red));
	}

	.tab.danger.active {
		border-bottom-color: rgb(var(--red));
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 2rem;
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.profile-info h2 {
		margin: 0 0 0.5rem 0;
		color: var(--text-color-1);
	}

	.username {
		color: var(--theme-color-2);
		font-weight: 600;
		margin: 0 0 0.25rem 0;
	}

	.email {
		color: var(--text-color-3);
		font-size: 0.9rem;
		margin: 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		color: var(--text-color-1);
		font-weight: 500;
		font-size: 0.9rem;
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: var(--text-color-1);
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--theme-color-2);
		box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.1);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 100px;
	}

	.form-group small {
		color: var(--text-color-3);
		font-size: 0.85rem;
	}

	.text-muted {
		color: var(--text-color-2);
		margin-bottom: 1.5rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Danger Zone Styles */
	.danger-zone {
		border: 2px solid rgba(var(--red), 0.3);
		border-radius: 0.75rem;
		padding: 2rem;
		background: rgba(var(--red), 0.05);
	}

	.danger-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: rgb(var(--red));
		margin-bottom: 1rem;
	}

	.danger-header h3 {
		margin: 0;
	}

	.danger-content {
		margin-top: 1.5rem;
	}

	.danger-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		gap: 2rem;
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

	/* 2FA Styles */
	.twofa-status {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem;
		border-radius: 0.75rem;
		margin-bottom: 2rem;
	}

	.twofa-status.enabled {
		background: rgba(var(--green, 76, 175, 80), 0.1);
		border: 2px solid rgba(var(--green, 76, 175, 80), 0.3);
	}

	.twofa-status.disabled {
		background: rgba(var(--orange, 255, 152, 0), 0.1);
		border: 2px solid rgba(var(--orange, 255, 152, 0), 0.3);
	}

	.status-icon {
		color: var(--theme-color-2);
	}

	.twofa-status.enabled .status-icon {
		color: rgb(var(--green, 76, 175, 80));
	}

	.twofa-status.disabled .status-icon {
		color: rgb(var(--orange, 255, 152, 0));
	}

	.status-content h4 {
		margin: 0 0 0.25rem 0;
		color: var(--text-color-1);
	}

	.status-content p {
		margin: 0;
		color: var(--text-color-2);
		font-size: 0.9rem;
	}

	.twofa-setup {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.setup-step {
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.setup-step h4 {
		margin: 0 0 0.5rem 0;
		color: var(--text-color-1);
	}

	.setup-step p {
		margin: 0 0 1rem 0;
		color: var(--text-color-2);
	}

	.qr-code-container {
		display: flex;
		justify-content: center;
		padding: 1rem;
		background: white;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.qr-code-container img {
		max-width: 300px;
		width: 100%;
		height: auto;
	}

	.manual-setup {
		margin-top: 1rem;
	}

	.manual-setup summary {
		cursor: pointer;
		color: var(--theme-color-2);
		font-size: 0.9rem;
		user-select: none;
	}

	.manual-setup summary:hover {
		text-decoration: underline;
	}

	.secret-key {
		margin-top: 0.5rem;
		padding: 1rem;
		background: var(--background-color-1);
		border-radius: 0.5rem;
	}

	.secret-key code {
		font-size: 1rem;
		color: var(--text-color-1);
		word-break: break-all;
	}

	.backup-codes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.backup-code {
		padding: 0.75rem;
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		font-size: 0.95rem;
		font-family: 'Courier New', monospace;
		text-align: center;
		color: var(--text-color-1);
	}

	.warning-text {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgb(var(--orange, 255, 152, 0)) !important;
		font-weight: 500;
	}

	.totp-input-wrapper {
		margin: 1.5rem 0;
	}

	@media (max-width: 768px) {
		.profile-header {
			flex-direction: column;
			text-align: center;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.danger-item {
			flex-direction: column;
			text-align: center;
		}

		.tabs {
			justify-content: flex-start;
		}

		.twofa-status {
			flex-direction: column;
			text-align: center;
		}

		.backup-codes {
			grid-template-columns: 1fr;
		}
	}
</style>
