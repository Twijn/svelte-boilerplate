<script lang="ts">
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TotpInput from '$lib/components/ui/TotpInput.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { enhance } from '$app/forms';
	import { invalidateAll, goto } from '$app/navigation';

	const { data, form } = $props();

	let showSetup = $state(false);
	let password = $state('');
	let totpCode = $state('');
	let copied = $state(false);

	$effect(() => {
		if (form?.success) {
			notifications.success(form.message);
			password = '';
			totpCode = '';

			// Handle redirect for enable2FA
			if (form.action === 'enable2FA' && form.redirect) {
				goto(form.redirect);
			} else if (form.action === 'verify2FA' || form.action === 'disable2FA') {
				invalidateAll();
			}
		} else if (form?.message) {
			notifications.error(form.message);
		}
	});

	function copyBackupCodes() {
		if (data.backupCodes) {
			navigator.clipboard.writeText(data.backupCodes.join('\n'));
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<ProfileTab
	title="Two-Factor Authentication"
	description="Add an extra layer of security to your account"
>
	<!-- Status -->
	<div class="status">
		Status:
		{#if data.user?.twoFactorEnabled}
			<span class="badge badge-success">Enabled</span>
		{:else}
			<span class="badge badge-error">Disabled</span>
		{/if}
	</div>

	<!-- Setup Flow -->
	{#if data.qrCode}
		<div class="setup">
			<p>Scan this QR code with Google Authenticator or Authy:</p>

			<div class="qr">
				<img src={data.qrCode} alt="2FA QR Code" />
			</div>

			<p class="manual">
				Manual entry: <code>{data.totpSecret}</code>
			</p>

			<form method="POST" action="?/verify2FA" use:enhance>
				<label>
					Enter 6-digit code:
					<TotpInput bind:value={totpCode} />
				</label>

				<input type="hidden" name="backupCodes" value={JSON.stringify(data.backupCodes)} />

				<Button type="submit">Verify & Enable</Button>
			</form>

			{#if data.backupCodes && showSetup}
				<div class="backup">
					<strong>Backup Codes (save these securely):</strong>
					<div class="codes">
						{#each data.backupCodes as code}
							<code>{code}</code>
						{/each}
					</div>
					<Button variant="secondary" onClick={copyBackupCodes}>
						{copied ? 'Copied!' : 'Copy All'}
					</Button>
				</div>
			{:else if data.backupCodes}
				<Button variant="secondary" onClick={() => (showSetup = true)}>Show Backup Codes</Button>
			{/if}
		</div>
	{:else if data.user?.twoFactorEnabled}
		<!-- Enabled - show disable -->
		<p class="success-msg">✓ Your account is protected with 2FA</p>

		<form method="POST" action="?/disable2FA" use:enhance>
			<label>
				Confirm password to disable:
				<input type="password" name="password" bind:value={password} required />
			</label>
			<Button type="submit" variant="error">Disable 2FA</Button>
		</form>
	{:else}
		<!-- Not enabled - show enable -->
		<p>Protect your account with an authenticator app.</p>

		<form method="POST" action="?/enable2FA" use:enhance>
			<label>
				Confirm password to enable:
				<input type="password" name="password" bind:value={password} required />
			</label>
			<Button type="submit">Enable 2FA</Button>
		</form>
	{/if}
</ProfileTab>

<style>
	.status {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--bg-2);
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	:global(.badge-success) {
		background: rgba(34, 197, 94, 0.1);
		color: rgb(34, 197, 94);
	}

	:global(.badge-error) {
		background: var(--bg-3);
		color: var(--text-color-2);
	}

	.setup {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
	}

	.qr {
		padding: 1rem;
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 0.5rem;
	}

	.qr img {
		display: block;
		max-width: 300px;
		height: auto;
	}

	.manual {
		font-size: 0.875rem;
		color: var(--text-color-2);
	}

	.manual code {
		padding: 0.25rem 0.5rem;
		background: var(--bg-2);
		border-radius: 0.25rem;
		font-family: monospace;
	}

	.backup {
		width: 100%;
		padding: 1rem;
		background: rgba(251, 191, 36, 0.1);
		border: 1px solid rgba(251, 191, 36, 0.3);
		border-radius: 0.5rem;
	}

	.backup strong {
		display: block;
		margin-bottom: 1rem;
		color: rgb(217, 119, 6);
	}

	.codes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.codes code {
		display: block;
		padding: 0.5rem;
		background: white;
		border: 1px solid var(--border-color);
		border-radius: 0.25rem;
		text-align: center;
		font-family: monospace;
		font-size: 0.875rem;
	}

	.success-msg {
		padding: 1rem;
		background: rgba(34, 197, 94, 0.1);
		border-left: 4px solid rgb(34, 197, 94);
		border-radius: 0.5rem;
		color: rgb(34, 197, 94);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 400px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	input[type='password'] {
		padding: 0.625rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: 0.5rem;
		background: var(--bg);
		color: var(--text-color);
	}

	input[type='password']:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
</style>
