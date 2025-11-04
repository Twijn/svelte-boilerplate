<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

	const { data, form } = $props();

	let emailForm = $state({
		newEmail: '',
		password: ''
	});

	let hasUnsavedChanges = $derived(emailForm.newEmail !== '' || emailForm.password !== '');

	$effect(() => {
		if (form?.message) {
			if (form.success) {
				notifications.success(form.message);
				emailForm = { newEmail: '', password: '' };
			} else {
				notifications.error(form.message);
			}
		}
	});
</script>

<ProfileTab
	title="Change Email Address"
	description="We'll send a verification email to your new address. Current: {data.user.email}"
	{hasUnsavedChanges}
>
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
</ProfileTab>

<style>
	.form-group {
		display: flex;
		flex-direction: column;
		margin-bottom: 1.5rem;
	}

	label {
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--text-color-1);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.form-actions {
			flex-direction: column;
		}
	}
</style>
