<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import CenteredSection from '$lib/components/ui/CenteredSection.svelte';
	import Alert from '$lib/components/ui/dialogs/Alert.svelte';
	import { APP_NAME } from '$lib/consts';
	import type { ActionData } from './$types';

	const { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Login | {APP_NAME}</title>
</svelte:head>

<CenteredSection heading="Login">
	<p>Please use the form below to sign in to {APP_NAME}!</p>

	{#if form?.message}
		<Alert variant="danger">
			{form.message}
		</Alert>
	{/if}

	<form method="POST" class="enhanced-form" use:enhance>
		<fieldset>
			<legend>Account Information</legend>
			<label>
				Username
				<input
					class="color"
					type="text"
					name="username"
					autocomplete="username"
					value={form?.username}
				/>
			</label>
			<label>
				Password
				<input class="color" type="password" name="password" autocomplete="current-password" />
			</label>
			<p class="secondary-text" style="text-align: right; margin-top: 0.5rem;">
				<a href="/forgot-password" class="link-primary">Forgot password?</a>
			</p>
		</fieldset>

		<div class="form-actions">
			<Button arrow full type="submit" variant="primary">Login</Button>
			<Button full variant="link" href="/register">Don't have an account? Sign up here</Button>
		</div>
	</form>
</CenteredSection>
