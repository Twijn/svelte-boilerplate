<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faHistory,
		faCheckCircle,
		faTimesCircle,
		faClock
	} from '@fortawesome/free-solid-svg-icons';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { goto } from '$app/navigation';
	import { page as pageStore } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';

	const { data } = $props();

	function changePage(newPage: number) {
		const params = new SvelteURLSearchParams(pageStore.url.searchParams);
		params.set('page', String(newPage));
		goto(`?${params.toString()}`);
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
			case 'error':
				return '#ff9500';
			case 'warning':
				return '#ffcc00';
			case 'info':
				return '#007aff';
			case 'debug':
				return '#8e8e93';
			default:
				return '#8e8e93';
		}
	}

	function getCategoryColor(category: string) {
		switch (category) {
			case 'auth':
				return '#007aff';
			case 'user':
				return '#af52de';
			case 'role':
				return '#5856d6';
			case 'permission':
				return '#ff2d55';
			case 'security':
				return '#ff3b30';
			case 'system':
				return '#ff9500';
			case 'api':
				return '#00c7be';
			case 'database':
				return '#34c759';
			default:
				return '#8e8e93';
		}
	}

	function getStatusIcon(success: boolean) {
		return success ? faCheckCircle : faTimesCircle;
	}
</script>

<ProfileTab title="Activity Log" description="View your recent account activity and login history">
	<div class="table-container col-12">
		<table>
			<thead>
				<tr>
					<th>Timestamp</th>
					<th>Action</th>
					<th>Category</th>
					<th>Status</th>
					<th>Message</th>
					<th>IP Address</th>
				</tr>
			</thead>
			<tbody>
				{#each data.activities as log (log.id)}
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
			</div>
		{/if}
	</div>

	{#if data.pagination.totalPages > 1}
		<Pagination
			currentPage={data.pagination.page}
			totalPages={data.pagination.totalPages}
			{changePage}
		/>
	{/if}
</ProfileTab>

<style>
	.table-container {
		margin-bottom: 1rem;
	}

	.timestamp-cell {
		color: var(--text-color-3);
		font-size: 0.8rem;
		white-space: nowrap;
		opacity: 0.5;
	}

	.timestamp-cell :global(svg) {
		opacity: 0.5;
	}

	.action-cell code {
		font-family: 'Fira Code', monospace;
		font-size: 0.8rem;
		color: var(--theme-color-2);
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

	.category-badge {
		display: inline-block;
		padding: 0.25rem 0.6rem;
		border-radius: 1rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: rgba(255, 255, 255, 0.05);
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

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: var(--text-color-3);
		text-align: center;
		gap: 1rem;
	}

	.empty-state p {
		margin: 0;
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.message-cell {
			max-width: 150px;
		}
	}
</style>
