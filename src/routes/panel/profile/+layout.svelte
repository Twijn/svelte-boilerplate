<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Heading from '$lib/components/layout/Heading.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import type { Snippet } from 'svelte';
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

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	const tabs = [
		{ id: '/panel/profile', path: '/panel/profile', label: 'Profile', icon: faUser },
		{
			id: '/panel/profile/password',
			path: '/panel/profile/password',
			label: 'Password',
			icon: faLock
		},
		{ id: '/panel/profile/email', path: '/panel/profile/email', label: 'Email', icon: faEnvelope },
		{
			id: '/panel/profile/security',
			path: '/panel/profile/security',
			label: 'Security',
			icon: faShieldAlt
		},
		{
			id: '/panel/profile/sessions',
			path: '/panel/profile/sessions',
			label: 'Sessions',
			icon: faDesktop
		},
		{
			id: '/panel/profile/activity',
			path: '/panel/profile/activity',
			label: 'Activity',
			icon: faHistory
		},
		{
			id: '/panel/profile/danger',
			path: '/panel/profile/danger',
			label: 'Danger Zone',
			icon: faExclamationTriangle,
			isDanger: true
		}
	];

	// Get current active tab based on URL
	let activeTab = $derived(page.url.pathname);

	function handleTabChange(tabId: string) {
		// Find the tab with this ID and navigate to it
		const tab = tabs.find((t) => t.id === tabId);
		if (tab) {
			goto(tab.path);
		}
	}
</script>

<svelte:head>
	<title>Profile Settings | {APP_NAME}</title>
</svelte:head>

<Heading text="Profile Settings" description="Manage your account settings and preferences" />

<div class="col-12">
	<Tabs {tabs} {activeTab} onTabChange={handleTabChange}>
		{#snippet content()}
			{@render children()}
		{/snippet}
	</Tabs>
</div>
