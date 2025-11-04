<script lang="ts">
	import { notifications } from '$lib/stores/notifications';
	import { scale, fade } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
</script>

<div class="notifications-container">
	{#each $notifications as notification (notification.id)}
		<div
			class="notification"
			class:success={notification.type === 'success'}
			class:info={notification.type === 'info'}
			class:error={notification.type === 'error'}
			class:warning={notification.type === 'warning'}
			in:scale
			out:fade
		>
			<p>{notification.message}</p>
			<button on:click={() => notifications.remove(notification.id)}>
				<FontAwesomeIcon icon={faTimes} />
			</button>
		</div>
	{/each}
</div>

<style>
	.notifications-container {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 25em;
		max-width: calc(100% - 2rem);
	}

	.notification.success {
		--rgb-color: var(--green);
		color: white;
	}

	.notification.error {
		--rgb-color: var(--red);
		color: white;
	}

	.notification.info {
		--rgb-color: var(--theme-color-rgb);
		color: white;
	}

	.notification.warning {
		--rgb-color: 255, 150, 0;
		color: white;
	}

	.notification {
		--rgb-color: 255, 255, 255;
		padding: 1rem;
		border-radius: 0.5rem;
		background-color: rgba(var(--rgb-color), 0.3);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(var(--rgb-color), 0.2);
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.notification p {
		margin: 0;
	}

	.notification button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		color: currentColor;
		opacity: 0.7;
	}

	.notification button:hover {
		opacity: 1;
	}
</style>
