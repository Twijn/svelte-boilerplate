<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Heading from '$lib/components/layout/Heading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faHistory,
		faFilter,
		faDownload,
		faRefresh,
		faChevronLeft,
		faChevronRight,
		faSearch,
		faTimes,
		faCheckCircle,
		faTimesCircle,
		faClock
	} from '@fortawesome/free-solid-svg-icons';
	import Button from '$lib/components/ui/Button.svelte';

	const { data } = $props();

	let showFilters = $state(false);
	let filterForm = $state({
		userId: data.filters.userId || '',
		action: data.filters.action || '',
		category: data.filters.category || '',
		severity: data.filters.severity || '',
		success: data.filters.success !== undefined ? String(data.filters.success) : '',
		dateFrom: data.filters.dateFrom || '',
		dateTo: data.filters.dateTo || ''
	});

	const categories = [
		'authentication',
		'authorization',
		'user_management',
		'security',
		'system',
		'data',
		'api',
		'other'
	];
	const severities = ['critical', 'high', 'medium', 'low', 'info'];
	const actions = [
		'user.login.success',
		'user.login.failed',
		'user.register.success',
		'user.register.failed',
		'user.logout',
		'user.created',
		'user.updated',
		'user.deleted',
		'role.created',
		'role.updated',
		'role.deleted',
		'role.assigned',
		'role.removed',
		'permission.granted',
		'permission.revoked',
		'session.created',
		'session.expired',
		'password.changed',
		'password.reset.requested',
		'password.reset.completed',
		'account.locked',
		'account.unlocked',
		'rate_limit.exceeded'
	];

	function applyFilters() {
		const params = new URLSearchParams();

		if (filterForm.userId) params.set('userId', filterForm.userId);
		if (filterForm.action) params.set('action', filterForm.action);
		if (filterForm.category) params.set('category', filterForm.category);
		if (filterForm.severity) params.set('severity', filterForm.severity);
		if (filterForm.success) params.set('success', filterForm.success);
		if (filterForm.dateFrom) params.set('dateFrom', filterForm.dateFrom);
		if (filterForm.dateTo) params.set('dateTo', filterForm.dateTo);

		params.set('page', '1'); // Reset to first page

		goto(`?${params.toString()}`);
	}

	function clearFilters() {
		filterForm = {
			userId: '',
			action: '',
			category: '',
			severity: '',
			success: '',
			dateFrom: '',
			dateTo: ''
		};
		goto('/panel/admin/activity');
	}

	function changePage(newPage: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(newPage));
		goto(`?${params.toString()}`);
	}

	function exportLogs() {
		// Convert logs to CSV
		const headers = [
			'ID',
			'Timestamp',
			'User ID',
			'Action',
			'Category',
			'Severity',
			'Success',
			'Message',
			'IP Address'
		];
		const rows = data.activities.map((log) => [
			log.id,
			new Date(log.createdAt).toISOString(),
			log.userId || 'N/A',
			log.action,
			log.category,
			log.severity,
			log.success ? 'Yes' : 'No',
			log.message || '',
			log.ipAddress || 'N/A'
		]);

		const csv = [
			headers.join(','),
			...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
		].join('\n');

		// Download CSV
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatTimestamp(date: Date | string) {
		const d = new Date(date);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins} min ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

		return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'critical':
				return '#ff3b30';
			case 'high':
				return '#ff9500';
			case 'medium':
				return '#ffcc00';
			case 'low':
				return '#34c759';
			case 'info':
				return '#007aff';
			default:
				return '#8e8e93';
		}
	}

	function getCategoryColor(category: string) {
		switch (category) {
			case 'authentication':
				return '#007aff';
			case 'authorization':
				return '#5856d6';
			case 'user_management':
				return '#af52de';
			case 'security':
				return '#ff3b30';
			case 'system':
				return '#ff9500';
			case 'data':
				return '#34c759';
			case 'api':
				return '#00c7be';
			default:
				return '#8e8e93';
		}
	}

	function getStatusIcon(success: boolean) {
		return success ? faCheckCircle : faTimesCircle;
	}

	const hasActiveFilters = $derived(
		filterForm.userId ||
			filterForm.action ||
			filterForm.category ||
			filterForm.severity ||
			filterForm.success ||
			filterForm.dateFrom ||
			filterForm.dateTo
	);
