<script lang="ts">
	import { page } from '$app/state';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import {
		faHome,
		faUserCog,
		faShieldAlt,
		faKey,
		faTimeline
	} from '@fortawesome/free-solid-svg-icons';
	import { PERMISSIONS } from '$lib/constants/permissions';

	type NavigationLink = {
		icon: IconDefinition;
		name: string;
		href: string;
		startsWith?: boolean;
		requiredPermissions?: string[];
	};

	type NavigationGroup = {
		name: string;
		links: NavigationLink[];
	};

	interface Props {
		userPermissions?: string[];
	}

	const { userPermissions = [] }: Props = $props();

	const navigationGroups: NavigationGroup[] = [
		{
			name: 'Dashboard',
			links: [
				{
					icon: faHome,
					name: 'Dashboard',
					href: '/panel'
				}
			]
		},
		{
			name: 'Administration',
			links: [
				{
					icon: faShieldAlt,
					name: 'Admin Dashboard',
					href: '/panel/admin',
					requiredPermissions: [PERMISSIONS.ADMIN]
				},
				{
					icon: faTimeline,
					name: 'Activity Logs',
					href: '/panel/admin/activity',
					requiredPermissions: [PERMISSIONS.VIEW_LOGS]
				}
			]
		},
		{
			name: 'User & Role Management',
			links: [
				{
					icon: faUserCog,
					name: 'User Management',
					href: '/panel/admin/users',
					requiredPermissions: [PERMISSIONS.MANAGE_USERS, PERMISSIONS.ADMIN]
				},
				{
					icon: faKey,
					name: 'Role Management',
					href: '/panel/admin/roles',
					requiredPermissions: [PERMISSIONS.MANAGE_ROLES, PERMISSIONS.ADMIN]
				}
			]
		}
	];

	// Filter navigation groups and links based on user permissions
	const filteredNavigationGroups = $derived(() => {
		return navigationGroups
			.map((group) => ({
				...group,
				links: group.links.filter((link) => {
					if (!link.requiredPermissions || link.requiredPermissions.length === 0) {
						return true;
					}

					// Check if user has any of the required permissions
					return link.requiredPermissions.every((permission) =>
						userPermissions.includes(permission)
					);
				})
			}))
			.filter((group) => group.links.length > 0); // Only show groups that have visible links
	});

	function isCurrent(link: NavigationLink) {
		const pathname = page.url.pathname.toLowerCase();

		if (link.href === pathname) {
			return true;
		} else if (link.startsWith && pathname.startsWith(link.href)) {
			for (const group of filteredNavigationGroups()) {
				for (const sublink of group.links) {
					if (pathname === sublink.href && link.name !== sublink.name) {
						return false;
					}
				}
			}
			return true;
		}
		return false;
	}
</script>

<nav>
	<ul>
		{#each filteredNavigationGroups() as group (group.name)}
			<li>
				<h2>{group.name}</h2>
				<ul>
					{#each group.links as link (link.name)}
						<li>
							<a href={link.href} aria-current={isCurrent(link) ? 'page' : undefined}>
								<div class="icon">
									<FontAwesomeIcon icon={link.icon} />
								</div>
								{link.name}
							</a>
						</li>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>
</nav>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	h2 {
		color: var(--text-color-2);
		padding: 0.8em;
		margin: 0;
		font-size: 0.9em;
		font-weight: 500;
		text-transform: uppercase;
	}

	a {
		display: flex;
		align-items: center;
		padding: 0.8em 1.5em;
		transition: 250ms;
		color: var(--text-color-1);
		font-weight: 300;
		text-decoration: none;
	}

	.icon {
		display: inline-flex;
		width: 1.1em;
		height: 1.1em;
		margin-right: 0.5em;
		align-items: center;
		justify-content: center;
	}

	a:hover,
	a:focus-visible {
		background-color: rgba(0, 0, 0, 0.25);
	}

	a[aria-current='page'] {
		background-color: var(--theme-color-1);
	}
</style>
