<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faUser } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		avatar?: string | null;
		firstName?: string;
		lastName?: string;
		username?: string;
		size?: 'xs' | 'small' | 'medium' | 'large';
	}

	let { avatar = null, firstName, lastName, username, size = 'medium' }: Props = $props();

	// Get initials from name or username
	const initials = $derived(() => {
		if (firstName && lastName) {
			return `${firstName[0]}${lastName[0]}`.toUpperCase();
		} else if (firstName) {
			return firstName.slice(0, 2).toUpperCase();
		} else if (username) {
			return username.slice(0, 2).toUpperCase();
		}
		return '';
	});

	function getSizeClass() {
		switch (size) {
			case 'xs':
				return 'avatar-xs';
			case 'small':
				return 'avatar-small';
			case 'large':
				return 'avatar-large';
			default:
				return 'avatar-medium';
		}
	}
</script>

<div class="user-avatar {getSizeClass()}">
	{#if avatar}
		<img src={avatar} alt="{firstName} {lastName}" class="avatar-image" />
	{:else if initials()}
		<div class="avatar-initials">{initials()}</div>
	{:else}
		<div class="avatar-placeholder">
			<FontAwesomeIcon icon={faUser} />
		</div>
	{/if}
</div>

<style>
	.user-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			rgba(var(--theme-color-rgb), 0.2),
			rgba(var(--theme-color-rgb), 0.3)
		);
		border: 2px solid rgba(var(--theme-color-rgb), 0.3);
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar-xs {
		width: 24px;
		height: 24px;
		font-size: 0.625rem;
		border-width: 1px;
	}

	.avatar-small {
		width: 32px;
		height: 32px;
		font-size: 0.75rem;
	}

	.avatar-medium {
		width: 40px;
		height: 40px;
		font-size: 0.875rem;
	}

	.avatar-large {
		width: 60px;
		height: 60px;
		font-size: 1.25rem;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-initials,
	.avatar-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgb(var(--theme-color-rgb));
		font-weight: 600;
	}

	.avatar-placeholder {
		color: var(--text-color-3);
	}
</style>
