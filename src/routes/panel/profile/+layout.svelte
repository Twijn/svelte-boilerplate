<script lang="ts">
	import { page } from '$app/state';
	import Heading from '$lib/components/layout/Heading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUser,
		faLock,
		faEnvelope,
		faShieldAlt,
		faExclamationTriangle,
		faHistory,
		faDesktop
	} from '@fortawesome/free-solid-svg-icons';
	import { APP_NAME } from '$lib/consts';

	const tabs = [
		{ path: '/panel/profile', label: 'Profile', icon: faUser },
		{ path: '/panel/profile/password', label: 'Password', icon: faLock },
		{ path: '/panel/profile/email', label: 'Email', icon: faEnvelope },
		{ path: '/panel/profile/security', label: 'Security', icon: faShieldAlt },
		{ path: '/panel/profile/sessions', label: 'Sessions', icon: faDesktop },
		{ path: '/panel/profile/activity', label: 'Activity', icon: faHistory },
		{
			path: '/panel/profile/danger',
			label: 'Danger Zone',
			icon: faExclamationTriangle,
			isDanger: true
		}
	];
</script>

<svelte:head>
	<title>Profile Settings | {APP_NAME}</title>
</svelte:head>

<Heading text="Profile Settings" description="Manage your account settings and preferences" />

<!-- Tab Navigation -->
<div class="tabs col-12">
	{#each tabs as tab (tab.path)}
		<a
			href={tab.path}
			class="tab"
			class:active={page.url.pathname === tab.path}
			class:danger={tab.isDanger}
		>
			<FontAwesomeIcon icon={tab.icon} />
			{tab.label}
		</a>
	{/each}
</div>

<slot />

<style>
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid rgba(255, 255, 255, 0.1);
		overflow-x: auto;
		padding-bottom: 0;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: none;
		border: none;
		color: var(--text-color-2);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border-bottom: 3px solid transparent;
		white-space: nowrap;
		text-decoration: none;
		font-family: var(--font-family);
	}

	.tab:hover {
		color: var(--text-color-1);
		background: rgba(255, 255, 255, 0.05);
	}

	.tab.active {
		color: var(--theme-color-2);
		border-bottom-color: var(--theme-color-2);
		font-weight: 600;
	}

	.tab.danger {
		color: rgba(var(--red), 0.8);
	}

	.tab.danger:hover {
		color: rgb(var(--red));
	}

	.tab.danger.active {
		color: rgb(var(--red));
		border-bottom-color: rgb(var(--red));
	}

	@media (max-width: 768px) {
		.tabs {
			gap: 0.25rem;
		}

		.tab {
			padding: 0.75rem 1rem;
			font-size: 0.9rem;
		}
	}
</style>
