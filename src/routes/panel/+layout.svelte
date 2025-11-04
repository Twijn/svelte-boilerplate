<script lang="ts">
	import { faBars } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	import Navigation from '$lib/components/layout/Navigation.svelte';
	import { APP_NAME, APP_VERSION } from '$lib/consts';
	import Notifications from '$lib/components/ui/dialogs/Notifications.svelte';
	import Confirm from '$lib/components/ui/dialogs/Confirm.svelte';
	import Prompt from '$lib/components/ui/dialogs/Prompt.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	const { children, data } = $props();
	const user = data.user;
	let showNavigation = $state(false);

	let handleResize: () => void;

	onMount(() => {
		handleResize = () => {
			showNavigation = window.innerWidth > 768;
		};
		handleResize();

		window.addEventListener('resize', handleResize);
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', handleResize);
		}
	});

	function handleWindowClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('#show-navigation') && window.innerWidth <= 768) {
			showNavigation = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div id="app" class:nav-hidden={!showNavigation}>
	<header>
		<div class="header-left">
			<button
				id="show-navigation"
				onclick={() => (showNavigation = !showNavigation)}
				aria-label="Toggle navigation"
			>
				<FontAwesomeIcon icon={faBars} size="lg" />
			</button>
			<a href="/" class="app-name">{APP_NAME}</a>
		</div>

		<div class="header-right">
			{#if user}
				<div class="user-info">
					<span class="user-name">Welcome, {user.firstName || user.username}!</span>
					<Button href="/logout" variant="header" title="Sign out">Sign Out</Button>
				</div>
			{/if}
		</div>
	</header>
	<aside>
		<Navigation userPermissions={data.userPermissions} />
	</aside>
	<div id="content">
		<main class="container">
			{@render children?.()}
		</main>
		<footer>
			<p>Version {APP_VERSION}</p>
		</footer>
	</div>
</div>

<Notifications />
<Confirm />
<Prompt />

<style>
	header {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--background-color-2);
		height: 3.8rem;
		border-bottom: 0.1em solid var(--theme-color-2);
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
		z-index: 10;
		padding: 0 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
	}

	header button {
		background: none;
		border: none;
		color: var(--text-color-2);
		cursor: pointer;
		padding: 1rem;
	}

	.app-name {
		font-size: 1.4em;
		color: white;
		text-decoration: none;
		font-weight: 600;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-name {
		color: var(--text-color-1);
		font-size: 0.9rem;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.user-name {
			display: none;
		}

		.user-info {
			gap: 0.5rem;
		}

		.app-name {
			font-size: 1.2em;
		}
	}

	aside {
		position: fixed;
		top: 3.8rem;
		left: 0;
		bottom: 0;
		width: 250px;
		background-color: var(--background-color-2);
		color: var(--text-color-1);
		overflow-y: auto;
		box-shadow: 0 0 1em rgba(0, 0, 0, 0.15);
		z-index: 5;
		transition: 0.3s ease-in-out;
	}

	#app.nav-hidden aside {
		left: -250px;
		opacity: 0;
		pointer-events: none;
	}

	#content {
		margin-top: 3.8rem;
		padding: 1rem;
		margin-left: 250px;
		transition: margin-left 0.3s ease-in-out;
	}

	#app.nav-hidden #content {
		margin-left: 0;
	}

	@media only screen and (max-width: 768px) {
		#content {
			margin-left: 0;
			padding: 0.75rem;
		}
	}

	footer {
		font-size: 0.8rem;
		text-align: center;
		margin-top: 1rem;
		opacity: 0.6;
	}

	footer p {
		margin: 0.25rem 0;
	}
</style>
