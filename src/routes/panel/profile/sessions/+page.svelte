<script lang="ts">
	import ProfileTab from '$lib/components/ui/ProfileTab.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	function formatDate(date: Date): string {
		return new Date(date).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<ProfileTab title="Active Sessions" description="Manage your active sessions across all devices">
	{#if data.sessions && data.sessions.length > 0}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>Session ID</th>
						<th>Expires At</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.sessions as session (session.id)}
						<tr class:current={session.id === data.currentSessionId}>
							<td>
								{#if session.id === data.currentSessionId}
									<span class="badge badge-primary">Current Session</span>
								{/if}
								<code>{session.id.substring(0, 16)}...</code>
							</td>
							<td>
								{formatDate(session.expiresAt)}
							</td>
							<td>
								{#if session.id !== data.currentSessionId}
									<form method="POST" action="?/revokeSession" use:enhance>
										<input type="hidden" name="sessionId" value={session.id} />
										<Button type="submit" variant="error">Revoke</Button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.sessions.length > 1}
			<div class="revoke-all-section">
				<form method="POST" action="?/revokeAllSessions" use:enhance>
					<Button type="submit" variant="error">
						Revoke All Other Sessions ({data.sessions.length - 1})
					</Button>
				</form>
				<p class="revoke-all-description">
					This will log you out from all other devices, but keep you logged in on this one.
				</p>
			</div>
		{/if}
	{:else}
		<div class="empty-state">
			<p>No active sessions found.</p>
		</div>
	{/if}
</ProfileTab>

<style>
	.revoke-all-section {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.revoke-all-description {
		color: var(--text-secondary);
		font-size: 0.9rem;
		margin-top: 0.5rem;
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-secondary);
	}
</style>
