<script lang="ts">
	import { enhance } from '$app/forms';
	import TotpInput from '$lib/components/ui/TotpInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import CenteredSection from '$lib/components/ui/CenteredSection.svelte';
	import Alert from '$lib/components/ui/dialogs/Alert.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faShieldAlt, faKey } from '@fortawesome/free-solid-svg-icons';
	import { APP_NAME } from '$lib/consts';

	const { form } = $props();

	let totpCode = $state('');
	let showBackupCodeInput = $state(false);
	let backupCode = $state('');
	let isSubmitting = $state(false);

	function handleTotpComplete(code: string) {
		totpCode = code;
	}
</script>

<svelte:head>
	<title>Verify Two-Factor Authentication | {APP_NAME}</title>
</svelte:head>

<CenteredSection heading="Two-Factor Authentication">
	{#if form?.message}
		<Alert variant="danger">
			{form.message}
		</Alert>
	{/if}

	{#if !showBackupCodeInput}
		<!-- TOTP Code Input -->
		<form
			method="POST"
			action="?/verify"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						// Let the redirect happen without interference
						await update();
					} else {
						await update();
						isSubmitting = false;
						totpCode = '';
					}
				};
			}}
			class="enhanced-form"
		>
			<fieldset>
				<legend class="text-center">
					<div class="icon-container">
						<FontAwesomeIcon icon={faShieldAlt} size="3x" />
					</div>
					<p class="verification-instructions">
						Enter the 6-digit code from your authenticator app
					</p>
				</legend>

				<input type="hidden" name="totpCode" bind:value={totpCode} />

				<div class="totp-input-wrapper">
					<TotpInput
						onComplete={handleTotpComplete}
						error={form?.type === 'error'}
						disabled={isSubmitting}
					/>
				</div>

				<Button
					type="submit"
					variant="primary"
					full
					disabled={totpCode.length !== 6 || isSubmitting}
				>
					{isSubmitting ? 'Verifying...' : 'Verify & Continue'}
				</Button>
			</fieldset>
		</form>

		<div class="divider">
			<span>Or</span>
		</div>

		<Button type="button" variant="secondary" full onClick={() => (showBackupCodeInput = true)}>
			<FontAwesomeIcon icon={faKey} />
			Use a backup code instead
		</Button>
	{:else}
		<!-- Backup Code Input -->
		<form
			method="POST"
			action="?/useBackupCode"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						// Let the redirect happen without interference
						await update();
					} else {
						await update();
						isSubmitting = false;
						backupCode = '';
					}
				};
			}}
			class="enhanced-form"
		>
			<fieldset>
				<legend class="text-center">
					<div class="icon-container">
						<FontAwesomeIcon icon={faKey} size="3x" />
					</div>
					<p class="verification-instructions">
						Enter one of your backup codes. Each code can only be used once.
					</p>
				</legend>

				<input
					type="text"
					name="backupCode"
					bind:value={backupCode}
					placeholder="XXXX-XXXX-XXXX"
					class="backup-code-input"
					autocomplete="off"
					disabled={isSubmitting}
					required
				/>

				<div class="buttons">
					<Button type="submit" variant="primary" full disabled={!backupCode || isSubmitting}>
						{isSubmitting ? 'Verifying...' : 'Verify Backup Code'}
					</Button>

					<Button
						variant="secondary"
						full
						onClick={() => {
							showBackupCodeInput = false;
							backupCode = '';
						}}
					>
						Back to authenticator code
					</Button>
				</div>
			</fieldset>
		</form>
	{/if}
	<Button full href="/login" variant="link">Back to Login</Button>
</CenteredSection>

<style>
	.icon-container {
		color: var(--theme-color-2);
		margin-bottom: 1rem;
		text-align: center;
	}

	.verification-instructions {
		text-align: center;
		color: var(--text-color-2);
		margin: 0.5rem 0 0 0;
		font-size: 0.95rem;
	}

	.totp-input-wrapper {
		display: flex;
		justify-content: center;
		margin: 1.5rem 0;
	}
</style>
