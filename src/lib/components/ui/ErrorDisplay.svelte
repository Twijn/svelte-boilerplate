<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faShieldAlt,
		faExclamationTriangle,
		faSearch,
		faCogs,
		faBan
	} from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/components/ui/Button.svelte';

	type ErrorType = '403' | '404' | '500' | 'generic' | 'maintenance';

	interface Props {
		type?: ErrorType;
		title?: string;
		message?: string;
		details?: string;
		showHomeButton?: boolean;
		showBackButton?: boolean;
		customActions?: any; // Snippet for custom action buttons
	}

	const {
		type = 'generic',
		title,
		message,
		details,
		showHomeButton = true,
		showBackButton = false,
		customActions
	}: Props = $props();

	// Error type configurations
	const errorConfigs = {
		'403': {
			icon: faShieldAlt,
			defaultTitle: 'Access Denied',
			defaultMessage: "You don't have permission to access this resource.",
			color: 'var(--red)',
			gradient: 'linear-gradient(135deg, rgba(var(--red), 0.2), rgba(var(--red), 0.05))'
		},
		'404': {
			icon: faSearch,
			defaultTitle: 'Page Not Found',
			defaultMessage: "The page you're looking for doesn't exist or has been moved.",
			color: 'var(--orange)',
			gradient: 'linear-gradient(135deg, rgba(var(--orange), 0.2), rgba(var(--orange), 0.05))'
		},
		'500': {
			icon: faCogs,
			defaultTitle: 'Server Error',
			defaultMessage: 'Something went wrong on our end. Please try again later.',
			color: 'var(--red)',
			gradient: 'linear-gradient(135deg, rgba(var(--red), 0.2), rgba(var(--red), 0.05))'
		},
		maintenance: {
			icon: faCogs,
			defaultTitle: 'Under Maintenance',
			defaultMessage: "We're currently performing maintenance. Please check back soon.",
			color: 'var(--blue)',
			gradient: 'linear-gradient(135deg, rgba(var(--blue), 0.2), rgba(var(--blue), 0.05))'
		},
		generic: {
			icon: faExclamationTriangle,
			defaultTitle: 'Something went wrong',
			defaultMessage: 'An unexpected error occurred.',
			color: 'var(--orange)',
			gradient: 'linear-gradient(135deg, rgba(var(--orange), 0.2), rgba(var(--orange), 0.05))'
		}
	};

	const config = errorConfigs[type];
	const displayTitle = title || config.defaultTitle;
	const displayMessage = message || config.defaultMessage;
</script>

<div class="error-container" style="background: {config.gradient};">
	<div class="error-content">
		<div class="error-header">
			<div class="error-icon" style="color: rgb({config.color});">
				<FontAwesomeIcon icon={config.icon} size="4x" />
			</div>

			<div class="error-code" style="color: rgb({config.color});">
				{#if type !== 'generic' && type !== 'maintenance'}
					{type}
				{/if}
			</div>
		</div>

		<div class="error-text">
			<h1>{displayTitle}</h1>
			<p class="error-message">{displayMessage}</p>

			{#if details}
				<details class="error-details">
					<summary>Technical Details</summary>
					<pre>{details}</pre>
				</details>
			{/if}
		</div>

		<div class="error-actions">
			{#if customActions}
				{@render customActions()}
			{:else}
				{#if showBackButton}
					<Button variant="secondary" onClick={() => history.back()}>Go Back</Button>
				{/if}

				{#if showHomeButton}
					<Button href="/" variant="primary">Go Home</Button>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Decorative elements -->
	<div class="error-decoration">
		<div class="decoration-circle decoration-1"></div>
		<div class="decoration-circle decoration-2"></div>
		<div class="decoration-circle decoration-3"></div>
	</div>
</div>

<style>
	.error-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		overflow: hidden;
	}

	.error-content {
		text-align: center;
		max-width: 600px;
		width: 100%;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 3rem 2rem;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.3),
			0 8px 32px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
		position: relative;
		z-index: 2;
	}

	.error-header {
		margin-bottom: 2rem;
		position: relative;
	}

	.error-icon {
		margin-bottom: 1rem;
		animation: pulse 2s ease-in-out infinite;
	}

	.error-code {
		font-size: 6rem;
		font-weight: 900;
		line-height: 1;
		opacity: 0.1;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: -1;
		user-select: none;
		font-family: 'Courier New', monospace;
	}

	.error-text h1 {
		color: var(--text-color-1);
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	.error-message {
		color: var(--text-color-2);
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}

	.error-details {
		margin: 2rem 0;
		text-align: left;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.error-details summary {
		padding: 1rem;
		cursor: pointer;
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-color-2);
		font-weight: 500;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		transition: background-color 0.2s ease;
	}

	.error-details summary:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.error-details pre {
		padding: 1rem;
		margin: 0;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		color: var(--text-color-3);
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.error-decoration {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 1;
	}

	.decoration-circle {
		position: absolute;
		border-radius: 50%;
		background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
		animation: float 6s ease-in-out infinite;
	}

	.decoration-1 {
		width: 200px;
		height: 200px;
		top: 10%;
		left: 10%;
		animation-delay: 0s;
	}

	.decoration-2 {
		width: 150px;
		height: 150px;
		top: 60%;
		right: 15%;
		animation-delay: 2s;
	}

	.decoration-3 {
		width: 100px;
		height: 100px;
		bottom: 20%;
		left: 20%;
		animation-delay: 4s;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.05);
			opacity: 0.8;
		}
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		33% {
			transform: translateY(-20px) rotate(120deg);
		}
		66% {
			transform: translateY(10px) rotate(240deg);
		}
	}

	@media (max-width: 768px) {
		.error-container {
			padding: 1rem;
		}

		.error-content {
			padding: 2rem 1.5rem;
		}

		.error-text h1 {
			font-size: 2rem;
		}

		.error-code {
			font-size: 4rem;
		}

		.error-actions {
			flex-direction: column;
		}

		.decoration-circle {
			display: none;
		}
	}

	@media (max-width: 480px) {
		.error-text h1 {
			font-size: 1.75rem;
		}

		.error-message {
			font-size: 1rem;
		}
	}
</style>
