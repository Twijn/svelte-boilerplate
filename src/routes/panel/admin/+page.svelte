<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUsers,
		faShield,
		faChartLine,
		faUserTie,
		faHistory,
		faExclamationTriangle,
		faLock,
		faCheckCircle,
		faTimesCircle,
		faClock
	} from '@fortawesome/free-solid-svg-icons';
	import { APP_NAME } from '$lib/consts';
	import Heading from '$lib/components/layout/Heading.svelte';

	const { data } = $props();

	function formatTimestamp(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - new Date(date).getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} min ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return new Date(date).toLocaleDateString();
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'critical':
				return 'rgb(var(--red))';
			case 'error':
				return 'rgb(255, 100, 90)';
			case 'warning':
				return 'rgb(var(--orange))';
			case 'info':
				return 'rgb(var(--blue))';
			case 'debug':
				return 'rgb(var(--text-color-3))';
			default:
				return 'rgb(var(--text-color-2))';
		}
	}

	function getCategoryColor(category: string): string {
		switch (category) {
			case 'auth':
				return 'rgb(var(--blue))';
			case 'security':
				return 'rgb(var(--red))';
			case 'user':
				return 'rgb(var(--green))';
			case 'role':
				return 'rgb(var(--orange))';
			case 'system':
				return 'rgb(var(--purple))';
			default:
				return 'rgb(var(--text-color-2))';
		}
	}

	function getActionIcon(action: string) {
		if (action.includes('login') && action.includes('failed')) return faTimesCircle;
		if (action.includes('login')) return faCheckCircle;
		if (action.includes('lock')) return faLock;
		if (action.includes('security')) return faExclamationTriangle;
		return faHistory;
	}
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
		<div class="stat-icon activity">
			<FontAwesomeIcon icon={faChartLine} size="2x" />
		</div>
		<div class="stat-content">
			<h3>{data.stats.totalActivityToday}</h3>
			<p>Activity (24h)</p>
		</div>
	</div>
</div>

<div class="col-3 col-md-6 col-sm-12">
	<div class="stat-card">
		<div class="stat-icon security">
			<FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
		</div>
		<div class="stat-content">
			<h3>{data.stats.failedLoginsToday}</h3>
			<p>Failed Logins (24h)</p>
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

