<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Alert from '$lib/components/ui/dialogs/Alert.svelte';
	import AuthInput from '$lib/components/auth/AuthInput.svelte';
	import AuthFooter from '$lib/components/auth/AuthFooter.svelte';
	import type { ActionData } from './$types';
	import CenteredSection from '$lib/components/ui/CenteredSection.svelte';
	import { APP_NAME } from '$lib/consts';

	let { form }: { form: ActionData } = $props();

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Forgot Password | {APP_NAME}</title>
</svelte:head>

<CenteredSection heading="Forgot Password">
	{#if form?.success}
		<Alert variant="success">
			<strong>Email Sent!</strong>
			<p>{form.message}</p>
		</Alert>
		<Button href="/login" variant="primary">Back to Login</Button>
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
			<AuthInput
				label="Email Address"
				id="email"
				name="email"
				type="email"
				value={form?.email || ''}
				required
				autocomplete="email"
				placeholder="you@example.com"
			/>

			<Button type="submit" variant="primary" full disabled={isSubmitting}>
				{isSubmitting ? 'Sending...' : 'Send Reset Link'}
			</Button>
		</form>

		<AuthFooter>
			<p>
				Remember your password?
				<a href="/login" data-sveltekit-preload-data="hover">Back to login</a>
			</p>
			<p>
				Don't have an account?
				<a href="/register" data-sveltekit-preload-data="hover">Sign up</a>
			</p>
		</AuthFooter>
	{/if}
</CenteredSection>
