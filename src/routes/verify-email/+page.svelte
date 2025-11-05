<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
	import { APP_NAME } from '$lib/consts';

	const { data } = $props();
</script>

<svelte:head>
	<title>Email Verification - {APP_NAME}</title>
</svelte:head>

<div class="verification-container">
	<div class="verification-card">
		{#if data.success}
			<div class="icon success">
				<FontAwesomeIcon icon={faCheckCircle} />
			</div>
			<h1>Email Verified!</h1>
			<p>Your email address has been successfully verified.</p>
			<Button href="/panel">Go to Dashboard</Button>
		{:else}
			<div class="icon error">
				<FontAwesomeIcon icon={faTimesCircle} />
			</div>
			<h1>Verification Failed</h1>
			<p>{data.message || 'Unable to verify your email address.'}</p>
			<p class="help-text">
				The verification link may have expired or is invalid. Please request a new verification
				email from your profile settings.
			</p>
			<div class="actions">
				<Button href="/panel">Go to Dashboard</Button>
				<Button href="/login" variant="secondary">Login</Button>
			</div>
		{/if}
	</div>
</div>

<style>
	.verification-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, var(--background-color-1), var(--background-color-2));
	}

	.verification-card {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 3rem 2rem;
		max-width: 500px;
		width: 100%;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.icon {
		font-size: 4rem;
		margin-bottom: 1.5rem;
	}

	.icon.success {
		color: rgb(var(--green));
	}

	.icon.error {
		color: rgb(var(--red));
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
		color: var(--text-color-1);
	}

	p {
		color: var(--text-color-2);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.help-text {
		font-size: 0.9rem;
		color: var(--text-color-3);
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		.verification-container {
			padding: 1rem;
		}

		.verification-card {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.icon {
			font-size: 3rem;
		}
	}
</style>