<!-- Activity Logs Dashboard -->
<div class="col-12">
	<div class="activity-section">
		<div class="section-header">
			<div class="section-title">
				<FontAwesomeIcon icon={faHistory} size="lg" />
				<h2>Recent Activity</h2>
			</div>
			<Button href="/panel/admin/activity" variant="secondary">View All</Button>
		</div>

		<div class="activity-grid">
			<!-- Recent Activity -->
			<div class="activity-panel">
				<h3>Latest Events</h3>
				<div class="activity-list">
					{#each data.recentActivity as activity (activity.id)}
						<div class="activity-item">
							<div class="activity-icon" style="color: {getCategoryColor(activity.category)}">
								<FontAwesomeIcon icon={getActionIcon(activity.action)} />
							</div>
							<div class="activity-details">
								<div class="activity-header">
									<span class="activity-action">{activity.action}</span>
									<span
										class="activity-severity"
										style="color: {getSeverityColor(activity.severity)}"
									>
										{activity.severity}
									</span>
								</div>
								{#if activity.message}
									<p class="activity-message">{activity.message}</p>
								{/if}
								<div class="activity-meta">
									{#if activity.ipAddress}
										<span>IP: {activity.ipAddress}</span>
									{/if}
									<span>
										<FontAwesomeIcon icon={faClock} />
										{formatTimestamp(activity.createdAt)}
									</span>
								</div>
							</div>
							<div class="activity-status">
								{#if activity.success}
									<span class="status-badge success">
										<FontAwesomeIcon icon={faCheckCircle} />
										Success
									</span>
								{:else}
									<span class="status-badge failure">
										<FontAwesomeIcon icon={faTimesCircle} />
										Failed
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Security Events -->
			<div class="activity-panel security-panel">
				<h3>
					<FontAwesomeIcon icon={faExclamationTriangle} />
					Security Events
				</h3>
				<div class="activity-list">
					{#each data.securityEvents as event (event.id)}
						<div class="security-item">
							<div
								class="security-severity"
								style="background: {getSeverityColor(event.severity)}"
							></div>
							<div class="security-details">
								<div class="security-action">{event.action}</div>
								{#if event.message}
									<p class="security-message">{event.message}</p>
								{/if}
								<div class="security-meta">
									{#if event.ipAddress}
										<span>{event.ipAddress}</span>
									{/if}
									<span>{formatTimestamp(event.createdAt)}</span>
								</div>
							</div>
						</div>
					{/each}
					{#if data.securityEvents.length === 0}
						<div class="empty-state">
							<FontAwesomeIcon icon={faCheckCircle} size="2x" />
							<p>No security events in the last 24 hours</p>
						</div>
					{/if}
				</div>
			</div>
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

	.stat-icon.security {
		background: rgba(255, 59, 48, 0.2);
		color: rgb(255, 100, 90);
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

	/* Activity Section */
	.activity-section {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: var(--theme-color-2);
	}

	.section-title h2 {
		margin: 0;
		color: var(--text-color-1);
		font-size: 1.5rem;
		font-weight: 600;
	}

	.activity-grid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2rem;
	}

	.activity-panel {
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.activity-panel h3 {
		margin: 0 0 1rem 0;
		color: var(--text-color-1);
		font-size: 1.1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.activity-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 600px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.activity-list::-webkit-scrollbar {
		width: 6px;
	}

	.activity-list::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
	}

	.activity-list::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
	}

	.activity-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.activity-item:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateX(2px);
	}

	.activity-icon {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.activity-details {
		flex: 1;
		min-width: 0;
	}

	.activity-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.25rem;
	}

	.activity-action {
		font-weight: 600;
		color: var(--text-color-1);
		font-size: 0.9rem;
		font-family: var(--font-family-mono);
	}

	.activity-severity {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.activity-message {
		color: var(--text-color-2);
		font-size: 0.85rem;
		margin: 0.25rem 0;
		line-height: 1.4;
	}

	.activity-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: var(--text-color-3);
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}

	.activity-status {
		flex-shrink: 0;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.6rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.status-badge.success {
		background: rgba(52, 199, 89, 0.15);
		color: rgb(60, 220, 100);
		border: 1px solid rgba(52, 199, 89, 0.3);
	}

	.status-badge.failure {
		background: rgba(255, 59, 48, 0.15);
		color: rgb(255, 100, 90);
		border: 1px solid rgba(255, 59, 48, 0.3);
	}

	/* Security Panel */
	.security-panel {
		background: linear-gradient(135deg, rgba(255, 59, 48, 0.05), rgba(255, 149, 0, 0.05));
		border-color: rgba(255, 59, 48, 0.2);
	}

	.security-item {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		position: relative;
		overflow: hidden;
	}

	.security-severity {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
	}

	.security-details {
		flex: 1;
		padding-left: 0.5rem;
	}

	.security-action {
		font-weight: 600;
		color: var(--text-color-1);
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
		font-family: var(--font-family-mono);
	}

	.security-message {
		color: var(--text-color-2);
		font-size: 0.85rem;
		margin: 0.25rem 0;
		line-height: 1.4;
	}

	.security-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: var(--text-color-3);
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: var(--text-color-3);
		text-align: center;
	}

	.empty-state p {
		margin: 1rem 0 0 0;
		font-size: 0.9rem;
	}

	@media (max-width: 1024px) {
		.activity-grid {
			grid-template-columns: 1fr;
		}
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

		.activity-section {
			padding: 1.5rem;
		}

		.section-header {
			flex-direction: column;
			gap: 1rem;
		}

		.activity-item {
			flex-direction: column;
		}

		.activity-status {
			align-self: flex-start;
		}
	}
</style>
