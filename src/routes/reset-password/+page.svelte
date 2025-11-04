<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/dialogs/Alert.svelte';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import AuthFooter from '$lib/components/auth/AuthFooter.svelte';
	import type { ActionData, PageData } from './$types';
	import CenteredSection from '$lib/components/ui/CenteredSection.svelte';
	import { APP_NAME } from '$lib/consts';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isSubmitting = $state(false);
	let password = $state('');
	let confirmPassword = $state('');
</script>

<svelte:head>
	<title>Reset Password | {APP_NAME}</title>
</svelte:head>

<CenteredSection heading="Reset Password">
	{#if form?.success}
		<Alert variant="success">
			<strong>Password Reset Successfully!</strong>
			<p>Your password has been changed. You can now log in with your new password.</p>
		</Alert>
		<Button href="/login" variant="primary">Login</Button>
	{:else if data.error || !data.valid}
		<Alert variant="danger">
			<strong>Invalid Reset Link</strong>
			<p>{data.error || 'This password reset link is invalid or has expired.'}</p>
		</Alert>
		<Button href="/forgot-password" variant="link">Request a new reset link</Button>
	{:else}
		{#if form?.error}
			<Alert variant="danger">
				{form.error}
			</Alert>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			<input type="hidden" name="token" value={data.token} />

			<AuthInput
				label="New Password"
				type="password"
				name="password"
				id="password"
				bind:value={password}
				required
				minlength={6}
				autocomplete="new-password"
				placeholder="Enter new password"
				showToggle
				helperText="Must be at least 6 characters long"
			/>

			<AuthInput
				label="Confirm New Password"
				type="password"
				name="confirmPassword"
				id="confirmPassword"
				bind:value={confirmPassword}
				required
				minlength={6}
				autocomplete="new-password"
				placeholder="Confirm new password"
				showToggle
			/>

			<Button type="submit" variant="primary" full disabled={isSubmitting}>
				{isSubmitting ? 'Resetting Password...' : 'Reset Password'}
			</Button>
		</form>

		<AuthFooter>
			{#snippet children()}
				<p>
					Remember your password?
					<a href="/login">Back to login</a>
				</p>
			{/snippet}
		</AuthFooter>
	{/if}
</CenteredSection>