</script>

<Heading
	text="Activity Logs"
	description="Comprehensive audit trail of all system activities"
	buttons={[
		{
			text: 'Export CSV',
			onClick: exportLogs
		},
		{
			text: 'Refresh',
			onClick: () => window.location.reload()
		}
	]}
/>

<!-- Stats Bar -->
<div class="stats-bar col-12">
	<div class="stat-item">
		<span class="stat-label">Total Logs</span>
		<span class="stat-value">{data.pagination.total.toLocaleString()}</span>
	</div>
	<div class="stat-item">
		<span class="stat-label">Success Rate</span>
		<span class="stat-value">
			{data.stats.total > 0 ? Math.round((data.stats.successful / data.stats.total) * 100) : 0}%
		</span>
	</div>
	<div class="stat-item">
		<span class="stat-label">Failed Actions</span>
		<span class="stat-value">{data.stats.failed.toLocaleString()}</span>
	</div>
	<div class="stat-item">
		<span class="stat-label">Page</span>
		<span class="stat-value">{data.pagination.page} / {data.pagination.totalPages}</span>
	</div>
</div>

<!-- Filter Toggle -->
<div class="col-12 filter-toggle">
	<Button onClick={() => (showFilters = !showFilters)}>
		<FontAwesomeIcon icon={faFilter} />
		{showFilters ? 'Hide' : 'Show'} Filters
		{#if hasActiveFilters}
			<span class="active-filter-badge">{Object.values(filterForm).filter((v) => v).length}</span>
		{/if}
	</Button>
	{#if hasActiveFilters}
		<Button onClick={clearFilters}>
			<FontAwesomeIcon icon={faTimes} />
			Clear All
		</Button>
	{/if}
</div>

<!-- Filters Panel -->
{#if showFilters}
	<div class="col-12 filters-panel">
		<div class="filter-grid">
			<div class="filter-group">
				<label for="userId">User ID</label>
				<input
					type="text"
					id="userId"
					bind:value={filterForm.userId}
					placeholder="Enter user ID..."
				/>
			</div>

			<div class="filter-group">
				<label for="action">Action</label>
				<select id="action" bind:value={filterForm.action}>
					<option value="">All Actions</option>
					{#each actions as action}
						<option value={action}>{action}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<label for="category">Category</label>
				<select id="category" bind:value={filterForm.category}>
					<option value="">All Categories</option>
					{#each categories as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<label for="severity">Severity</label>
				<select id="severity" bind:value={filterForm.severity}>
					<option value="">All Severities</option>
					{#each severities as severity}
						<option value={severity}>{severity}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<label for="success">Status</label>
				<select id="success" bind:value={filterForm.success}>
					<option value="">All Statuses</option>
					<option value="true">Success</option>
					<option value="false">Failed</option>
				</select>
			</div>

			<div class="filter-group">
				<label for="dateFrom">From Date</label>
				<input type="datetime-local" id="dateFrom" bind:value={filterForm.dateFrom} />
			</div>

			<div class="filter-group">
				<label for="dateTo">To Date</label>
				<input type="datetime-local" id="dateTo" bind:value={filterForm.dateTo} />
			</div>
		</div>

		<div class="filter-actions">
			<Button onClick={applyFilters}>
				<FontAwesomeIcon icon={faSearch} />
				Apply Filters
			</Button>
		</div>
	</div>
{/if}

<!-- Activity Table -->
<div class="col-12 table-container">
	<table>
		<thead>
			<tr>
				<th>Timestamp</th>
				<th>Action</th>
				<th>Category</th>
				<th>Severity</th>
				<th>User</th>
				<th>Status</th>
				<th>Message</th>
				<th>IP Address</th>
			</tr>
		</thead>
		<tbody>
			{#each data.activities as log}
				<tr class="log-row">
					<td class="timestamp-cell">
						<FontAwesomeIcon icon={faClock} />
						{formatTimestamp(log.createdAt)}
					</td>
					<td class="action-cell">
						<code>{log.action}</code>
					</td>
					<td>
						<span class="category-badge" style="border-color: {getCategoryColor(log.category)}">
							{log.category}
						</span>
					</td>
					<td>
						<span
							class="severity-badge"
							style="background: {getSeverityColor(log.severity)}20; color: {getSeverityColor(
								log.severity
							)}; border-color: {getSeverityColor(log.severity)}"
						>
							{log.severity}
						</span>
					</td>
					<td class="user-cell">
						{log.userId || 'N/A'}
					</td>
					<td>
						<span class="status-badge {log.success ? 'success' : 'failure'}">
							<FontAwesomeIcon icon={getStatusIcon(log.success)} />
							{log.success ? 'Success' : 'Failed'}
						</span>
					</td>
					<td class="message-cell">
						{log.message || 'N/A'}
					</td>
					<td class="ip-cell">
						<code>{log.ipAddress || 'N/A'}</code>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if data.activities.length === 0}
		<div class="empty-state">
			<FontAwesomeIcon icon={faHistory} size="3x" />
			<p>No activity logs found</p>
			{#if hasActiveFilters}
				<Button onClick={clearFilters}>Clear Filters</Button>
			{/if}
		</div>
	{/if}
</div>

<!-- Pagination -->
{#if data.pagination.totalPages > 1}
	<div class="pagination">
		<Button
			onClick={() => changePage(data.pagination.page - 1)}
			disabled={data.pagination.page === 1}
		>
			<FontAwesomeIcon icon={faChevronLeft} />
			Previous
		</Button>

		<div class="page-numbers">
			{#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
				const startPage = Math.max(1, Math.min(data.pagination.page - 2, data.pagination.totalPages - 4));
				return startPage + i;
			}) as pageNum}
				<button
					class="page-number {pageNum === data.pagination.page ? 'active' : ''}"
					onclick={() => changePage(pageNum)}
				>
					{pageNum}
				</button>
			{/each}
		</div>

		<Button
			onClick={() => changePage(data.pagination.page + 1)}
			disabled={data.pagination.page === data.pagination.totalPages}
		>
			Next
			<FontAwesomeIcon icon={faChevronRight} />
		</Button>
	</div>
{/if}

<style>
	/* Stats Bar */
	.stats-bar {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.stat-item {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		color: var(--text-color-2);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		color: var(--text-color-1);
		font-size: 1.35rem;
		font-weight: 700;
	}

	/* Filter Toggle */
	.filter-toggle {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.active-filter-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 0.5rem;
		background: var(--theme-color-2);
		color: white;
		border-radius: 10px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	/* Filters Panel */
	.filters-panel {
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group label {
		color: var(--text-color-2);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.filter-group input,
	.filter-group select {
		padding: 0.5rem;
		background: var(--background-color-1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--text-color-1);
		font-size: 0.8rem;
	}

	.filter-group input:focus,
	.filter-group select:focus {
		outline: none;
		border-color: var(--theme-color-2);
	}

	.filter-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	/* Activity Table */
	.table-container {
		margin-bottom: 1rem;
	}

	th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	td {
		color: var(--text-color-2);
		font-size: 0.85rem;
	}

	.timestamp-cell {
		color: var(--text-color-3);
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.action-cell code {
		font-family: 'Fira Code', monospace;
		font-size: 0.8rem;
		color: var(--theme-color-2);
	}

	.user-cell {
		font-family: 'Fira Code', monospace;
		font-size: 0.8rem;
	}

	.ip-cell code {
		font-family: 'Fira Code', monospace;
		font-size: 0.8rem;
		color: var(--text-color-3);
	}

	.message-cell {
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.category-badge,
	.severity-badge {
		display: inline-block;
		padding: 0.25rem 0.6rem;
		border-radius: 1rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.category-badge {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid;
	}

	.severity-badge {
		border: 1px solid;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.6rem;
		border-radius: 1rem;
		font-size: 0.7rem;
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

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	.page-numbers {
		display: flex;
		gap: 0.5rem;
	}

	.page-number {
		padding: 0.5rem 0.75rem;
		background: var(--background-color-2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--text-color-2);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.page-number:hover {
		background: var(--background-color-1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.page-number.active {
		background: var(--theme-color-2);
		color: white;
		border-color: var(--theme-color-2);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		color: var(--text-color-3);
		text-align: center;
		gap: 0.75rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.pagination {
			flex-direction: column;
		}

		.stats-bar {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
