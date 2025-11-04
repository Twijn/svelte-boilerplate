<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import CenteredSection from '$lib/components/ui/CenteredSection.svelte';
	import Alert from '$lib/components/ui/dialogs/Alert.svelte';
	import { APP_NAME } from '$lib/consts';
	import type { ActionData } from './$types';

	const { form }: { form: ActionData } = $props();
</script>

<CenteredSection heading="Create Account">
	<p class="form-intro">Join <strong>{APP_NAME}</strong> and get started today!</p>

	{#if form?.message}
		<Alert variant="danger">
			{form.message}
		</Alert>
	{/if}

	<form method="POST" use:enhance class="enhanced-form">
		<fieldset>
			<legend>Personal Information</legend>
			<div class="form-row">
				<div class="form-group">
					<label class="form-label">
						First Name
						<input
							class="color"
							type="text"
							name="first-name"
							autocomplete="given-name"
							value={form?.firstName || ''}
							placeholder="Enter your first name"
							required
						/>
					</label>
				</div>
				<div class="form-group">
					<label class="form-label">
						Last Name
						<input
							class="color"
							type="text"
							name="last-name"
							autocomplete="family-name"
							value={form?.lastName || ''}
							placeholder="Enter your last name"
							required
						/>
					</label>
				</div>
			</div>
		</fieldset>

		<fieldset class="form-section">
			<legend>Account Information</legend>
			<div class="form-group">
				<label class="form-label">
					Email Address
					<input
						class="color"
						type="email"
						name="email"
						autocomplete="email"
						value={form?.email || ''}
						placeholder="you@example.com"
						required
					/>
				</label>
			</div>
			<div class="form-group">
				<label class="form-label">
					Username
					<input
						class="color"
						type="text"
						name="username"
						autocomplete="username"
						value={form?.username || ''}
						placeholder="Choose a unique username"
						required
					/>
				</label>
			</div>
			<div class="form-group">
				<label class="form-label">
					Password
					<input
						class="color"
						type="password"
						name="password"
						autocomplete="new-password"
						placeholder="Create a secure password"
						required
					/>
				</label>
			</div>
		</fieldset>

		<div class="form-actions">
			<Button full type="submit" variant="primary">Create Account</Button>
			<Button full variant="link" href="/login">Sign in here</Button>
		</div>
	</form>
</CenteredSection>

<style>
	/* No custom styles needed - using global styles */
</style>
