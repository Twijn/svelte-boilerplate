<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUsers,
		faShield,
		faKey,
		faChartLine,
		faUserTie
	} from '@fortawesome/free-solid-svg-icons';
	import { APP_NAME } from '$lib/consts';
	import Heading from '$lib/components/layout/Heading.svelte';

	const { data } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard | {APP_NAME}</title>
</svelte:head>

<Heading text="Admin Dashboard" description="Manage users, roles, and system permissions" />

<!-- Stats Cards -->
<div class="col-3 col-md-6 col-sm-12">
	<div class="stat-card">
		<div class="stat-icon users">
			<FontAwesomeIcon icon={faUsers} size="2x" />
		</div>
		<div class="stat-content">
			<h3>{data.stats.totalUsers}</h3>
			<p>Total Users</p>
		</div>
	</div>
</div>

<div class="col-3 col-md-6 col-sm-12">
	<div class="stat-card">
		<div class="stat-icon roles">
			<FontAwesomeIcon icon={faShield} size="2x" />
		</div>
		<div class="stat-content">
			<h3>{data.stats.totalRoles}</h3>
			<p>System Roles</p>
		</div>
	</div>
</div>

<div class="col-3 col-md-6 col-sm-12">
	<div class="stat-card">
		<div class="stat-icon permissions">
			<FontAwesomeIcon icon={faKey} size="2x" />
		</div>
		<div class="stat-content">
			<h3>Active</h3>
			<p>Permission System</p>
		</div>
	</div>
</div>

<div class="col-3 col-md-6 col-sm-12">
	<div class="stat-card">
		<div class="stat-icon activity">
			<FontAwesomeIcon icon={faChartLine} size="2x" />
		</div>
		<div class="stat-content">
			<h3>Online</h3>
			<p>System Status</p>
		</div>
	</div>
</div>

<!-- Management Cards -->
<div class="col-6 col-md-12">
	<div class="management-card">
		<div class="card-header">
			<div class="card-icon">
				<FontAwesomeIcon icon={faUsers} size="2x" />
			</div>
			<div class="card-title">
				<h3>User Management</h3>
				<p>Manage user accounts, roles, and permissions</p>
			</div>
		</div>

		<div class="card-content">
			<ul class="feature-list">
				<li>View all registered users</li>
				<li>Assign and remove user roles</li>
				<li>Monitor user activity</li>
				<li>Manage user permissions</li>
			</ul>
		</div>

		<div class="card-actions">
			<Button href="/panel/admin/users" variant="primary" arrow>Manage Users</Button>
		</div>
	</div>
</div>

<div class="col-6 col-md-12">
	<div class="management-card">
		<div class="card-header">
			<div class="card-icon">
				<FontAwesomeIcon icon={faUserTie} size="2x" />
			</div>
			<div class="card-title">
				<h3>Role Management</h3>
				<p>Create and manage system roles and permissions</p>
			</div>
		</div>

		<div class="card-content">
			<ul class="feature-list">
				<li>Create custom roles</li>
				<li>Configure role permissions</li>
				<li>View role assignments</li>
				<li>Manage system roles</li>
			</ul>
		</div>

		<div class="card-actions">
			<Button href="/panel/admin/roles" variant="primary" arrow>Manage Roles</Button>
		</div>
	</div>
</div>

<div class="col-6 col-md-12">
	<div class="management-card">
		<div class="card-header">
			<div class="card-icon locked">
				<FontAwesomeIcon icon={faUserTie} size="2x" />
			</div>
			<div class="card-title">
				<h3>Account Security</h3>
				<p>View and manage locked user accounts</p>
			</div>
		</div>

		<div class="card-content">
			<ul class="feature-list">
				<li>View locked accounts</li>
				<li>Unlock user accounts</li>
				<li>Monitor failed login attempts</li>
				<li>Manage account lockouts</li>
			</ul>
		</div>

		<div class="card-actions">
			<Button href="/panel/admin/locked-accounts" variant="primary" arrow>Locked Accounts</Button>
		</div>
	</div>
</div>

<style>
	.stat-card {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.stat-icon {
		flex-shrink: 0;
		width: 60px;
		height: 60px;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-icon.users {
		background: rgba(var(--blue), 0.2);
		color: rgb(var(--blue));
	}

	.stat-icon.roles {
		background: rgba(var(--red), 0.2);
		color: rgb(var(--red));
	}

	.stat-icon.permissions {
		background: rgba(var(--green), 0.2);
		color: rgb(var(--green));
	}

	.stat-icon.activity {
		background: rgba(var(--orange), 0.2);
		color: rgb(var(--orange));
	}

	.stat-content h3 {
		color: var(--text-color-1);
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.25rem 0;
	}

	.stat-content p {
		color: var(--text-color-2);
		font-size: 0.9rem;
		margin: 0;
		font-weight: 500;
	}

	/* Management Cards */
	.management-card {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.management-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		gap: 1.5rem;
	}

	.card-icon {
		flex-shrink: 0;
		width: 60px;
		height: 60px;
		border-radius: 1rem;
		background: linear-gradient(135deg, var(--theme-color-1), var(--theme-color-2));
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.card-title h3 {
		color: var(--text-color-1);
		font-size: 1.3rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.card-title p {
		color: var(--text-color-2);
		font-size: 0.9rem;
		margin: 0;
		line-height: 1.4;
	}

	.card-content {
		flex: 1;
	}

	.feature-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.feature-list li {
		color: var(--text-color-2);
		padding: 0.5rem 0;
		position: relative;
		padding-left: 1.5rem;
		font-size: 0.9rem;
	}

	.feature-list li::before {
		content: '•';
		color: var(--theme-color-2);
		font-weight: bold;
		position: absolute;
		left: 0;
		top: 0.5rem;
	}

	.card-actions {
		margin-top: auto;
	}

	@media (max-width: 768px) {
		.stat-card,
		.management-card {
			padding: 1.5rem;
		}

		.card-header {
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 1rem;
		}
	}
</style>
