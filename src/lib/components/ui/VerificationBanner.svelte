<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { notifications } from '$lib/stores/notifications';

	let isResending = $state(false);

	async function resendVerification() {
		if (isResending) return;
		isResending = true;

		try {
			const response = await fetch('/resend-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: ''
			});

			if (response.ok) {
				notifications.success('Verification email sent! Please check your inbox.');
			} else {
				const error = await response.json();
				notifications.error(error.message || 'Failed to send verification email');
			}
		} catch (error) {
			console.error('Error resending verification:', error);
			notifications.error('An error occurred. Please try again.');
		} finally {
			isResending = false;
		}
	}
</script>

<div class="verification-banner col-12">
	<div class="banner-content">
		<div class="banner-icon">
			<i class="fa-solid fa-envelope"></i>
		</div>
		<div class="banner-text">
			<strong>Verify your email address</strong>
			<p>Please check your inbox for a verification link. Didn't receive it?</p>
		</div>
		<button class="resend-button" onclick={resendVerification} disabled={isResending}>
			{#if isResending}
				<i class="fa-solid fa-spinner fa-spin"></i> Sending...
			{:else}
				<i class="fa-solid fa-paper-plane"></i> Resend Email
			{/if}
		</button>
	</div>
</div>

<style>
	.verification-banner {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem;
		margin-bottom: 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.banner-icon {
		font-size: 2rem;
		opacity: 0.9;
	}

	.banner-text {
		flex: 1;
	}

	.banner-text strong {
		display: block;
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.banner-text p {
		margin: 0;
		opacity: 0.9;
		font-size: 0.9rem;
	}

	.resend-button {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.resend-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.resend-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.resend-button i {
		margin-right: 0.5rem;
	}

	@media (max-width: 768px) {
		.banner-content {
			flex-direction: column;
			text-align: center;
		}

		.banner-icon {
			font-size: 2.5rem;
		}

		.resend-button {
			width: 100%;
		}
	}
</style>
